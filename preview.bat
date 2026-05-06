@echo off
chcp 65001 >nul
echo ============================================
echo  AI 编程实验室 - 本地预览
echo ============================================
echo.
echo 🔍 在浏览器打开: http://localhost:8080
echo.

cd /d "%~dp0"

:: 用 Python 启动简易 HTTP 服务器
python -m http.server 8080 --directory site

pause
