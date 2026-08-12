@echo off
chcp 65001 >nul
title BaicaiBlogs - 一键启动
color 0A

echo ============================================
echo   BaicaiBlogs 一键启动脚本
echo   Java + MySQL + Next.js
echo ============================================
echo.

set "ROOT=%~dp0"
set "BACKEND=%ROOT%my-blog-backend"
set "FRONTEND=%ROOT%my-blog-admin"
set "SQL_FILE=%BACKEND%\sql\init.sql"
set "MYSQL_USER=root"

REM ============ 1. 环境检查 ============
echo [1] 检查运行环境...
echo.

set "OK=1"

where java >nul 2>&1
if errorlevel 1 (
    echo   [错误] 未检测到 Java，请安装 JDK 17+
    set "OK=0"
) else (
    for /f "tokens=3" %%v in ('java -version 2^>^&1 ^| findstr /i "version"') do echo   [OK] Java: %%~v
)

where mvn >nul 2>&1
if errorlevel 1 (
    echo   [错误] 未检测到 Maven，请安装 Maven 3.8+
    set "OK=0"
) else (
    echo   [OK] Maven: 已安装
)

where node >nul 2>&1
if errorlevel 1 (
    echo   [错误] 未检测到 Node.js，请安装 Node.js 18+
    set "OK=0"
) else (
    for /f "tokens=1" %%v in ('node -v') do echo   [OK] Node.js: %%v
)

if "%OK%"=="0" (
    echo.
    echo   请安装上述缺失的依赖后重试
    pause
    exit /b 1
)

echo.

REM ============ 2. MySQL 初始化 ============
echo [2] 初始化 MySQL 数据库...
echo.

set "MYSQL_OK=0"

REM 使用配置的密码: 123456
mysql -u %MYSQL_USER% -p123456 -e "SELECT 1" >nul 2>&1
if not errorlevel 1 (
    set "MYSQL_PWD=123456"
    set "MYSQL_OK=1"
    echo   [OK] MySQL 连接成功
)

if "%MYSQL_OK%"=="0" (
    echo   [!] 密码 123456 连接失败，请手动输入密码
    set /p MYSQL_PWD=   MySQL root 密码: 
    mysql -u %MYSQL_USER% -p%MYSQL_PWD% -e "SELECT 1" >nul 2>&1
    if errorlevel 1 (
        echo   [错误] MySQL 连接失败，请检查密码和服务状态
        pause
        exit /b 1
    )
    set "MYSQL_OK=1"
    echo   [OK] MySQL 连接成功
)

REM 创建数据库
mysql -u %MYSQL_USER% -p%MYSQL_PWD% -e "CREATE DATABASE IF NOT EXISTS blogs DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;" >nul 2>&1
if errorlevel 1 (
    echo   [错误] 无法创建数据库
    pause
    exit /b 1
)
echo   [OK] 数据库 blogs 已就绪

REM 导入数据
if exist "%SQL_FILE%" (
    echo   [→] 导入初始数据...
    mysql -u %MYSQL_USER% -p%MYSQL_PWD% blogs < "%SQL_FILE%" 2>nul
    echo   [OK] 数据导入完成
) else (
    echo   [警告] SQL 文件不存在: %SQL_FILE%
)

echo.

REM ============ 3. 编译后端 ============
echo [3] 准备后端项目...
echo.

if not exist "%BACKEND%\target\my-blog-backend-1.0.0.jar" (
    echo   [→] 首次编译，需要一些时间...
    cd /d "%BACKEND%"
    call mvn clean package -DskipTests -q
    if errorlevel 1 (
        echo   [错误] 编译失败
        pause
        exit /b 1
    )
    echo   [OK] 编译成功
) else (
    echo   [OK] 已有编译产物，跳过编译
)

echo.

REM ============ 4. 安装前端依赖 ============
echo [4] 准备前端项目...
echo.

if not exist "%FRONTEND%\node_modules" (
    echo   [→] 首次安装依赖，需要一些时间...
    cd /d "%FRONTEND%"
    call npm install --silent
    if errorlevel 1 (
        echo   [错误] 依赖安装失败
        pause
        exit /b 1
    )
    echo   [OK] 安装成功
) else (
    echo   [OK] 依赖已安装
)

echo.

REM ============ 5. 启动服务 ============
echo [5] 启动服务...
echo.

echo   [→] 启动后端 (端口 8080)...
start "BaicaiBlogs-Backend" /min cmd /c "cd /d %BACKEND% && mvn spring-boot:run"

echo   [→] 启动前端 (端口 3000)...
start "BaicaiBlogs-Frontend" /min cmd /c "cd /d %FRONTEND% && npm run dev"

echo.
echo   [等待] 服务启动中...
timeout /t 12 /nobreak >nul

echo.
echo ============================================
echo
echo   后端 API:    http://localhost:8080
echo   前端页面:    http://localhost:3000
echo   管理后台:    http://localhost:3000/admin
echo
echo   管理员: admin / admin123
echo
echo   关闭方式: 关闭对应的命令行窗口
echo
echo ============================================
echo.

REM 自动打开浏览器
start http://localhost:3000/admin

pause
