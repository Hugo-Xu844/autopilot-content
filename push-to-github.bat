@echo off
chcp 65001 >nul
echo ============================================
echo  推送最新内容到 GitHub
echo ============================================
echo.

cd /d "%~dp0"

:: 如果开了梯子，取消下面两行的注释并把端口改成你的
:: set http_proxy=http://127.0.0.1:7890
:: set https_proxy=http://127.0.0.1:7890

echo 📤 正在推送到 master 分支...
git push origin master
if %errorlevel% neq 0 (
    echo.
    echo ⚠️  推送失败！尝试以下方法：
    echo   1. 检查网络连接
    echo   2. 开了梯子的话，用记事本打开这个 bat 文件
    echo     去掉 set http_proxy=... 那两行的 :: 前缀
    echo     并把 7890 改成你的代理端口
    echo   3. 重新运行
    pause
    exit /b 1
)

echo.
echo 📤 正在部署 gh-pages 分支...
git subtree push --prefix site origin gh-pages
if %errorlevel% neq 0 (
    echo.
    echo ⚠️  gh-pages 部署失败
    pause
    exit /b 1
)

echo.
echo ✅ 全部完成！
echo.
echo 🌐 稍等 1-2 分钟，访问：
echo   https://hugo-xu844.github.io/autopilot-content/
echo.

timeout /t 5
