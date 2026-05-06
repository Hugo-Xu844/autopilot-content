@echo off
chcp 65001 >nul

echo ============================================
echo  设置每日自动任务
echo ============================================
echo.
echo 这将创建一个 Windows 计划任务，每天自动：
echo   - 8:00 生成内容
echo   - 8:15 构建网站
echo   - 8:20 生成产品
echo.

set "SCRIPT_DIR=%~dp0"
set "TASK_NAME=AI编程实验室-每日更新"

schtasks /create /tn "%TASK_NAME%" /tr "node %SCRIPT_DIR%scripts\run-all.js" /sc daily /st 08:00 /f

if %errorlevel% equ 0 (
    echo ✅ 计划任务创建成功！
    echo 每天 08:00 自动运行
) else (
    echo ⚠️  创建失败，请尝试以管理员身份运行
)

pause
