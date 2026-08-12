@echo off
chcp 65001 >nul
echo ============================================
echo   BaicaiBlogs 后端服务启动脚本
echo   Spring Boot + MySQL
echo ============================================
echo.

REM 检查 Java 环境
where java >nul 2>&1
if %errorlevel% neq 0 (
    echo [错误] 未检测到 Java 环境，请先安装 JDK 17+
    echo 下载地址: https://adoptium.net/
    pause
    exit /b 1
)

REM 检查 Maven 环境
where mvn >nul 2>&1
if %errorlevel% neq 0 (
    echo [错误] 未检测到 Maven 环境，请先安装 Maven 3.8+
    echo 下载地址: https://maven.apache.org/download.cgi
    pause
    exit /b 1
)

REM 检查 MySQL 数据库连接
echo [检查] 正在验证数据库连接...
echo 请确保 MySQL 服务已启动，并且已创建数据库 blogs
echo.

REM 如果 target 目录不存在或没有 jar 文件，则先编译
if not exist "target\my-blog-backend-*.jar" (
    echo [编译] 正在编译项目...
    call mvn clean package -DskipTests
    if %errorlevel% neq 0 (
        echo [错误] 编译失败
        pause
        exit /b 1
    )
)

REM 运行 Spring Boot 应用
echo [启动] 正在启动后端服务...
echo.
call mvn spring-boot:run
