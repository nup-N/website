@echo off
REM 通过 Docker 设置管理员用户脚本 (Windows)
REM 使用方法: set-admin-docker.bat [role]
REM role 可选值: admin 或 super_admin (默认为 admin)

set ROLE=%1
if "%ROLE%"=="" set ROLE=admin

if not "%ROLE%"=="admin" if not "%ROLE%"=="super_admin" (
    echo ❌ 角色必须是 admin 或 super_admin
    exit /b 1
)

echo 🔐 正在将用户 'admin' 设置为 %ROLE%...

REM 通过 docker exec 执行 SQL
docker exec -i postgres_auth psql -U admin -d auth_system -c "UPDATE users SET role = '%ROLE%' WHERE username = 'admin';"

if %ERRORLEVEL% EQU 0 (
    echo ✅ 用户 'admin' 已成功设置为 %ROLE%
    echo.
    echo 📋 验证用户信息:
    docker exec -i postgres_auth psql -U admin -d auth_system -c "SELECT id, username, email, role FROM users WHERE username = 'admin';"
) else (
    echo ❌ 设置失败，请检查：
    echo    1. Docker 容器 'postgres_auth' 是否正在运行
    echo    2. 用户 'admin' 是否存在
    exit /b 1
)

