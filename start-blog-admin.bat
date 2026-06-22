@echo off
REM ============================================================
REM Telescopium Blog 发文工作台 — Windows 启动脚本
REM 双击 start-blog-admin.bat 启动
REM ============================================================

REM 跳转到脚本所在目录
cd /d "%~dp0"

REM 检查 Node.js
where node >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo.
    echo ❌ 未检测到 Node.js，请先安装 Node.js LTS 版本。
    echo   下载: https://nodejs.org
    echo.
    pause
    exit /b 1
)

REM 进入 local-admin
cd local-admin

REM 如果 node_modules 不存在，自动安装依赖
if not exist "node_modules\" (
    echo 首次运行，正在安装依赖……
    call npm install
    echo.
)

REM 启动服务
echo 正在启动 Telescopium Blog 发文工作台……
start /b node server.mjs

REM 等待服务启动
timeout /t 2 /nobreak >nul

REM 打开浏览器
start "" "http://127.0.0.1:5050"

echo.
echo 服务已启动。按 Ctrl+C 停止。
echo.
pause
