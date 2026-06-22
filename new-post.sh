#!/bin/bash
# ============================================================
# Telescopium Blog — 创建文章
# 用法:
#   ./new-post.sh "文章标题"
#   ./new-post.sh "文章标题" "科研笔记"
#   ./new-post.sh "文章标题" "科研笔记" ~/Downloads/cover.png
#   ./new-post.sh "文章标题" "科研笔记" ~/Downloads/cover.png my-slug
# ============================================================
set -e

TITLE="$1"
CAT_INPUT="${2:-个人札记}"
COVER_SRC="${3:-}"
SLUG="${4:-}"

if [ -z "$TITLE" ]; then
  echo "用法: ./new-post.sh \"文章标题\" [分类] [封面路径] [slug]"
  echo ""
  echo "分类（中文）: 科研笔记 | 医学随笔 | AI 与工具札记 | 技术实践 | 阅读札记 | 个人札记"
  echo "分类（英文）: Research | Medicine | AI | Tech | Reading | Notes"
  echo ""
  echo "示例:"
  echo "  ./new-post.sh \"骨科病例一则\" 医学随笔"
  echo "  ./new-post.sh \"骨科病例一则\" Medicine ~/Downloads/x光.png"
  echo "  ./new-post.sh \"Hello World\" AI '' hello-world"
  exit 1
fi

cd "$(dirname "$0")"

# ──────────────────────────────────────────────
# 1. 分类映射（中文 → 英文）
# ──────────────────────────────────────────────
case "$CAT_INPUT" in
  "科研笔记"|"Research")      CATEGORY="Research";    DEFAULT_COVER="research-cover"     ;;
  "医学随笔"|"Medicine")      CATEGORY="Medicine";    DEFAULT_COVER="medicine-cover"     ;;
  "AI 与工具札记"|"AI")       CATEGORY="AI";          DEFAULT_COVER="ai-tools-cover"     ;;
  "技术实践"|"Tech")          CATEGORY="Tech";        DEFAULT_COVER="ai-tools-cover"     ;;
  "阅读札记"|"Reading")       CATEGORY="Reading";     DEFAULT_COVER="personal-logs-cover" ;;
  "个人札记"|"Notes")         CATEGORY="Notes";       DEFAULT_COVER="personal-logs-cover" ;;
  *)
    echo "⚠ 未知分类「$CAT_INPUT」，使用默认分类 Notes"
    CATEGORY="Notes"
    DEFAULT_COVER="personal-logs-cover"
    ;;
esac

# ──────────────────────────────────────────────
# 2. 选择默认封面扩展名（优先 .png）
# ──────────────────────────────────────────────
COVERS_DIR="source/assets/images/covers"
if [ -f "$COVERS_DIR/${DEFAULT_COVER}.png" ]; then
  DEFAULT_COVER_PATH="/assets/images/covers/${DEFAULT_COVER}.png"
elif [ -f "$COVERS_DIR/${DEFAULT_COVER}.webp" ]; then
  DEFAULT_COVER_PATH="/assets/images/covers/${DEFAULT_COVER}.webp"
else
  DEFAULT_COVER_PATH="/assets/images/covers/default-cover.png"
fi

# ──────────────────────────────────────────────
# 3. 生成 slug
# ──────────────────────────────────────────────
if [ -z "$SLUG" ]; then
  # 从标题提取英文字母数字空格短横线，去除中文等非 ASCII 字符
  SLUG=$(echo "$TITLE" \
    | sed 's/[^a-zA-Z0-9[:space:]-]//g' \
    | tr '[:upper:]' '[:lower:]' \
    | sed 's/[[:space:]]\{1,\}/-/g' \
    | sed 's/--*/-/g' \
    | sed 's/^-//;s/-$//')

  # 如果标题全是中文/无 ASCII 可用字符，用日期后缀
  if [ -z "$SLUG" ]; then
    SLUG="post-$(date +%Y%m%d)"
  fi
fi

# 清理 slug：只保留小写英文、数字、短横线
SLUG=$(echo "$SLUG" | tr '[:upper:]' '[:lower:]' | sed 's/[^a-z0-9-]/-/g' | sed 's/--*/-/g' | sed 's/^-//;s/-$//')

if [ -z "$SLUG" ]; then
  SLUG="post-$(date +%Y%m%d)"
fi

# ──────────────────────────────────────────────
# 4. 生成日期
# ──────────────────────────────────────────────
DATE_NOW=$(date +"%Y-%m-%d %H:%M:%S")

# ──────────────────────────────────────────────
# 5. 处理封面
# ──────────────────────────────────────────────
COVER_PATH="$DEFAULT_COVER_PATH"

if [ -n "$COVER_SRC" ] && [ -f "$COVER_SRC" ]; then
  # 获取扩展名并校验格式
  EXT="${COVER_SRC##*.}"
  EXT=$(echo "$EXT" | tr '[:upper:]' '[:lower:]')
  case "$EXT" in
    png|jpg|jpeg|webp)
      # 格式合法：创建目录并复制
      POST_ASSETS_DIR="source/assets/images/posts/$SLUG"
      mkdir -p "$POST_ASSETS_DIR"
      cp "$COVER_SRC" "$POST_ASSETS_DIR/cover.$EXT"
      COVER_PATH="/assets/images/posts/$SLUG/cover.$EXT"
      echo ">>> 封面: $COVER_SRC → $POST_ASSETS_DIR/cover.$EXT"
      ;;
    *)
      echo ">>> ❌ 不支持该封面格式「.$EXT」，请使用 png / jpg / jpeg / webp。"
      echo ">>> 将使用默认封面: $DEFAULT_COVER_PATH"
      COVER_PATH="$DEFAULT_COVER_PATH"
      ;;
  esac
elif [ -n "$COVER_SRC" ]; then
  echo ">>> ⚠ 封面文件不存在「$COVER_SRC」，使用默认封面"
  echo ">>> 默认封面: $COVER_PATH"
fi

# ──────────────────────────────────────────────
# 6. 写入 .md 文件
# ──────────────────────────────────────────────
POST_FILE="source/_posts/${SLUG}.md"

cat > "$POST_FILE" <<EOF
---
title: "$TITLE"
date: "$DATE_NOW"
categories:
  - $CATEGORY
tags:
  - $CAT_INPUT
excerpt: ""
cover: "$COVER_PATH"
---

EOF

# ──────────────────────────────────────────────
# 7. 输出结果
# ──────────────────────────────────────────────
echo ""
echo "✅ 文章已创建"
echo "   文件:   $POST_FILE"
echo "   标题:   $TITLE"
echo "   分类:   $CATEGORY"
echo "   Slug:   $SLUG"
echo "   封面:   $COVER_PATH"
echo ""
echo "下一步:"
echo "   vim $POST_FILE"
echo "   ./deploy.sh \"post: $TITLE\""
