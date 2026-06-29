# 统一认证服务 (Auth Service)

基于 Express + SQLite 的统一认证服务，为所有业务系统提供用户认证和权限管理。

## 功能

- 用户注册、登录、登出
- JWT Token 认证（支持 Token 版本失效/主动登出）
- 用户角色管理（5 级权限：guest / user / premium / admin / super_admin）
- 权限继承机制（高级角色自动拥有低级权限）
- 登录接口限流保护
- 内置管理员前端（React）

## 技术栈

- **Express** — Node.js 后端框架
- **better-sqlite3** — 嵌入式数据库（无需独立服务）
- **JWT** — 无状态 Token 认证
- **bcrypt** — 密码加密
- **React + Vite** — 管理前端

## 快速开始

### 1. 安装依赖

```bash
cd backend
npm install
```

### 2. 配置环境变量

在项目根目录创建 `.env` 文件（参考 `.env.example`）：

```env
JWT_SECRET=<64位随机密钥>
CORS_ORIGIN=http://localhost:5173
```

生成 JWT 密钥：
```bash
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

### 3. 启动后端

```bash
cd backend
npm start
```

服务运行在 http://localhost:3000

### 4. 启动前端（开发模式）

```bash
cd frontend
npm install
npm run dev
```

前端运行在 http://localhost:5173（自动代理 API 到后端）

## Docker 部署

```bash
# .env 中填入 JWT_SECRET
docker compose up -d
```

单个容器，运行在 http://localhost:3000

## API 接口

| 方法 | 路径 | 说明 | 认证 |
|------|------|------|------|
| POST | `/api/auth/register` | 用户注册 | 否 |
| POST | `/api/auth/login` | 用户登录（限流） | 否 |
| POST | `/api/auth/logout` | 用户登出 | 是 |
| GET  | `/api/auth/profile` | 获取当前用户信息 | 是 |
| POST | `/api/auth/validate` | 验证 Token | 否 |
| GET  | `/api/users` | 获取用户列表 | admin+ |
| GET  | `/api/users/:id` | 获取用户详情 | admin+ |
| PATCH | `/api/users/:id` | 更新用户信息 | admin+ |
| DELETE | `/api/users/:id` | 删除用户 | super_admin |

## 项目结构

```
website/
├── backend/
│   └── src/
│       ├── index.js    # Express 入口
│       ├── db.js       # SQLite 数据库
│       ├── auth.js     # JWT + 中间件
│       └── routes.js   # API 路由
├── frontend/
│   └── src/            # React 管理前端
├── docker-compose.yml  # 单服务部署
├── Dockerfile          # 构建镜像
└── .env                # 环境变量配置
```
