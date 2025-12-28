# 统一认证服务 (Website)

这是一个基于NestJS的统一认证服务，为所有业务系统提供用户认证和权限管理。

## 📋 功能特性

- ✅ 用户注册、登录、登出
- ✅ JWT Token 认证
- ✅ 用户角色管理（5级权限）
- ✅ 权限继承机制
- ✅ Redis 会话管理
- ✅ 密码加密存储
- ✅ Token 刷新机制

## 🛠️ 技术栈

### 后端 (backend/)
- **NestJS** - Node.js框架
- **TypeORM** - ORM框架
- **PostgreSQL** - 用户数据库
- **Redis** - 会话管理
- **JWT** - Token认证
- **bcrypt** - 密码加密

### 前端 (frontend/)
- **React** - 前端框架
- **TypeScript** - 类型系统
- **Vite** - 构建工具

## 📂 项目结构

```
website/
├── backend/              # 后端服务
│   ├── src/
│   │   ├── auth/        # 认证模块
│   │   │   ├── auth.controller.ts    # 登录、登出接口
│   │   │   ├── auth.service.ts       # 认证逻辑
│   │   │   ├── jwt.strategy.ts       # JWT策略
│   │   │   └── jwt-auth.guard.ts     # JWT守卫
│   │   ├── users/       # 用户管理模块
│   │   │   ├── users.controller.ts   # 用户CRUD接口
│   │   │   ├── users.service.ts      # 用户业务逻辑
│   │   │   └── entities/user.entity.ts
│   │   └── main.ts      # 应用入口
│   └── package.json
│
├── frontend/            # 前端服务（可选）
│   ├── src/
│   │   ├── pages/       # 页面组件
│   │   └── services/    # API服务
│   └── package.json
│
├── .env                 # 环境变量配置（需创建，参考.env.example）
├── .env.example         # 环境变量配置模板
├── docker-compose.yml   # Docker配置（PostgreSQL + Redis）
├── set-admin-docker.sh  # 设置管理员脚本（Linux/Mac）
├── set-admin-docker.bat # 设置管理员脚本（Windows）
├── README.md            # 本文件
├── DEPLOYMENT.md        # 部署指南
└── .gitignore           # Git配置
```

## 🚀 快速开始

### 前置要求

- Node.js >= 18
- pnpm
- Docker & Docker Compose

### 1. 启动数据库

```bash
# 确保已配置 .env 文件（参考下面的环境变量配置）
docker-compose up -d
```

这将启动：
- PostgreSQL (端口 5432)
- Redis (端口 6379)

### 2. 配置环境变量

**只需要一个配置文件：** 在 `website` 目录创建 `.env` 文件

前后端和Docker都会自动读取此文件。

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
DB_PASSWORD=<与上面相同的强密码>
DB_DATABASE=auth_system

REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=<与上面相同的Redis密码>

# JWT 配置（重要！）
JWT_SECRET=<至少64字符的随机密钥>
JWT_EXPIRES_IN=7d

NODE_ENV=development
PORT=3000
CORS_ORIGIN=http://localhost:5173

# ==================== 前端配置 ====================
VITE_API_BASE_URL=/api
```

**生成JWT密钥：**
```bash
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

**详细配置说明：** [ENVIRONMENT.md](./ENVIRONMENT.md)

### 3. 安装依赖并启动

```bash
cd backend
pnpm install
pnpm run start:dev
```

服务将在 http://localhost:3000 启动

### 4. 设置管理员用户

首先注册一个用户，然后设置为管理员：

```bash
# Windows
set-admin-docker.bat 用户名

# Linux/Mac
./set-admin-docker.sh 用户名
```

## 📡 API接口

### 认证接口

| 方法 | 路径 | 说明 | 认证 |
|------|------|------|------|
| POST | `/api/auth/register` | 用户注册 | 否 |
| POST | `/api/auth/login` | 用户登录 | 否 |
| POST | `/api/auth/logout` | 用户登出 | 是 |
| GET  | `/api/auth/profile` | 获取当前用户信息 | 是 |
| POST | `/api/auth/validate` | 验证Token（供其他服务调用） | 是 |

### 用户管理接口

| 方法 | 路径 | 说明 | 权限 |
|------|------|------|------|
| GET  | `/api/users` | 获取用户列表 | admin |
| GET  | `/api/users/:id` | 获取用户详情 | admin |
| PUT  | `/api/users/:id` | 更新用户信息 | admin |
| DELETE | `/api/users/:id` | 删除用户 | admin |

### 请求示例

#### 注册
```bash
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"username":"test","password":"123456","email":"test@example.com"}'
```

#### 登录
```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"test","password":"123456"}'
```

#### 验证Token（其他服务调用）
```bash
curl -X POST http://localhost:3000/api/auth/validate \
  -H "Authorization: Bearer <token>"
```

## 🔐 权限系统

### 角色定义

```typescript
enum UserRole {
  GUEST = 'guest',          // 0 - 访客
  USER = 'user',            // 1 - 普通用户
  PREMIUM = 'premium',      // 2 - 高级用户
  ADMIN = 'admin',          // 3 - 管理员
  SUPER_ADMIN = 'super_admin' // 4 - 超级管理员
}
```

### 权限继承

- 更高权限等级自动拥有低等级的所有权限
- 例如：admin 拥有 user 和 premium 的所有权限

### 在业务系统中使用

其他业务系统通过调用 `/api/auth/validate` 接口验证用户Token：

```typescript
// 业务系统的认证守卫示例
async validateToken(token: string) {
  const response = await axios.post(
    'http://localhost:3000/api/auth/validate',
    {},
    { headers: { Authorization: `Bearer ${token}` } }
  );
  return response.data; // 返回用户信息
}
```

## 📦 生产环境部署

详细部署指南请参考 [DEPLOYMENT.md](./DEPLOYMENT.md)

### 快速部署步骤

1. **配置环境变量**
   - 修改所有密码和密钥为强密码
   - 设置 `NODE_ENV=production`

2. **启动数据库**
   ```bash
   docker-compose up -d
   ```

3. **构建项目**
   ```bash
   cd backend
   pnpm install --prod
   pnpm run build
   ```

4. **使用PM2启动**
   ```bash
   pm2 start dist/main.js --name "auth-service"
   pm2 save
   pm2 startup
   ```

## 🔧 开发指南

### 添加新的API端点

1. 在相应的controller中添加方法
2. 使用 `@UseGuards(JwtAuthGuard)` 保护需要认证的接口
3. 使用 `@Request()` 装饰器获取当前用户信息

```typescript
@UseGuards(JwtAuthGuard)
@Get('profile')
getProfile(@Request() req) {
  return req.user;
}
```

### 数据库迁移

- **开发环境：** `synchronize: true`（自动同步表结构）
- **生产环境：** `synchronize: false`（使用TypeORM迁移脚本）

### 日志

使用NestJS内置的Logger：

```typescript
import { Logger } from '@nestjs/common';

private readonly logger = new Logger(AuthService.name);
this.logger.log('User logged in');
```

## 🧪 测试

```bash
# 单元测试
pnpm run test

# e2e测试
pnpm run test:e2e

# 测试覆盖率
pnpm run test:cov
```

## 📊 监控

### 查看服务状态

```bash
# PM2状态
pm2 status

# 查看日志
pm2 logs auth-service

# 监控
pm2 monit
```

### Docker容器状态

```bash
# 查看容器
docker ps

# 查看日志
docker-compose logs -f

# 重启服务
docker-compose restart
```

## 🛡️ 安全建议

1. **使用强密码** - 数据库、Redis、JWT密钥都要使用强密码
2. **HTTPS** - 生产环境必须使用HTTPS
3. **限流** - 实现登录接口的限流保护
4. **定期更新** - 及时更新依赖包修复安全漏洞
5. **备份** - 定期备份PostgreSQL数据库

## 🔍 常见问题

### Q: 如何重置管理员密码？

A: 直接在数据库中更新密码：
```sql
-- 密码需要使用bcrypt加密
UPDATE users SET password = '<加密后的密码>' WHERE username = 'admin';
```

### Q: 如何修改Token过期时间？

A: 修改 `.env` 中的 `JWT_EXPIRES_IN` 配置。

### Q: 如何备份数据库？

A: 使用pg_dump：
```bash
docker exec postgres_auth pg_dump -U admin auth_system > backup.sql
```

## 📞 技术支持

查看 [DEPLOYMENT.md](./DEPLOYMENT.md) 了解详细部署步骤和故障排查。

## 📄 许可证

私有项目，未经授权不得使用。

