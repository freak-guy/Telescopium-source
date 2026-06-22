#!/bin/bash
# ============================================================
# Telescopium Blog 发文工作台 — Mac 启动脚本
# 双击启动，或右键 -> 打开
# ============================================================

# 跳转到脚本所在目录
cd "$(dirname "$0")"

# 检查 Node.js
if ! command -v node &> /dev/null; then
  echo ""
  echo "❌ 未检测到 Node.js，请先安装 Node.js LTS 版本。"
  echo "   下载: https://nodejs.org"
  echo ""
  read -p "按任意键退出…"
  exit 1
fi

# 进入 local-admin
cd local-admin

# 如果 node_modules 不存在，自动安装依赖
if [ ! -d "node_modules" ]; then
  echo "首次运行，正在安装依赖……"
  npm install
  echo ""
fi

# 启动服务
echo "正在启动 Telescopium Blog 发文工作台……"
node server.mjs &
SERVER_PID=$!

# 等待服务启动
sleep 1.5

# 打开浏览器
open "http://127.0.0.1:5050"

# 等待服务进程结束
wait $SERVER_PID
