# Telescopium 静态图片资源指南

## 图片格式策略

| 类型 | 源文件 | 网页加载 | 说明 |
|------|--------|---------|------|
| 图标（favicon、PWA） | `.png` | `.png` | 保持 PNG，加 `?v=2` 防缓存 |
| 封面图（covers） | `.png` | `.webp` | WebP 优先，体积减少 97–98% |
| 背景图（backgrounds） | `.png` | `.webp` | WebP 优先 |
| 品牌图（brand） | `.png` | `.webp` | banner 用 WebP，mark 保留 PNG |
| 文章内嵌图片 | `.png` | 待定 | 未来可按需生成 WebP |

**规则**：PNG 是源文件（保留），WebP 是网页优先加载文件。新增图片后需同步生成 WebP。
生成命令：`python3 tools/convert-webp.py`

## 目录结构与已有文件

```
source/assets/
├── brand/
│   ├── telescopium-mark.png         # 品牌标志（PNG，About 页底部）
│   ├── telescopium-logo-banner.png  # 品牌横幅源文件
│   ├── telescopium-logo-banner.webp # ← 网页加载
│   └── .gitkeep
├── icons/
│   ├── favicon.png                  # 浏览器标签页图标
│   ├── site-icon-512.png            # PWA 图标 512×512
│   ├── apple-touch-icon.png         # Apple Touch Icon 180×180
│   └── .gitkeep
└── images/
    ├── backgrounds/
    │   ├── hero-bg.png              # 源文件
    │   ├── hero-bg.webp             # ← 网页加载
    │   └── .gitkeep
    ├── covers/
    │   ├── default-cover.png        # 源文件
    │   ├── default-cover.webp       # ← 网页加载
    │   ├── research-cover.png       # 源文件
    │   ├── research-cover.webp      # ← 网页加载
    │   ├── medicine-cover.png       # 源文件
    │   ├── medicine-cover.webp      # ← 网页加载
    │   ├── ai-tools-cover.png       # 源文件
    │   ├── ai-tools-cover.webp      # ← 网页加载
    │   ├── personal-logs-cover.png  # 源文件
    │   ├── personal-logs-cover.webp # ← 网页加载
    │   └── .gitkeep
    └── posts/
        └── .gitkeep                 # 未来文章内嵌图片放这里
```

## 各文件用途与引用位置

| 文件 | 用途 | 引用位置 |
|------|------|---------|
| `favicon.png` | 浏览器标签页图标 | `<link rel="icon">` in head.ejs |
| `site-icon-512.png` | PWA 大图标 | site.webmanifest |
| `apple-touch-icon.png` | iOS 主屏幕图标 | `<link rel="apple-touch-icon">` in head.ejs |
| `telescopium-mark.png` | 品牌小标志 | About 页面底部 |
| `telescopium-logo-banner.png` | 品牌横幅 | About 页面顶部 |
| `hero-bg.png` | Hero 背景图层 | CSS `background-image` in style.styl |
| `research-cover.png` | Research Notes 卡片封面 | content-cards.ejs |
| `medicine-cover.png` | Medical Essays 卡片封面 | content-cards.ejs |
| `ai-tools-cover.png` | AI & Tools 卡片封面 | content-cards.ejs |
| `personal-logs-cover.png` | Personal Logs 卡片封面 | content-cards.ejs |
| `default-cover.png` | 默认文章封面（预留） | 尚未接入 |

## 文件命名规范

| 规则 | 示例 |
|------|------|
| 全小写英文 | `hero-bg.png` |
| 单词用连字符分隔 | `personal-logs-cover.png` |
| 文章图片按 slug 命名 | `gpt4-clinical-trial-01.png` |
| 序号用两位数字补零 | `-01`, `-02`, ..., `-10` |
| 不要使用中文文件名 | ❌ `背景图.png` |

## 推荐尺寸与文件大小

| 图片类型 | 推荐尺寸 | 最大文件大小 |
|----------|---------|-------------|
| favicon | ≥ 64×64 px | < 50 KB |
| apple-touch-icon | 180×180 px | < 200 KB |
| PWA 图标 | 512×512 px | < 200 KB |
| Hero 背景图 | ≥ 1920×1080 px | < 2 MB |
| 文章封面图 | ≥ 1200×630 px | < 1.5 MB |
| 文章内嵌图片 | 宽度 ≤ 1200 px | < 500 KB |
| 品牌标志 | 视设计而定 | < 500 KB |

## 引用方式

### 在 Markdown 文章中引用图片

```markdown
![描述文字](/assets/images/posts/post-slug-01.png)
```

### 在模板中引用

```ejs
<img src="/assets/icons/favicon.png" alt="Telescopium">
```

### 在 CSS 中引用

```styl
background: url('/assets/images/backgrounds/hero-bg.png') center/cover no-repeat
```

## 注意事项

1. 所有图片放在 `source/assets/` 下，Hexo 构建时直接复制到 `public/assets/`
2. 不要将未压缩的原图放入仓库，使用 [Squoosh](https://squoosh.app/) 或类似工具预先压缩
3. `.gitkeep` 仅用于保留空目录，放入实际文件后可删除
4. 图片文件名避免使用空格、中文、特殊字符
5. `.DS_Store` 已加入 `.gitignore`，不会被提交
