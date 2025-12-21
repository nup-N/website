# 生产环境配置指南

## 重要提示

⚠️ **在生产环境部署前，必须修改所有默认密码和密钥！**

## 步骤 1: 创建环境变量文件

在 `website/` 目录下创建 `.env` 文件：

```bash
cd website
cat > .env << 'EOF'
# ==================== 数据库配置 ====================
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=admin
DB_PASSWORD=<生成强密码>
DB_DATABASE=auth_system

# ==================== Docker Compose 数据库配置 ====================
POSTGRES_DB=auth_system
POSTGRES_USER=admin
POSTGRES_PASSWORD=<生成强密码>
POSTGRES_PORT=5432

REDIS_PASSWORD=<生成强密码>
REDIS_PORT=6379

# ==================== JWT 配置 ====================
# 生成强密钥：node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
JWT_SECRET=<生成强密钥>
JWT_EXPIRES_IN=7d

# ==================== 应用配置 ====================
NODE_ENV=production
PORT=3000
EOF
```

## 步骤 2: 生成强密码和密钥

```bash
# 生成随机密码（32字符）
node -e "console.log(require('crypto').randomBytes(16).toString('hex'))"

# 生成 JWT 密钥（64字符）
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

## 步骤 3: 设置文件权限

```bash
chmod 600 website/.env
```

## 步骤 4: 启动服务

```bash
cd website
docker-compose up -d
```

## 注意事项

1. **不要将 `.env` 文件提交到 Git**
2. **定期更换密码和密钥**
3. **使用强密码（至少32字符）**
4. **限制数据库访问（仅允许本地连接）**

