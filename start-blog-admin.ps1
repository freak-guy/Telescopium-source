# ============================================================
# Telescopium Blog 发文工作台 — Windows PowerShell 启动脚本
# 右键 -> 使用 PowerShell 运行
# ============================================================

# 跳转到脚本所在目录
Set-Location -Path $PSScriptRoot

# 检查 Node.js
$nodeExists = Get-Command node -ErrorAction SilentlyContinue
if (-not $nodeExists) {
    Write-Host ""
    Write-Host "❌ 未检测到 Node.js，请先安装 Node.js LTS 版本。" -ForegroundColor Red
    Write-Host "   下载: https://nodejs.org"
    Write-Host ""
    Read-Host "按 Enter 退出"
    exit 1
}

# 进入 local-admin
Set-Location -Path "local-admin"

# 如果 node_modules 不存在，自动安装依赖
if (-not (Test-Path "node_modules")) {
    Write-Host "首次运行，正在安装依赖……"
    npm install
    Write-Host ""
}

# 启动服务
Write-Host "正在启动 Telescopium Blog 发文工作台……"
Start-Process -NoNewWindow node -ArgumentList "server.mjs"

# 等待服务启动
Start-Sleep -Seconds 2

# 打开浏览器
Start-Process "http://127.0.0.1:5050"

Write-Host ""
Write-Host "服务已启动。关闭此窗口可停止服务。"
Write-Host ""
Read-Host "按 Enter 退出"
