# 统一认证服务 (Auth Service)

基于 NestJS 的统一认证服务，为所有业务系统提供用户认证和权限管理。

## 功能

- 用户注册、登录、登出
- JWT Token 认证（支持 Token 黑名单/主动失效）
- 用户角色管理（5 级权限：guest / user / premium / admin / super_admin）
- 权限继承机制（高级角色自动拥有低级权限）
- Redis 会话管理（Token 黑名单）
- 密码加密存储（bcrypt）
- 登录接口限流保护

## 技术栈

- **NestJS** — Node.js 后端框架
- **TypeORM** — ORM 框架
- **PostgreSQL** — 数据库
- **Redis** — Token 黑名单 + 会话管理
- **JWT** — 无状态 Token 认证
- **bcrypt** — 密码加密

## 项目结构

```
website/
├── backend/
│   ├── src/
│   │   ├── auth/          # 认证模块（登录、JWT、黑名单）
│   │   ├── users/         # 用户管理模块
│   │   ├── redis/         # Redis 客户端封装
│   │   ├── common/        # 公共过滤器、守卫、装饰器
│   │   └── main.ts        # 应用入口
│   └── package.json
├── .env                   # 环境变量配置（参考 .env.example）
├── docker-compose.yml     # PostgreSQL + Redis
├── .env.example           # 环境变量模板
└── README.md
```

## 快速开始

### 前置要求

- Node.js >= 18
- pnpm
- Docker & Docker Compose

### 1. 启动数据库

```bash
docker-compose up -d
```

### 2. 配置环境变量

在项目根目录创建 `.env` 文件（参考 `.env.example`）：

```env
# 必须修改的配置
JWT_SECRET=<64位随机密钥>
POSTGRES_PASSWORD=<强密码>
REDIS_PASSWORD=<强密码>
```

生成 JWT 密钥：
```bash
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

### 3. 安装依赖并启动

```bash
cd backend
pnpm install
pnpm run start:dev
```

服务运行在 http://localhost:3000

### 4. 设置管理员

先注册一个用户，然后设置角色：
```bash
docker exec postgres_auth psql -U admin -d auth_system -c \
  "UPDATE users SET role = 'admin' WHERE username = '用户名';"
```

## API 接口

### 认证接口

| 方法 | 路径 | 说明 | 认证 |
|------|------|------|------|
| POST | `/api/auth/register` | 用户注册 | 否 |
| POST | `/api/auth/login` | 用户登录（限流） | 否 |
| POST | `/api/auth/logout` | 用户登出（Token 失效） | 是 |
| GET  | `/api/auth/profile` | 获取当前用户信息 | 是 |
| POST | `/api/auth/validate` | 验证 Token（供其他服务调用） | 是 |

### 用户管理接口

| 方法 | 路径 | 说明 | 权限 |
|------|------|------|------|
| GET  | `/api/users` | 获取用户列表 | admin / super_admin |
| GET  | `/api/users/:id` | 获取用户详情 | admin / super_admin |
| PUT  | `/api/users/:id` | 更新用户信息 | admin / super_admin |
| DELETE | `/api/users/:id` | 删除用户 | super_admin |

### 请求示例

```bash
# 注册
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"username":"test","password":"123456","email":"test@example.com"}'

# 登录
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"test","password":"123456"}'

# 验证 Token（其他服务调用）
curl -X POST http://localhost:3000/api/auth/validate \
  -H "Authorization: Bearer <token>"
```

## 权限系统

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

高级角色自动拥有低级角色的所有权限。

### 在其他系统中使用

其他业务系统通过调用 `/api/auth/validate` 接口验证 Token：

```typescript
const response = await axios.post(
  'http://localhost:3000/api/auth/validate',
  {},
  { headers: { Authorization: `Bearer ${token}` } }
);
```

## Key Features

- **Token 黑名单**：登出后 Token 立即失效，Redis 存储，自动过期
- **登录限流**：每分钟最多 5 次登录尝试，防止暴力破解
- **CORS 校验**：只允许配置的域名访问，无效 origin 自动过滤
- **全局异常过滤**：统一错误响应格式，生产环境隐藏堆栈

## 安全建议

1. JWT_SECRET 必须使用 64 位以上随机密钥
2. 生产环境设置 `NODE_ENV=production`
3. 使用 HTTPS
4. 定期备份 PostgreSQL 数据库
