# Telescopium Blog 评论系统 — 后端部署说明

## 前提条件

后端服务器需要 `better-sqlite3` 依赖。如果尚未安装：

```bash
cd /opt/apps/deepseek-server
npm install better-sqlite3
```

## 部署步骤

### 1. 上传 API 模块

将本地 `deploy/comments-api.js` 上传到服务器：

```bash
# 在本地执行
scp ~/Sites/telescopium-blog/deploy/comments-api.js root@8.130.126.229:/opt/apps/deepseek-server/
```

### 2. 在主 app 中挂载 Router

编辑 `/opt/apps/deepseek-server/` 的主入口文件（通常是 `index.js`、`app.js` 或 `server.js`），添加以下两行：

```js
// 放在其他路由之前或之后均可，建议放在现有 API 路由附近
const commentsRouter = require('./comments-api');
app.use('/api/comments', commentsRouter);
```

**注意**：如果主 app 尚未启用 `express.json()` 中间件，请确保以下行存在：

```js
app.use(express.json());
```

### 3. 检查依赖

确认 `package.json` 中已包含 `better-sqlite3`：

```bash
cd /opt/apps/deepseek-server
npm ls better-sqlite3
```

如果没有，安装它：

```bash
npm install better-sqlite3
```

### 4. 重启服务

```bash
cd /opt/apps/deepseek-server
pm2 restart all
pm2 status
```

### 5. 验证 API

```bash
# GET 测试（应该返回空数组）
curl "https://api.telescopium.top/api/comments?path=/test/"

# POST 测试
curl -X POST "https://api.telescopium.top/api/comments" \
  -H "Content-Type: application/json" \
  -H "Origin: https://blog.telescopium.top" \
  -d '{
    "path": "/test/",
    "page_title": "测试文章",
    "author": "测试用户",
    "content": "这是一条测试评论",
    "website": ""
  }'

# 再次 GET 确认评论已入库
curl "https://api.telescopium.top/api/comments?path=/test/"
```

### 6. 数据库位置

SQLite 数据库自动创建在：
`/opt/apps/deepseek-server/data/comments.db`

可以通过 SQLite 命令行查看：

```bash
sqlite3 /opt/apps/deepseek-server/data/comments.db "SELECT * FROM comments;"
```

## 安全特性

| 特性 | 说明 |
|------|------|
| 蜜罐字段 | `website` 字段人类不可见，机器人填写后假装成功但不入库 |
| IP 限流 | 同 IP 10 分钟内最多 5 条评论 |
| 链接限制 | 每条评论最多 2 个链接 |
| HTML 转义 | 后端和前端均做 HTML 转义，防止 XSS |
| IP 哈希 | 不存储明文 IP，仅保留 SHA-256 哈希 |
| 长度限制 | 用户名 ≤24 字符，内容 ≤1000 字符 |
| CORS | 仅允许 blog.telescopium.top / localhost |

## 前端部署

```bash
cd ~/Sites/telescopium-blog
npx hexo clean
npx hexo generate
rsync -avz --delete public/ root@8.130.126.229:/var/www/blog/
```
