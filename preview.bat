@echo off
chcp 65001 >nul
echo ============================================
echo  AI 编程实验室 - 本地预览
echo ============================================
echo.

cd /d "%~dp0"

:: 检查是否已有程序占用8080
netstat -ano | findstr ":8080.*LISTENING" >nul
if %errorlevel% equ 0 (
    echo ⚠️  端口 8080 已被占用，尝试用 8081 端口
    python -m http.server 8081 --directory site
) else (
    echo 🌐 请打开浏览器访问: http://localhost:8080
    echo.
    python -m http.server 8080 --directory site
)

pause
