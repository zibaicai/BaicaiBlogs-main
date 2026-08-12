@echo off
chcp 65001 >nul
echo ============================================
echo   BaicaiBlogs 数据库初始化脚本
echo   创建数据库 blogs 并导入初始数据
echo ============================================
echo.

REM 检查 MySQL 环境
where mysql >nul 2>&1
if %errorlevel% neq 0 (
    echo [错误] 未检测到 MySQL 客户端，请先安装 MySQL 8+
    echo 下载地址: https://dev.mysql.com/downloads/mysql/
    pause
    exit /b 1
)

echo [信息] 正在初始化数据库...
echo MySQL root 密码: 123456
echo.

REM 执行 SQL 脚本
mysql -u root -p123456 < sql\init.sql

if %errorlevel% neq 0 (
    echo.
    echo [错误] 数据库初始化失败，请确认 MySQL 服务已启动
    echo.
) else (
    echo.
    echo [成功] 数据库初始化完成！
    echo   数据库: blogs
    echo   账号: admin / admin123
)

pause
