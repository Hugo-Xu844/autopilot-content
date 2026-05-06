@echo off
chcp 65001 >nul
echo ============================================
echo  AI 编程实验室 - 一键运行
echo ============================================
echo.
echo 1. 生成内容 + 构建网站 + 生成产品
echo 2. 只构建网站
echo 3. 只生成产品
echo 4. 清理并重新开始
echo.
set /p choice=请选择 (1-4): 

if "%choice%"=="1" (
    echo.
    echo 正在生成内容...
    node scripts\generate-content.js --count 2
    echo.
    echo 正在构建网站...
    node scripts\build-site.js
    echo.
    echo 正在生成产品...
    node scripts\generate-product.js
    echo.
    echo ✅ 完成!
) else if "%choice%"=="2" (
    node scripts\build-site.js
) else if "%choice%"=="3" (
    node scripts\generate-product.js
) else if "%choice%"=="4" (
    del /q content\posts\*.md 2>nul
    del /q content\products\*.md 2>nul
    rmdir /s /q site 2>nul
    echo ✅ 已清理
) else (
    echo 无效选择
)

pause
