@echo off
chcp 65001 >nul
title AI 编程实验室 - 每日自动发布

echo ════════════════════════════════════════════
echo   AI 编程实验室 - 每日自动发布 v2
echo   %date% %time%
echo ════════════════════════════════════════════
echo.

cd /d "%~dp0"

:: 检查依赖
where node >nul 2>nul
if %errorlevel% neq 0 (
    echo ❌ 未找到 Node.js，请先安装
    pause
    exit /b 1
)

:: 1. 生成新内容（每天 2 篇）
echo [1/5] 📝 生成新文章...
node scripts\generate-content.js --count 2
if %errorlevel% neq 0 (
    echo ⚠️  生成内容遇到问题，继续执行...
) else (
    echo ✅ 文章生成完成
)

:: 2. 构建网站（v2 带深色模式、产品封面等）
echo.
echo [2/5] 🌐 构建网站...
node scripts\build-site.js
if %errorlevel% neq 0 (
    echo ❌ 构建失败!
    pause
    exit /b 1
)
echo ✅ 网站构建完成

:: 3. 生成信息产品（PDF + 产品页）
echo.
echo [3/5] 📚 生成信息产品...
node scripts\generate-product.js
echo ✅ 产品生成完成

:: 4. 提交到 Git
echo.
echo [4/5] 📦 提交到 Git...
git add -A
git commit -m "每日自动更新: %date% %time%"
echo ✅ Git 提交完成

:: 5. 部署到 GitHub Pages
echo.
echo [5/5] 🚀 部署到 GitHub Pages...
git push origin master
if %errorlevel% equ 0 (
    echo ✅ 主分支推送成功
) else (
    echo ⚠️  主分支推送失败，检查网络/GitHub 连接
    pause
    exit /b 1
)

git subtree push --prefix site origin gh-pages
if %errorlevel% equ 0 (
    echo ✅ GitHub Pages 部署成功
) else (
    echo ⚠️  gh-pages 部署失败，尝试强制推送...
    git push origin `git subtree split --prefix site`:gh-pages --force
)

echo.
echo ════════════════════════════════════════════
echo ✅ 全部完成！
echo    🌐 https://hugo-xu844.github.io/autopilot-content/
echo    ⏰ %date% %time%
echo ════════════════════════════════════════════

:: 记录日志
echo %date% %time% - 更新成功 >> publish.log

timeout /t 10
