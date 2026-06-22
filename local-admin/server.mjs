/**
 * Telescopium Blog — 本地图形化发文工作台
 * 监听 127.0.0.1:5050，不对外暴露
 * 项目根目录 = local-admin 的上一级目录
 */

import express from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { spawn, exec } from 'child_process';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 项目根目录 = local-admin/..
const PROJECT_ROOT = path.resolve(__dirname, '..');

const POSTS_DIR = path.join(PROJECT_ROOT, 'source', '_posts');
const COVERS_DIR = path.join(PROJECT_ROOT, 'source', 'assets', 'images', 'posts');
const ASSETS_COVERS = path.join(PROJECT_ROOT, 'source', 'assets', 'images', 'covers');

const PORT = 5050;
const HOST = '127.0.0.1';

// ── Express ──
const app = express();
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// ── Multer (封面上传) ──
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10 MB
  fileFilter(req, file, cb) {
    const ext = path.extname(file.originalname).toLowerCase();
    const allowed = ['.png', '.jpg', '.jpeg', '.webp'];
    if (allowed.includes(ext)) return cb(null, true);
    cb(new Error(`不支持的格式 ${ext}，请使用 png / jpg / jpeg / webp`));
  },
});

// ── 工具函数 ──
function beijingISO() {
  const d = new Date();
  const off = d.getTimezoneOffset() * 60000;
  const local = new Date(d.getTime() - off + 8 * 3600000);
  return local.toISOString().replace('T', ' ').replace(/\..+/, '');
}

function slugify(text) {
  return text
    .replace(/[^a-zA-Z0-9一-鿿\s-]/g, '')
    .replace(/[一-鿿]+/g, '')
    .replace(/[^a-zA-Z0-9\s-]/g, '')
    .trim()
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}

function defaultCoverPath(category) {
  // 按分类选默认封面，优先 .png
  const map = {
    Research: 'research-cover',
    Medicine: 'medicine-cover',
    AI: 'ai-tools-cover',
    Tech: 'ai-tools-cover',
    Reading: 'personal-logs-cover',
    Notes: 'personal-logs-cover',
  };
  const base = map[category] || 'default-cover';
  const pngPath = path.join(ASSETS_COVERS, `${base}.png`);
  const webpPath = path.join(ASSETS_COVERS, `${base}.webp`);
  if (fs.existsSync(pngPath)) return `/assets/images/covers/${base}.png`;
  if (fs.existsSync(webpPath)) return `/assets/images/covers/${base}.webp`;
  return '/assets/images/covers/default-cover.png';
}

function execCmd(cmd, args, opts = {}) {
  return new Promise((resolve) => {
    const child = spawn(cmd, args, { cwd: PROJECT_ROOT, ...opts });
    let out = '';
    let err = '';
    child.stdout.on('data', (d) => { out += d.toString(); });
    child.stderr.on('data', (d) => { err += d.toString(); });
    child.on('close', (code) => {
      resolve({ success: code === 0, code, stdout: out, stderr: err });
    });
    child.on('error', (e) => {
      resolve({ success: false, code: -1, stdout: out, stderr: e.message });
    });
  });
}

// ── API ──

// 根据标题生成 slug
app.post('/api/slug', (req, res) => {
  const { title } = req.body || {};
  let slug = slugify(title || '');
  if (!slug) slug = `post-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}`;
  res.json({ slug });
});

// 获取现有文章 slug 列表（用于防重复提示）
app.get('/api/existing-posts', (req, res) => {
  try {
    const files = fs.readdirSync(POSTS_DIR).filter(f => f.endsWith('.md')).map(f => f.replace('.md', ''));
    res.json({ posts: files });
  } catch (e) {
    res.json({ posts: [] });
  }
});

// 上传封面图（临时，等保存文章时才最终落地）
app.post('/api/upload-cover', upload.single('cover'), (req, res) => {
  if (!req.file) return res.status(400).json({ ok: false, message: '请选择封面文件' });
  const ext = path.extname(req.file.originalname).toLowerCase();
  // 写到临时目录，保存文章时再移动到最终位置
  const tmpDir = path.join(PROJECT_ROOT, '.tmp-covers');
  fs.mkdirSync(tmpDir, { recursive: true });
  const tmpName = `cover-${Date.now()}${ext}`;
  fs.writeFileSync(path.join(tmpDir, tmpName), req.file.buffer);
  res.json({ ok: true, tmpName, ext: ext.slice(1) });
});

// 保存文章
app.post('/api/save-post', (req, res) => {
  try {
    const { slug, title, category, tags, excerpt, body, coverTmp } = req.body || {};

    if (!slug || !title) return res.status(400).json({ ok: false, message: '标题和 slug 不能为空' });
    if (!/^[a-z0-9-]+$/.test(slug)) return res.status(400).json({ ok: false, message: 'slug 只能包含小写英文、数字、短横线' });

    // Front-matter
    const catMap = {
      '科研笔记': 'Research', '医学随笔': 'Medicine', 'AI 与工具': 'AI',
      '技术实践': 'Tech', '阅读札记': 'Reading', '个人札记': 'Notes',
    };
    const catEn = catMap[category] || category || 'Notes';

    const tagList = (tags || '')
      .split(/[,，]/)
      .map(t => t.trim())
      .filter(Boolean);

    const dateStr = beijingISO();
    let coverPath = defaultCoverPath(catEn);

    // 处理封面
    if (coverTmp) {
      const tmpDir = path.join(PROJECT_ROOT, '.tmp-covers');
      const tmpFile = path.join(tmpDir, coverTmp);
      if (fs.existsSync(tmpFile)) {
        const ext = path.extname(coverTmp);
        const postAssetsDir = path.join(COVERS_DIR, slug);
        fs.mkdirSync(postAssetsDir, { recursive: true });
        const destPath = path.join(postAssetsDir, `cover${ext}`);
        fs.copyFileSync(tmpFile, destPath);
        fs.unlinkSync(tmpFile);
        coverPath = `/assets/images/posts/${slug}/cover${ext}`;
      }
    }

    // 写入 .md
    const fm = [
      '---',
      `title: "${title}"`,
      `date: "${dateStr}"`,
      'categories:',
      `  - ${catEn}`,
      'tags:',
      ...tagList.map(t => `  - ${t}`),
      `excerpt: "${excerpt || ''}"`,
      `cover: "${coverPath}"`,
      '---',
      '',
      body || '',
    ].join('\n');

    const postFile = path.join(POSTS_DIR, `${slug}.md`);
    fs.writeFileSync(postFile, fm, 'utf-8');

    res.json({ ok: true, message: `文章已保存: ${slug}.md`, file: `source/_posts/${slug}.md` });
  } catch (e) {
    res.status(500).json({ ok: false, message: e.message });
  }
});

// 本地预览（hexo server）
let previewProcess = null;
app.post('/api/preview', async (req, res) => {
  try {
    if (previewProcess) {
      return res.json({ ok: true, message: '预览已在运行', url: 'http://127.0.0.1:4001' });
    }
    // 先构建
    const build = await execCmd('npx', ['hexo', 'clean']);
    const gen = await execCmd('npx', ['hexo', 'generate']);
    if (!gen.success) {
      return res.json({ ok: false, message: '构建失败，请检查日志。', log: gen.stderr || gen.stdout });
    }
    previewProcess = spawn('npx', ['hexo', 'server', '-p', '4001'], { cwd: PROJECT_ROOT, stdio: 'pipe' });
    previewProcess.on('close', () => { previewProcess = null; });
    previewProcess.on('error', () => { previewProcess = null; });
    // 等一秒确保启动
    await new Promise(r => setTimeout(r, 1500));
    res.json({ ok: true, message: '预览已启动', url: 'http://127.0.0.1:4001' });
  } catch (e) {
    res.status(500).json({ ok: false, message: e.message });
  }
});

// 停止预览
app.post('/api/preview-stop', (req, res) => {
  if (previewProcess) {
    previewProcess.kill();
    previewProcess = null;
    res.json({ ok: true, message: '预览已停止' });
  } else {
    res.json({ ok: true, message: '预览未在运行' });
  }
});

// 构建检查
app.post('/api/build', async (req, res) => {
  const clean = await execCmd('npx', ['hexo', 'clean']);
  const gen = await execCmd('npx', ['hexo', 'generate']);
  const success = gen.success;
  res.json({
    ok: success,
    message: success ? '构建成功' : '构建失败，请查看日志。',
    log: [clean.stdout, gen.stdout, gen.stderr].filter(Boolean).join('\n'),
  });
});

// 同步 GitHub（git pull）
app.post('/api/git-pull', async (req, res) => {
  const result = await execCmd('git', ['pull', '--rebase', 'origin', 'main']);
  const msg = result.success
    ? (result.stdout.includes('Already up to date') ? '已是最新，无需同步。' : '同步成功。')
    : `同步失败：${result.stderr || result.stdout}`;
  res.json({ ok: result.success, message: msg, log: result.stdout + '\n' + result.stderr });
});

// 备份到 GitHub（git add / commit / push）
app.post('/api/git-push', async (req, res) => {
  const { commitMsg } = req.body || {};
  const msg = commitMsg || 'post: update from local admin';

  // git add
  const add = await execCmd('git', ['add', '-A']);
  // 检查是否有变更
  const diff = await execCmd('git', ['diff', '--cached', '--quiet']);
  if (diff.success && diff.code === 0) {
    // 没有变更
    return res.json({ ok: true, message: '源码无变更，无需提交。', log: '' });
  }

  // git commit
  const commit = await execCmd('git', ['commit', '-m', msg]);
  if (!commit.success && !commit.stderr.includes('nothing to commit')) {
    return res.json({ ok: false, message: '提交失败', log: commit.stderr });
  }

  // git push
  const push = await execCmd('git', ['push', 'origin', 'main']);
  if (!push.success) {
    return res.json({ ok: false, message: '推送失败，请检查网络或权限。', log: push.stderr });
  }

  res.json({
    ok: true,
    message: '已备份到 GitHub。GitHub Actions 将自动部署到 blog.telescopium.top。',
    log: push.stdout + '\n' + push.stderr,
  });
});

// 一键发布（构建 + git push）
app.post('/api/publish', async (req, res) => {
  const { commitMsg } = req.body || {};
  const msg = commitMsg || 'post: publish from local admin';

  // 1. 构建检查
  const clean = await execCmd('npx', ['hexo', 'clean']);
  const gen = await execCmd('npx', ['hexo', 'generate']);
  if (!gen.success) {
    return res.json({ ok: false, message: '构建失败，请先修复后再发布。', log: gen.stderr || gen.stdout });
  }

  // 2. git add
  await execCmd('git', ['add', '-A']);

  // 3. git commit
  const commit = await execCmd('git', ['commit', '-m', msg]);

  // 4. git push
  const push = await execCmd('git', ['push', 'origin', 'main']);
  if (!push.success) {
    return res.json({ ok: false, message: '推送失败，请检查网络或权限。', log: push.stderr });
  }

  res.json({
    ok: true,
    message: '✅ 文章已推送到 GitHub。\nGitHub Actions 将自动构建并部署到 https://blog.telescopium.top',
    log: [gen.stdout, push.stdout, push.stderr].filter(Boolean).join('\n'),
  });
});

// 打开目录
app.post('/api/open-dir', (req, res) => {
  const { dir } = req.body || {};
  let target;
  if (dir === 'posts') target = POSTS_DIR;
  else if (dir === 'covers') target = COVERS_DIR;
  else target = PROJECT_ROOT;

  const platform = process.platform;
  if (platform === 'darwin') {
    exec(`open "${target}"`);
  } else if (platform === 'win32') {
    exec(`explorer "${target}"`);
  } else {
    exec(`xdg-open "${target}"`);
  }
  res.json({ ok: true, message: `已打开: ${target}` });
});

// ── 启动 ──
app.listen(PORT, HOST, () => {
  console.log('');
  console.log('  Telescopium Blog 发文工作台');
  console.log(`  地址: http://${HOST}:${PORT}`);
  console.log(`  项目: ${PROJECT_ROOT}`);
  console.log('');
  console.log('  按 Ctrl+C 停止。');
  console.log('');
});
