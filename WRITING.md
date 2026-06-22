# Telescopium Blog 写作与发布指南

## Blog 定位

Telescopium Blog 是个人知识档案，用于长期沉淀医学学习、科研思考、AI 实践、技术搭建与阶段性记录。

- 不是资讯站，不是工具站。
- 面向长期积累。
- 发布后由 GitHub Actions 自动部署，无需手动 rsync。

---

## 最推荐：图形化发文工作台

发文工作台是一个本地网页界面，双击启动，写文章、上传封面、预览、一键发布全在浏览器里完成。

### 启动

| 平台 | 操作 |
|------|------|
| **Mac** | 双击 `start-blog-admin.command` |
| **Windows** | 双击 `start-blog-admin.bat`，或右键用 PowerShell 运行 `start-blog-admin.ps1` |

首次运行会自动 `npm install` 安装依赖。之后每次双击即可启动。

浏览器自动打开 `http://127.0.0.1:5050`。

> macOS 提示“无法验证开发者”：右键文件 → 打开 → 仍要打开。

### 界面功能

| 功能 | 说明 |
|------|------|
| **文章标题** | 输入后自动生成 slug |
| **Slug** | 自动生成，可手动修改（仅小写英文+数字+短横线） |
| **分类** | 下拉选择中文名，自动写入英文标准分类 |
| **标签** | 中文逗号/英文逗号分隔 |
| **摘要** | 一句话描述 |
| **封面图** | 上传 png / jpg / jpeg / webp，自动保存到 `posts/{slug}/` |
| **正文** | 默认模板：背景 / 正文 / 小结 |

### 按钮说明

| 按钮 | 功能 |
|------|------|
| 💾 **保存文章** | 写入 .md + 封面到本地 |
| 🔍 **本地预览** | 启动 Hexo 预览 → `http://127.0.0.1:4001` |
| ⏹ **停止预览** | 关闭预览服务 |
| 🔨 **构建检查** | hexo clean + generate，查看是否报错 |
| ⬇ **同步 GitHub** | git pull — 在另一台电脑写之前先同步 |
| ⬆ **备份到 GitHub** | git add + commit + push |
| 🚀 **一键发布** | 构建检查 → git push → GitHub Actions 自动部署 |
| 📂 **打开文章目录** | Finder/资源管理器打开 `source/_posts/` |
| 🖼 **打开封面目录** | Finder/资源管理器打开 `source/assets/images/posts/` |

---

## U盘 / 移动硬盘便携写作

Telescopium Blog 可以放在 U盘或移动硬盘里，插到哪台电脑都能写。

### 第一次准备

1. 把仓库 clone 到 U盘：
   ```bash
   git clone git@github.com:freak-guy/Telescopium-source.git /Volumes/MyDisk/telescopium-blog
   ```
2. 电脑上安装 [Node.js LTS](https://nodejs.org) 和 [Git](https://git-scm.com)。
3. 插入 U盘，双击对应启动文件即可。

### 日常流程

1. 插入 U盘
2. 双击 `start-blog-admin.command`（Mac）或 `start-blog-admin.bat`（Windows）
3. 点击 **⬇ 同步 GitHub**（从其他设备写的先拉下来）
4. 新建文章 → 上传封面 → 保存
5. 本地预览确认
6. 点击 **🚀 一键发布**
7. GitHub Actions 自动部署到 blog.telescopium.top

### 离线写作

没有网络也可以：
- 正常写文章、保存到 U盘
- 等有网络后再点「同步 GitHub」或「一键发布」

---

## 分类规范

### front-matter（英文 YAML 数组）

```yaml
categories:
  - Research
```

| 界面显示 | front-matter | 内容 |
|----------|-------------|------|
| 科研笔记 | `Research` | 课题设计、论文阅读、研究方法 |
| 医学随笔 | `Medicine` | 临床观察、病例学习、骨科思考 |
| AI 与工具 | `AI` | AI 使用、效率工具 |
| 技术实践 | `Tech` | 技术搭建、踩坑记录 |
| 阅读札记 | `Reading` | 文献阅读、读书笔记 |
| 个人札记 | `Notes` | 生活、阶段性总结、长文 |

### 标签（支持中文）

```yaml
tags:
  - 骨科
  - 病例学习
```

---

## 封面图

### 推荐规格

- 比例：16:9
- 尺寸：1600×900 或 1920×1080
- 推荐格式：png / jpg / jpeg
- 可选格式：webp
- 不支持：heic / gif / bmp / tiff

### 自定义封面

上传后自动保存到：

```
source/assets/images/posts/{slug}/cover.png
```

front-matter 自动写入正确路径。

### 默认封面

未上传封面时按分类自动选择：

| 分类 | 路径 |
|------|------|
| Research | `/assets/images/covers/research-cover.png` |
| Medicine | `/assets/images/covers/medicine-cover.png` |
| AI / Tech | `/assets/images/covers/ai-tools-cover.png` |
| Reading / Notes | `/assets/images/covers/personal-logs-cover.png` |

---

## 前端 Front-matter 模板

```yaml
---
title: "文章标题"
date: "2026-06-23 15:30:00"
categories:
  - Research
tags:
  - 标签一
  - 标签二
excerpt: "一句话摘要。"
cover: "/assets/images/posts/my-slug/cover.png"
---
```

---

## GitHub Actions 自动部署

**每次 push 到 main 分支后，GitHub Actions 自动：**

1. Checkout 代码
2. 安装 Node.js
3. `npm ci`
4. `npx hexo clean && npx hexo generate`
5. rsync `public/` 到服务器 `/var/www/blog/`

部署结果在 `github.com/freak-guy/Telescopium-source/actions` 查看。

### 配置 GitHub Secrets

在仓库 `Settings → Secrets and variables → Actions → New repository secret` 添加：

| Secret 名称 | 示例值 | 说明 |
|-------------|--------|------|
| `BLOG_SSH_HOST` | `8.130.126.229` | 服务器 IP |
| `BLOG_SSH_USER` | `root` | 服务器用户名 |
| `BLOG_SSH_PORT` | `22` | SSH 端口 |
| `BLOG_DEPLOY_PATH` | `/var/www/blog/` | 部署目标路径 |
| `BLOG_SSH_KEY` | `-----BEGIN OPENSSH...` | 服务器 SSH 私钥内容 |

**私钥不要提交到仓库。只存在于 GitHub Secrets 中。**

### 如何生成部署密钥

```bash
# 在 Mac 上生成专用密钥对
ssh-keygen -t ed25519 -f ~/.ssh/telescopium-deploy -N ""

# 查看公钥，复制到服务器
cat ~/.ssh/telescopium-deploy.pub

# 在服务器上添加公钥
# root@8.130.126.229:
cat >> ~/.ssh/authorized_keys < 公钥内容

# 查看私钥，复制到 GitHub Secret BLOG_SSH_KEY
cat ~/.ssh/telescopium-deploy
```

---

## 命令行备用方式

图形工作台是首选。以下脚本保留为高级备用。

### 创建文章

```bash
./new-post.sh "标题" 科研笔记 ~/cover.png
```

### 本地预览

```bash
npm run preview
```

### 部署（Mac 专用 rsync 直推）

```bash
./deploy.sh "post: 标题"
```

---

## 注意事项

- **不要**把 local-admin 部署到公网。
- **不要**把 SSH 私钥写进源码。
- **不要**把服务器密码写进 .env。
- 所有脚本基于「脚本所在目录」自动识别项目根目录，**不依赖** `~/Sites/telescopium-blog` 硬编码路径。
- U盘路径、`E:\` 盘符、`/Volumes/` 均可正常运行。

---

## 常见问题

### 启动后浏览器没打开？

手动打开 `http://127.0.0.1:5050`。

### macOS 提示“无法验证开发者”？

右键 `start-blog-admin.command` → 打开 → 仍要打开。或执行 `chmod +x start-blog-admin.command`。

### 端口被占用？

```bash
lsof -ti:5050 | xargs kill  # Mac
netstat -ano | findstr 5050 # Windows 查找后 taskkill
```

### Windows 中文乱码？

PowerShell 运行 `start-blog-admin.ps1` 替代 bat。

### 一键发布失败？

先点「构建检查」看具体错误。常见原因：Markdown 语法错误、front-matter 格式问题。
