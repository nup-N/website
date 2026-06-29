# 部署指南

## 前置要求

- Docker & Docker Compose

## 部署步骤

### 1. 克隆代码

```bash
git clone <仓库地址>
cd website
```

### 2. 配置环境变量

```bash
cp .env.example .env
```

编辑 `.env`，填入 JWT_SECRET（必须修改）：

```bash
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

### 3. 启动服务

```bash
docker compose up -d
```

服务运行在 `http://服务器IP:3000`

### 4. 配置反向代理（推荐）

```nginx
server {
    listen 80;
    server_name auth.yourdomain.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

### 5. 配置 SSL（推荐）

```bash
sudo apt-get install certbot python3-certbot-nginx -y
sudo certbot --nginx -d auth.yourdomain.com
```

## 数据管理

SQLite 数据库文件在容器内 `/app/data/auth.db`，通过 volume `auth_data` 持久化。

### 备份

```bash
docker run --rm -v auth_data:/data -v $(pwd):/backup alpine tar czf /backup/auth_backup_$(date +%Y%m%d).tar.gz -C /data .
```

### 设置管理员

启动后注册一个用户，然后进入容器修改角色：

```bash
docker exec -it auth_service sqlite3 /app/data/auth.db
UPDATE users SET role = 'admin' WHERE username = '你的用户名';
.exit
```

## 日常运维

```bash
# 查看日志
docker compose logs -f

# 重启
docker compose restart

# 更新（拉取新代码后重新构建）
git pull
docker compose up -d --build
```
