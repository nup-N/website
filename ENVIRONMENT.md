# 环境变量配置指南

## 配置说明

本项目使用统一的 `.env` 文件（位于项目根目录），后端和 Docker 都会自动读取。

## 完整配置模板

```env
# ==================== Docker 配置 ====================
# PostgreSQL 配置
POSTGRES_DB=auth_system
POSTGRES_USER=admin
POSTGRES_PASSWORD=your_strong_password_here
POSTGRES_PORT=5432

# Redis 配置
REDIS_PASSWORD=your_redis_password_here
REDIS_PORT=6379

# ==================== 后端配置 ====================
# 数据库配置
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=admin
DB_PASSWORD=your_strong_password_here
DB_DATABASE=auth_system

# Redis 配置
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=your_redis_password_here

# JWT 配置（重要！）
JWT_SECRET=your_jwt_secret_key_here_64_characters_minimum
JWT_EXPIRES_IN=7d

# 应用配置
NODE_ENV=development
PORT=3000

# CORS配置（多个来源用逗号分隔）
CORS_ORIGIN=http://localhost:3000
```

## 生产环境配置

```env
NODE_ENV=production
CORS_ORIGIN=https://www.yourdomain.com
```

## 生成强密钥

```bash
# 生成密码（32字节）
node -e "console.log(require('crypto').randomBytes(16).toString('hex'))"

# 生成 JWT_SECRET（64字节，推荐128字节）
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

## 重要说明

### 配置读取机制
- **后端**：自动从 `website/.env` 读取
- **Docker**：docker-compose.yml 从同目录读取

### 密码一致性
确保以下配置保持一致：
```env
POSTGRES_PASSWORD=same_password
DB_PASSWORD=same_password

REDIS_PASSWORD=same_redis_password
```

### 必填配置项
- `POSTGRES_PASSWORD` - PostgreSQL密码
- `DB_PASSWORD` - 后端数据库密码
- `REDIS_PASSWORD` - Redis密码
- `JWT_SECRET` - JWT密钥（至少64字符）

## 安全建议

1. **永远不要提交 .env 文件到 Git**
2. **使用强密码**（至少12位，包含大小写字母、数字、特殊字符）
3. **JWT_SECRET 必须使用随机生成的强密钥**（至少64字符）
4. **生产环境必须修改所有默认密码**
5. **定期更换密码和密钥**

## 快速开始

### 1. 创建配置文件
```bash
# 在 website 目录下创建 .env
cd website
touch .env
```

### 2. 复制上述配置模板

### 3. 生成并填入强密钥
```bash
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

### 4. 修改所有密码

### 5. 启动服务
```bash
# 启动数据库
docker-compose up -d

# 启动后端
cd backend
pnpm install
pnpm run start:dev
```

## 验证配置

启动后检查日志：
```bash
# 后端日志应显示：
# 🚀 Auth Service running at http://0.0.0.0:3000 [development]

# 如果看到数据库连接错误
# 检查 DB_PASSWORD 是否与 POSTGRES_PASSWORD 一致
```