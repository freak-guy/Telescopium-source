/**
 * Telescopium Blog — 轻量评论系统 API
 *
 * 挂载方式（在现有 Express app 中）：
 *   const commentsRouter = require('./comments-api');
 *   app.use('/api/comments', commentsRouter);
 *
 * 数据库文件：data/comments.db（自动创建）
 */

const express = require('express');
const crypto = require('crypto');
const path = require('path');
const fs = require('fs');

// ─── SQLite 初始化 ───────────────────────────────────────────────
const Database = require('better-sqlite3');

const DATA_DIR = path.join(__dirname, 'data');
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

const DB_PATH = path.join(DATA_DIR, 'comments.db');
const db = new Database(DB_PATH);

// 启用 WAL 模式提升并发性能
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

// 建表
db.exec(`
  CREATE TABLE IF NOT EXISTS comments (
    id         INTEGER PRIMARY KEY AUTOINCREMENT,
    path       TEXT    NOT NULL,
    page_title TEXT,
    author     TEXT    NOT NULL,
    content    TEXT    NOT NULL,
    status     TEXT    NOT NULL DEFAULT 'approved',
    ip_hash    TEXT,
    ua_hash    TEXT,
    created_at TEXT    NOT NULL
  );

  CREATE INDEX IF NOT EXISTS idx_comments_path_status_created
    ON comments(path, status, created_at);
`);

// ─── 工具函数 ────────────────────────────────────────────────────

/** 北京时间格式化：YYYY-MM-DD HH:mm */
function beijingTime() {
  const now = new Date();
  // UTC+8
  const d = new Date(now.getTime() + 8 * 60 * 60 * 1000);
  const Y = d.getUTCFullYear();
  const M = String(d.getUTCMonth() + 1).padStart(2, '0');
  const D = String(d.getUTCDate()).padStart(2, '0');
  const h = String(d.getUTCHours()).padStart(2, '0');
  const m = String(d.getUTCMinutes()).padStart(2, '0');
  return `${Y}-${M}-${D} ${h}:${m}`;
}

/** SHA-256 哈希（不存明文 IP/UA） */
function sha256(str) {
  return crypto.createHash('sha256').update(str).digest('hex');
}

/** 从 req 获取客户端 IP */
function getClientIp(req) {
  return (
    req.headers['x-forwarded-for']?.split(',')[0]?.trim() ||
    req.headers['x-real-ip'] ||
    req.connection?.remoteAddress ||
    req.socket?.remoteAddress ||
    ''
  );
}

/** 统计文本中的链接数量 */
function countLinks(text) {
  const matches = text.match(/https?:\/\//gi);
  return matches ? matches.length : 0;
}

/** 转义 HTML 特殊字符 */
function escapeHtml(str) {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

// ─── 限流（内存，同 IP 10 分钟内最多 5 条） ──────────────────────
const rateLimitMap = new Map(); // ip_hash -> [{time}, ...]

const RATE_WINDOW_MS = 10 * 60 * 1000; // 10 分钟
const RATE_MAX = 5;                     // 最多 5 条

function checkRateLimit(ipHash) {
  const now = Date.now();
  const records = rateLimitMap.get(ipHash) || [];

  // 清理过期记录
  const active = records.filter(r => now - r.time < RATE_WINDOW_MS);

  if (active.length >= RATE_MAX) {
    return false; // 触发限流
  }

  active.push({ time: now });
  rateLimitMap.set(ipHash, active);
  return true;
}

// 定期清理限流 Map，防止内存泄漏
setInterval(() => {
  const now = Date.now();
  for (const [key, records] of rateLimitMap.entries()) {
    const active = records.filter(r => now - r.time < RATE_WINDOW_MS);
    if (active.length === 0) {
      rateLimitMap.delete(key);
    } else {
      rateLimitMap.set(key, active);
    }
  }
}, 5 * 60 * 1000); // 每 5 分钟清理

// ─── CORS ───────────────────────────────────────────────────────
const ALLOWED_ORIGINS = [
  'https://blog.telescopium.top',
  'https://telescopium.top',
  'http://localhost:4000',
  'http://localhost:8080',
];

function setCORS(req, res) {
  const origin = req.headers.origin;
  if (origin && ALLOWED_ORIGINS.includes(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
  }
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Access-Control-Max-Age', '86400');
}

// ─── Router ──────────────────────────────────────────────────────
const router = express.Router();

// CORS 预检
router.options('/', (req, res) => {
  setCORS(req, res);
  res.status(204).end();
});

// JSON 解析中间件（如果主 app 未启用）
router.use(express.json());

// 每个请求设置 CORS 头
router.use((req, res, next) => {
  setCORS(req, res);
  next();
});

/**
 * GET /api/comments?path=/文章路径/
 * 按文章路径获取已发布评论（正序）
 */
router.get('/', (req, res) => {
  try {
    const articlePath = (req.query.path || '').trim();

    if (!articlePath || !articlePath.startsWith('/')) {
      return res.status(400).json({
        code: 400,
        message: '参数 path 必须以 / 开头',
      });
    }

    const stmt = db.prepare(
      'SELECT id, path, author, content, created_at FROM comments WHERE path = ? AND status = ? ORDER BY created_at ASC'
    );
    const rows = stmt.all(articlePath, 'approved');

    return res.json({
      code: 200,
      data: rows,
    });
  } catch (err) {
    console.error('[comments] GET error:', err.message);
    return res.status(500).json({
      code: 500,
      message: '服务器错误',
    });
  }
});

/**
 * POST /api/comments
 * 提交新评论
 */
router.post('/', (req, res) => {
  try {
    const { path: articlePath, page_title, author, content, website } = req.body || {};

    // ── 蜜罐检测：website 字段有值直接假装成功 ──
    if (website !== undefined && website !== null && String(website).trim() !== '') {
      // 垃圾评论，假装成功但不入库
      return res.json({
        code: 200,
        message: '评论发布成功',
        data: { id: 0 },
      });
    }

    // ── 必填字段校验 ──
    const rawPath = (articlePath || '').trim();
    const rawAuthor = (author || '').trim();
    const rawContent = (content || '').trim();
    const rawTitle = (page_title || '').trim();

    if (!rawPath || !rawPath.startsWith('/')) {
      return res.status(400).json({
        code: 400,
        message: '参数 path 必须以 / 开头',
      });
    }

    if (!rawAuthor) {
      return res.status(400).json({
        code: 400,
        message: '请填写用户名',
      });
    }

    if (rawAuthor.length > 24) {
      return res.status(400).json({
        code: 400,
        message: '用户名不能超过 24 个字符',
      });
    }

    if (!rawContent) {
      return res.status(400).json({
        code: 400,
        message: '请填写评论内容',
      });
    }

    if (rawContent.length > 1000) {
      return res.status(400).json({
        code: 400,
        message: '评论内容不能超过 1000 个字符',
      });
    }

    // ── 链接数量检测 ──
    if (countLinks(rawContent) > 2) {
      return res.status(400).json({
        code: 400,
        message: '评论中链接数量不能超过 2 个',
      });
    }

    // ── IP 限流 ──
    const clientIp = getClientIp(req);
    const ipHash = sha256(clientIp + 'telescopium-salt-2026');
    if (!checkRateLimit(ipHash)) {
      return res.status(429).json({
        code: 429,
        message: '评论过于频繁，请稍后再试',
      });
    }

    // ── 安全清理 ──
    const safeAuthor = escapeHtml(rawAuthor);
    const safeContent = escapeHtml(rawContent);
    const safeTitle = rawTitle.length > 200 ? rawTitle.substring(0, 200) : rawTitle;
    const uaHash = sha256((req.headers['user-agent'] || '') + 'ua-salt');

    const createdAt = beijingTime();

    // ── 写入数据库 ──
    const stmt = db.prepare(
      'INSERT INTO comments (path, page_title, author, content, status, ip_hash, ua_hash, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)'
    );
    const result = stmt.run(rawPath, safeTitle, safeAuthor, safeContent, 'approved', ipHash, uaHash, createdAt);

    return res.json({
      code: 200,
      message: '评论发布成功',
      data: { id: result.lastInsertRowid },
    });
  } catch (err) {
    console.error('[comments] POST error:', err.message);
    return res.status(500).json({
      code: 500,
      message: '服务器错误',
    });
  }
});

module.exports = router;
