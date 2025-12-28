# 环境变量配置指南

## 📋 配置文件位置

**只需要一个配置文件：** `website/.env`

前后端会自动从项目根目录读取此文件。

## 🔧 完整配置模板

在 `website/.env` 文件中配置以下内容：

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
CORS_ORIGIN=http://localhost:5173,http://192.168.10.107:5173

# ==================== 前端配置 ====================
# API配置（如果需要）
VITE_API_BASE_URL=/api
```

## 🚀 生产环境配置

```env
# ==================== Docker 配置 ====================
POSTGRES_DB=auth_system
POSTGRES_USER=admin
POSTGRES_PASSWORD=<强密码>
POSTGRES_PORT=5432

REDIS_PASSWORD=<强Redis密码>
REDIS_PORT=6379

# ==================== 后端配置 ====================
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=admin
DB_PASSWORD=<强密码>
DB_DATABASE=auth_system

REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=<强Redis密码>

JWT_SECRET=<64位以上随机密钥>
JWT_EXPIRES_IN=7d

NODE_ENV=production
PORT=3000

CORS_ORIGIN=https://www.yourdomain.com

# ==================== 前端配置 ====================
VITE_API_BASE_URL=/api
```

## 🔑 生成强密钥

```bash
# 生成普通密码（32字符）
node -e "console.log(require('crypto').randomBytes(16).toString('hex'))"

# 生成 JWT_SECRET（64字符，推荐128字符）
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"

# 或使用 OpenSSL
openssl rand -hex 64
```

## ⚠️ 重要说明

### 配置读取机制
- ✅ **后端**：自动从 `website/.env` 读取
- ✅ **前端**：自动从 `website/.env` 读取
- ✅ **Docker**：docker-compose.yml 从同目录读取

### 密码一致性
确保以下配置保持一致：
```env
POSTGRES_PASSWORD=same_password
DB_PASSWORD=same_password

REDIS_PASSWORD=same_redis_password
# Redis配置中的密码要一致
```

### 必填配置项
- `POSTGRES_PASSWORD` - PostgreSQL密码
- `DB_PASSWORD` - 后端数据库密码
- `REDIS_PASSWORD` - Redis密码
- `JWT_SECRET` - JWT密钥（至少64字符）

## 🔒 安全建议

1. **永远不要提交 `.env` 文件到 Git**
2. **使用强密码**（至少12位，包含大小写字母、数字、特殊字符）
3. **JWT_SECRET 必须使用随机生成的强密钥**（至少64字符）
4. **生产环境必须修改所有默认密码**
5. **定期更换密码和密钥**

## 📝 快速开始

### 1. 创建配置文件
```bash
# 在 website 目录下创建 .env
cd website
touch .env
```

### 2. 复制上述配置模板

### 3. 生成并填入强密钥
```bash
# 生成JWT密钥
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
# 将输出复制到 JWT_SECRET
```

### 4. 修改所有密码

### 5. 启动服务
```bash
# 启动数据库
docker-compose up -d

# 启动后端（会自动读取根目录的.env）
cd backend
pnpm install
pnpm run start:dev

# 启动前端（会自动读取根目录的.env）
cd frontend
pnpm install
pnpm run dev
```

## 🔍 验证配置

启动后检查日志：
```bash
# 后端日志应该显示：
# 🚀 统一认证系统后端运行在: http://0.0.0.0:3000 [development]

# 如果看到数据库连接错误
# 检查 DB_PASSWORD 是否与 POSTGRES_PASSWORD 一致
```

## 📂 文件结构

```
website/
├── .env                 # ✅ 唯一的环境变量文件
├── backend/            # 自动读取 ../.env
│   └── src/
├── frontend/           # 自动读取 ../.env (envDir: '..')
│   └── src/
└── docker-compose.yml  # 读取 ./.env
```

## ❓ 常见问题

### Q: 后端无法连接数据库？
**A:** 检查 `DB_PASSWORD` 是否与 `POSTGRES_PASSWORD` 一致

### Q: Redis连接失败？
**A:** 检查 Redis 密码配置是否一致

### Q: JWT验证失败？
**A:** 确保 `JWT_SECRET` 已正确配置且足够长（至少64字符）

### Q: CORS错误？
**A:** 检查 `CORS_ORIGIN` 是否包含前端地址

### Q: 修改.env后不生效？
**A:** 重启后端和前端服务：
```bash
# 后端会自动重载（watch模式）
# 前端需要手动重启：Ctrl+C 然后重新 pnpm run dev
# Docker需要重启：docker-compose restart
```

## 🎯 首次部署检查清单

- [ ] 已创建 `website/.env` 文件
- [ ] 已修改所有密码为强密码
- [ ] 已生成并配置 JWT_SECRET（至少64字符）
- [ ] 数据库密码一致性检查（POSTGRES_PASSWORD = DB_PASSWORD）
- [ ] Redis密码一致性检查
- [ ] 已配置 CORS_ORIGIN（如果需要）
- [ ] 已验证配置文件格式正确（无空格等）
