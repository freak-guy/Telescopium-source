#!/bin/bash
# ============================================================
# Telescopium Blog — 一键构建 + 部署 + Git 提交
# 用法:
#   ./deploy.sh                    仅构建 + 部署（无 Git 提交）
#   ./deploy.sh "post: 文章标题"    构建 + 部署 + Git 提交推送
# ============================================================
set -e

COMMIT_MSG="${1:-}"

cd "$(dirname "$0")"

# ── 构建 ──
echo ">>> Hexo 清理 & 构建 ..."
npx hexo clean
npx hexo generate

# ── 部署到服务器 ──
echo ""
echo ">>> 部署到 root@8.130.126.229:/var/www/blog/ ..."
rsync -avz --delete public/ root@8.130.126.229:/var/www/blog/

echo ""
echo "✅ 部署完成 → https://blog.telescopium.top"

# ── Git 提交（可选）──
if [ -n "$COMMIT_MSG" ]; then
  echo ""

  # 检查是否有变更
  if git diff --quiet && git diff --cached --quiet && git ls-files --others --exclude-standard --quiet; then
    echo "ℹ 无源码变更，跳过 Git 提交。"
  else
    echo ">>> Git 提交 & 推送 ..."
    git add -A
    git commit -m "$COMMIT_MSG"
    git push origin main
    echo "✅ Git 推送完成 → github.com/freak-guy/Telescopium-source"
  fi
else
  echo ""
  echo "ℹ 未提供 commit message，跳过 Git 提交。"
  echo "  如需提交: ./deploy.sh \"post: 文章标题\""
fi
