#!/bin/bash

# 通过 Docker 设置管理员用户脚本
# 使用方法: ./set-admin-docker.sh [role]
# role 可选值: admin 或 super_admin (默认为 admin)

ROLE=${1:-admin}

if [ "$ROLE" != "admin" ] && [ "$ROLE" != "super_admin" ]; then
    echo "❌ 角色必须是 admin 或 super_admin"
    exit 1
fi

echo "🔐 正在将用户 'admin' 设置为 $ROLE..."

# 通过 docker exec 执行 SQL
docker exec -i postgres_auth psql -U admin -d auth_system <<EOF
UPDATE users 
SET role = '$ROLE' 
WHERE username = 'admin';

-- 验证更新结果
SELECT id, username, email, role 
FROM users 
WHERE username = 'admin';
EOF

if [ $? -eq 0 ]; then
    echo "✅ 用户 'admin' 已成功设置为 $ROLE"
else
    echo "❌ 设置失败，请检查："
    echo "   1. Docker 容器 'postgres_auth' 是否正在运行"
    echo "   2. 用户 'admin' 是否存在"
fi

