# Code Wiki：统一认证服务（Auth Service）

> 项目路径：`d:\vscode\website`  
> 本文档基于仓库源码与配置文件自动生成，覆盖项目架构、模块职责、关键类/函数、依赖关系与运行方式。

---

## 1. 项目概述

统一认证服务是一个基于 **Express + SQLite + React + Vite** 的全栈应用，为业务系统提供用户认证与权限管理能力。

### 1.1 核心能力

- 用户注册、登录、登出
- JWT Token 认证，支持 Token 版本失效与主动登出
- 5 级角色体系：`guest / user / premium / admin / super_admin`
- 角色权限继承机制（高级角色自动拥有低级权限）
- 登录接口限流保护（Rate Limit）
- 内置管理员前端界面（React）

### 1.2 系统架构

```
┌─────────────────────────────────────────────────────────────┐
│                        客户端浏览器                           │
└─────────────────────────┬───────────────────────────────────┘
                          │
┌─────────────────────────▼───────────────────────────────────┐
│  前端 (Frontend)                                            │
│  React 19 + TypeScript + Vite                               │
│  - 开发服务器: http://localhost:5173                        │
│  - 生产构建产物: frontend/dist/                             │
└─────────────────────────┬───────────────────────────────────┘
                          │ /api/*
┌─────────────────────────▼───────────────────────────────────┐
│  后端 (Backend)                                             │
│  Express 4 + better-sqlite3 + JWT + bcrypt                  │
│  - 服务地址: http://localhost:3000                          │
│  - 静态资源: backend/public/（前端构建产物）                 │
│  - 数据库: data/auth.db（SQLite）                           │
└─────────────────────────────────────────────────────────────┘
```

---

## 2. 项目结构

```
website/
├── backend/                     # 后端服务
│   ├── src/
│   │   ├── index.js             # Express 应用入口
│   │   ├── db.js                # SQLite 数据库与数据操作
│   │   ├── auth.js              # JWT 签发、验证、权限中间件
│   │   └── routes.js            # REST API 路由
│   ├── package.json
│   └── package-lock.json
├── frontend/                    # 前端管理界面
│   ├── src/
│   │   ├── App.tsx              # 应用主组件（登录 + 用户管理）
│   │   ├── main.tsx             # React 应用挂载入口
│   │   ├── App.css              # 全局样式
│   │   └── vite-env.d.ts        # Vite 客户端类型声明
│   ├── index.html
│   ├── vite.config.ts           # Vite 配置（含 API 代理）
│   ├── tsconfig.json            # TypeScript 工程引用配置
│   ├── tsconfig.app.json        # 应用 TS 配置
│   ├── tsconfig.node.json       # Node 工具 TS 配置
│   └── package.json
├── data/                        # SQLite 数据目录（运行时生成）
│   └── .gitkeep
├── .env.example                 # 环境变量示例
├── docker-compose.yml           # Docker Compose 部署配置
├── Dockerfile                   # 单容器构建镜像
├── README.md                    # 项目说明
├── DEPLOYMENT.md                # 部署指南
├── ENVIRONMENT.md               # 环境变量指南
└── .gitignore
```

---

## 3. 技术栈与依赖

### 3.1 后端依赖

| 依赖 | 版本 | 作用 |
|------|------|------|
| `express` | ^4.21.0 | Node.js Web 框架 |
| `better-sqlite3` | ^12.11.1 | 嵌入式 SQLite 数据库 |
| `jsonwebtoken` | ^9.0.2 | JWT 签发与验证 |
| `bcrypt` | ^6.0.0 | 密码哈希加密 |
| `cookie-parser` | ^1.4.7 | Cookie 解析中间件 |
| `express-rate-limit` | ^7.5.0 | 接口限流保护 |
| `cors` | ^2.8.5 | 跨域资源共享 |

### 3.2 前端依赖

| 依赖 | 版本 | 作用 |
|------|------|------|
| `react` | ^19.0.0 | UI 框架 |
| `react-dom` | ^19.0.0 | React DOM 渲染 |
| `typescript` | ~5.7.0 | 类型系统 |
| `vite` | ^6.0.0 | 构建工具与开发服务器 |
| `@vitejs/plugin-react` | ^4.0.0 | Vite React 插件 |
| `@types/react` / `@types/react-dom` | ^19.0.0 | React 类型定义 |

### 3.3 部署依赖

- Docker & Docker Compose
- Nginx（推荐用于反向代理与 SSL）
- Certbot（推荐用于免费 SSL 证书）

---

## 4. 后端模块详解

### 4.1 `backend/src/index.js` — Express 入口

**职责**：组装中间件、挂载路由、启动 HTTP 服务、提供静态资源与 SPA 回退。

| 关键代码 | 说明 |
|----------|------|
| `db.initDatabase()` | 启动时初始化 SQLite 数据库表 |
| `app.use(cookieParser())` | 解析请求 Cookie |
| `app.use(express.json())` | 解析 JSON 请求体 |
| CORS 配置 | 根据 `CORS_ORIGIN` 环境变量配置跨域，支持多来源逗号分隔；未配置且非生产环境则允许全部 |
| `express.static(publicPath)` | 托管前端构建产物 `backend/public/` |
| `app.use('/api', routes)` | 挂载 API 路由 |
| `app.get('*', ...)` | SPA 路由回退到 `index.html` |
| 全局错误处理中间件 | 500 错误统一返回，生产环境隐藏错误详情 |
| `app.listen(PORT, '0.0.0.0', ...)` | 监听 `0.0.0.0`，默认端口 3000 |

**关键函数**：无独立导出，启动即运行。

### 4.2 `backend/src/db.js` — 数据层

**职责**：初始化 SQLite 数据库，封装用户 CRUD 与 Token 版本管理。

#### 数据库表结构：`users`

| 字段 | 类型 | 约束 | 说明 |
|------|------|------|------|
| `id` | INTEGER | PRIMARY KEY AUTOINCREMENT | 用户 ID |
| `username` | TEXT | UNIQUE NOT NULL | 用户名 |
| `email` | TEXT | UNIQUE NOT NULL | 邮箱 |
| `password` | TEXT | NOT NULL | bcrypt 加密后的密码 |
| `role` | TEXT | NOT NULL DEFAULT 'user' | 角色，CHECK 限定 5 级 |
| `token_version` | INTEGER | NOT NULL DEFAULT 0 | Token 版本号，登出时递增 |
| `created_at` | DATETIME | DEFAULT CURRENT_TIMESTAMP | 创建时间 |
| `updated_at` | DATETIME | DEFAULT CURRENT_TIMESTAMP | 更新时间 |

#### 导出函数

| 函数 | 参数 | 返回值 | 说明 |
|------|------|--------|------|
| `initDatabase()` | 无 | `Database` 实例 | 创建数据目录、连接数据库、启用 WAL 与外键、建表 |
| `createUser({ username, email, password })` | 用户对象 | 新用户信息（不含密码） | 使用 bcrypt 哈希密码后插入 |
| `getById(id)` | 用户 ID | 用户对象或 `null` | 返回除密码外的全部字段 |
| `getByUsername(username)` | 用户名 | 用户对象或 `null` | 返回包含密码的完整记录，用于登录验证 |
| `getAllUsers()` | 无 | 用户数组 | 返回除密码与 token_version 外的全部用户 |
| `updateUser(id, fields)` | ID、待更新字段 | 更新后用户对象 | 支持动态字段，密码字段自动哈希；自动更新 `updated_at` |
| `deleteUser(id)` | 用户 ID | 无 | 删除指定用户 |
| `incrementTokenVersion(id)` | 用户 ID | 无 | 将用户 token_version 加 1，用于登出失效 |

### 4.3 `backend/src/auth.js` — 认证与授权

**职责**：JWT 生命周期管理与请求认证/授权中间件。

#### 常量

| 常量 | 说明 |
|------|------|
| `JWT_SECRET` | 从环境变量读取，缺失则进程退出 |
| `JWT_EXPIRES_IN` | 默认 `7d` |
| `ROLE_HIERARCHY` | 角色等级映射：`guest:0, user:1, premium:2, admin:3, super_admin:4` |

#### 导出函数

| 函数 | 参数 | 返回值 | 说明 |
|------|------|--------|------|
| `signToken(user)` | 用户对象 | JWT 字符串 | Payload 包含 `sub`、`username`、`role`、`tv`（token_version） |
| `verifyToken(token)` | Token 字符串 | 解码后的 Payload | 使用 `JWT_SECRET` 校验签名 |
| `extractToken(req)` | Express Request | Token 字符串或 `null` | 优先从 `Authorization: Bearer <token>` 获取，其次从 Cookie `access_token` |
| `getTokenTtlSeconds(token)` | Token 字符串 | 剩余秒数或 `null` | 基于 `exp` 计算剩余有效期 |
| `requireAuth(req, res, next)` | Express 中间件参数 | 无 | 校验 Token、用户存在性、token_version 一致性；通过后在 `req.user` 与 `req.tokenPayload` 注入信息 |
| `requireRole(...roles)` | 允许的角色列表 | Express 中间件 | 基于 `ROLE_HIERARCHY` 判断用户等级是否满足最低要求 |

**认证失败场景**：
- 未提供 Token → 401
- Token 过期 → 401，提示"Token 已过期"
- Token 无效 → 401，提示"Token 无效"
- 用户不存在或 `token_version` 不匹配 → 401，提示"Token 已失效"

### 4.4 `backend/src/routes.js` — API 路由

**职责**：定义所有 RESTful 接口，处理请求参数校验与业务响应。

#### 限流器

| 中间件 | 配置 | 说明 |
|--------|------|------|
| `loginLimiter` | `windowMs: 60000, max: 5` | 登录接口每分钟最多 5 次请求 |

#### 路由表

| 方法 | 路径 | 认证 | 角色 | 说明 |
|------|------|------|------|------|
| POST | `/api/auth/register` | 否 | - | 用户注册，返回 Token 与用户信息 |
| POST | `/api/auth/login` | 否 | - | 用户登录（限流），返回 Token 与用户信息 |
| POST | `/api/auth/logout` | 是 | - | 登出，递增 token_version 并清除 Cookie |
| GET | `/api/auth/profile` | 是 | - | 获取当前登录用户信息 |
| POST | `/api/auth/validate` | 否 | - | 校验 Token 是否有效 |
| GET | `/api/users` | 是 | admin+ | 获取用户列表 |
| GET | `/api/users/:id` | 是 | admin+ | 获取用户详情 |
| PATCH | `/api/users/:id` | 是 | admin+ | 更新用户信息 |
| DELETE | `/api/users/:id` | 是 | super_admin | 删除用户 |

#### 关键业务逻辑

- **注册校验**：用户名 3-20 字符，必填字段校验，唯一性冲突返回 409。
- **登录校验**：用户名/密码必填，密码使用 `bcrypt.compareSync` 校验。
- **Cookie 设置**：`httpOnly`、`sameSite='lax'`，生产环境启用 `secure`，maxAge 基于 Token 有效期。
- **角色更新权限**：
  - 不能修改自己的角色；
  - 不能设置高于自己等级的角色；
  - 非 super_admin 不能调整 admin 及以上角色；
  - 非 super_admin 只能设置 `guest/user/premium`。
- **用户删除**：仅 super_admin 可执行。

---

## 5. 前端模块详解

### 5.1 `frontend/src/App.tsx` — 应用主组件

**职责**：根据登录状态展示登录页或用户管理后台。

#### 类型与常量

| 名称 | 类型/值 | 说明 |
|------|---------|------|
| `API` | `"/api"` | 接口基础路径 |
| `ROLE_COLORS` | `Record<string, string>` | 各角色标签颜色 |
| `ROLE_LABELS` | `Record<string, string>` | 各角色中文名 |
| `CurrentUser` | interface | 当前用户：`id, username, role` |
| `User` | interface | 用户列表项：`id, username, email, role, createdAt` |

#### 工具函数

| 函数 | 说明 |
|------|------|
| `api(path, opts?)` | 封装 `fetch`，自动携带 `Content-Type` 与 `credentials: "include"`，非 2xx 响应抛出错误 |

#### 组件

##### `LoginForm`

- 接收 `onLogin` 回调，登录成功后切换状态。
- 表单字段：用户名、密码。
- 状态：`loading`、`error`。

##### `AdminPanel`

- 展示用户列表表格，支持角色修改。
- 权限控制：
  - `canEditRoleOf(target)`：super_admin 可编辑除自己外所有角色；admin 只能编辑非管理员用户。
  - `roleOptionsFor(target)`：super_admin 拥有全部角色选项；admin 仅 `guest/user/premium`。
- 操作：登出（调用 `/api/auth/logout`）。

##### `App`（默认导出）

- 挂载时调用 `/api/auth/profile` 校验登录状态。
- 根据 `user` 状态渲染登录页或管理后台。

### 5.2 `frontend/src/main.tsx` — 应用挂载

- 使用 `ReactDOM.createRoot` 创建根节点。
- 包裹 `React.StrictMode`，渲染 `<App />`。
- 导入 `App.css` 全局样式。

### 5.3 `frontend/src/App.css` — 全局样式

- 登录页居中卡片布局
- 表单、按钮、错误提示、加载状态样式
- 用户管理表格、角色标签、响应式布局

### 5.4 `frontend/vite.config.ts` — Vite 配置

| 配置项 | 值 | 说明 |
|--------|-----|------|
| `plugins` | `[react()]` | 启用 React 快速刷新 |
| `server.host` | `"0.0.0.0"` | 监听所有网卡 |
| `server.port` | `5173` | 开发服务器端口 |
| `server.proxy."/api"` | `target: "http://localhost:3000"` | 将 `/api/*` 代理到后端服务 |

---

## 6. 关键数据流

### 6.1 登录流程

```
用户提交表单
    │
    ▼
POST /api/auth/login ──► loginLimiter 限流
    │
    ▼
bcrypt.compareSync 校验密码
    │
    ▼
auth.signToken(user) 生成 JWT
    │
    ▼
setCookie(res, token) 写入 httpOnly Cookie
    │
    ▼
返回 { access_token, user }
```

### 6.2 认证校验流程

```
请求到达受保护接口
    │
    ▼
auth.requireAuth 提取 Token
    │
    ▼
auth.verifyToken 校验签名与有效期
    │
    ▼
db.getById 查询用户并比对 token_version
    │
    ▼
auth.requireRole 校验角色等级
    │
    ▼
执行目标接口逻辑
```

### 6.3 登出/Token 失效流程

```
POST /api/auth/logout
    │
    ▼
requireAuth 通过
    │
    ▼
db.incrementTokenVersion(user.id) 版本号 +1
    │
    ▼
清除 Cookie access_token
    │
    ▼
用户再次携带旧 Token 请求时，token_version 不匹配，认证失败
```

---

## 7. 环境变量

| 变量 | 必填 | 默认值 | 说明 |
|------|------|--------|------|
| `JWT_SECRET` | 是 | - | JWT 签名密钥，建议 ≥64 位随机字符 |
| `JWT_EXPIRES_IN` | 否 | `7d` | Token 有效期 |
| `PORT` | 否 | `3000` | 后端服务端口 |
| `NODE_ENV` | 否 | `development` | 运行环境，`production` 会启用安全 Cookie 并隐藏错误详情 |
| `CORS_ORIGIN` | 否 | - | 允许的跨域来源，多个用逗号分隔 |
| `DB_PATH` | 否 | `backend/data/auth.db` | SQLite 数据库文件路径 |

### 生成 JWT 密钥

```bash
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

---

## 8. 运行方式

### 8.1 本地开发

#### 启动后端

```bash
cd backend
npm install
# 在项目根目录创建 .env 并配置 JWT_SECRET
npm start
```

后端运行于 http://localhost:3000

#### 启动前端

```bash
cd frontend
npm install
npm run dev
```

前端运行于 http://localhost:5173，API 请求自动代理到后端。

### 8.2 Docker 部署

```bash
# 配置环境变量
cp .env.example .env
# 编辑 .env，设置 JWT_SECRET

# 启动服务
docker compose up -d
```

服务运行于 http://服务器IP:3000

### 8.3 常用运维命令

```bash
# 查看日志
docker compose logs -f

# 重启
docker compose restart

# 更新并重建
git pull
docker compose up -d --build
```

---

## 9. 部署要点

- 数据库文件位于容器内 `/app/data/auth.db`，通过 Docker Volume `auth_data` 持久化。
- 生产环境推荐通过 Nginx 反向代理并配置 SSL（Certbot）。
- 首次部署后需注册一个用户，再通过 SQL 将其角色提升为 `admin`：

```bash
docker exec -it auth_service sqlite3 /app/data/auth.db
UPDATE users SET role = 'admin' WHERE username = '你的用户名';
.exit
```

---

## 10. 文件依赖关系图

```
backend/src/index.js
    ├── db.js              (initDatabase)
    ├── routes.js          (API 路由)
    │       ├── db.js      (用户数据操作)
    │       └── auth.js    (认证/授权中间件)
    │               └── db.js (getById)
    └── cookie-parser / express / cors

frontend/src/main.tsx
    └── App.tsx
            └── App.css

Dockerfile
    ├── frontend/ (构建为静态产物)
    └── backend/src/ + public/ (运行 Express)
```

---

## 11. 注意事项

- `.env` 与 SQLite 数据库文件不应提交到 Git（已配置 `.gitignore`）。
- `JWT_SECRET` 必须设置为强随机字符串，否则服务启动失败。
- 登录接口限流基于内存存储，多实例部署时建议使用 Redis 等共享存储。
- 当前项目未包含自动化测试与输入校验库（如 Joi/Zod），如后续扩展建议补充。
