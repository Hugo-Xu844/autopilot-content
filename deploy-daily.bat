@echo off
chcp 65001 >nul
echo ============================================
echo  AI 编程实验室 - 每日发布
echo ============================================
echo %date% %time%
echo.

:: 进目录
cd /d "%~dp0"

:: 1. 更新 config.json 里的每日数量
echo 🔧 确保配置正确...
if not exist config.json (
    echo 错误: 找不到 config.json
    pause
    exit /b 1
)

:: 2. 生成内容
echo 📝 生成新内容...
node scripts\generate-content.js --count 2
if %errorlevel% neq 0 (
    echo ⚠️  生成内容有警告，继续...
)

:: 3. 构建网站
echo 🌐 构建网站...
node scripts\build-site.js
if %errorlevel% neq 0 (
    echo ❌ 构建失败!
    pause
    exit /b 1
)

:: 4. 生成产品
echo 📚 生成信息产品...
node scripts\generate-product.js

:: 5. 推送到 GitHub
echo 🚀 部署到 GitHub Pages...
git add site/
git commit -m "每日更新: %date% %time%"
git push origin master
git subtree push --prefix site origin gh-pages

echo.
echo ✅ 完成! 网站已更新
echo https://hugo-xu844.github.io/autopilot-content/

:: 记录日志
echo %date% %time% - 更新成功 >> publish.log

timeout /t 5
