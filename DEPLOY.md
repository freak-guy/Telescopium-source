# Telescopium 部署说明

## 环境

- **本地开发**：macOS，Node.js + Hexo
- **生产服务器**：8.130.126.229
- **部署目录**：`/var/www/blog`
- **域名**：`blog.telescopium.top`
- **HTTPS**：由 certbot 管理 Let's Encrypt 证书

## 本地构建

```bash
cd ~/Sites/telescopium-blog
npm install
npx hexo clean
npx hexo generate
```

## 本地预览

```bash
npx hexo server
# → http://localhost:4000
```

## 推送源码

```bash
git add .
git commit -m "描述本次变更"
git push origin main
```

## 部署到服务器

将本地构建的静态文件同步到生产服务器：

```bash
rsync -avz --delete public/ root@8.130.126.229:/var/www/blog/
```

**参数说明：**
- `-a`：归档模式，保留权限和时间戳
- `-v`：显示详细输出
- `-z`：传输时压缩
- `--delete`：删除服务器上有但本地没有的文件

## 服务器结构

```
/var/www/blog/
├── index.html
├── about/
├── archives/
├── tags/
├── css/
├── js/
├── 2025/
├── 2026/
├── sitemap.xml
└── robots.txt
```

## Nginx 配置要点

- 站点根目录：`/var/www/blog`
- SSL 证书：`/etc/letsencrypt/live/blog.telescopium.top/`
- HTTP → HTTPS 重定向

## 注意事项

1. 只部署 `public/` 目录下的静态文件
2. 不要将 `node_modules/`、`source/`、`themes/` 部署到服务器
3. 部署前确保本地 `npx hexo generate` 无报错
4. 服务器上不需要安装 Node.js 或 Hexo
