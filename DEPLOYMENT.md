# 统一认证服务 - 部署指南

## 📋 部署前检查清单

- [ ] 已安装 Node.js >= 18
- [ ] 已安装 pnpm
- [ ] 已安装 Docker & Docker Compose
- [ ] 已安装 PM2（生产环境）
- [ ] 已配置所有环境变量文件
- [ ] 已修改所有默认密码和密钥
- [ ] 已配置防火墙规则

## 🌐 生产环境部署

### 1. 环境准备

#### 安装必要工具

```bash
# 安装 Node.js 18+
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# 安装 pnpm
npm install -g pnpm

# 安装 PM2
npm install -g pm2

# 安装 Docker
sudo apt-get update
sudo apt-get install docker.io docker-compose -y

# 启动 Docker
sudo systemctl start docker
sudo systemctl enable docker
```

### 2. 配置环境变量

#### `.env` (Docker配置)

```bash
cat > .env << 'EOF'
# PostgreSQL 配置
POSTGRES_DB=auth_system
POSTGRES_USER=admin
POSTGRES_PASSWORD=<生成的强密码>
POSTGRES_PORT=5432

# Redis 配置
REDIS_PASSWORD=<生成的强密码>
REDIS_PORT=6379
EOF

chmod 600 .env
```

#### `backend/.env` (应用配置)

```bash
cd backend
cat > .env << 'EOF'
# 数据库配置
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=admin
DB_PASSWORD=<与Docker配置相同>
DB_DATABASE=auth_system

# Redis 配置
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=<与Docker配置相同>

# JWT 配置
JWT_SECRET=<生成的64字符强密钥>
JWT_EXPIRES_IN=7d

# 应用配置
NODE_ENV=production
PORT=3000
EOF

chmod 600 .env
cd ..
```

**生成强密钥：**
```bash
# 生成密码（32字符）
node -e "console.log(require('crypto').randomBytes(16).toString('hex'))"

# 生成JWT密钥（64字符）
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

### 3. 启动数据库

```bash
# 启动 PostgreSQL 和 Redis
docker-compose up -d

# 检查状态
docker ps

# 查看日志
docker-compose logs -f
```

### 4. 构建应用

```bash
cd backend

# 安装生产依赖
pnpm install --prod

# 构建
pnpm run build

# 验证构建
ls -la dist/
```

### 5. 使用PM2启动服务

```bash
# 启动服务
pm2 start dist/main.js --name "auth-service"

# 查看状态
pm2 status

# 查看日志
pm2 logs auth-service

# 设置开机自启
pm2 startup
pm2 save
```

### 6. 配置防火墙

```bash
# 开放必要端口
sudo ufw allow 3000/tcp  # 应用端口
sudo ufw allow 22/tcp    # SSH
sudo ufw enable
```

### 7. 配置Nginx反向代理（推荐）

#### 安装Nginx

```bash
sudo apt-get install nginx -y
```

#### 配置

```bash
sudo nano /etc/nginx/sites-available/auth-service
```

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

#### 启用配置

```bash
sudo ln -s /etc/nginx/sites-available/auth-service /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

### 8. 配置SSL证书（推荐）

使用 Let's Encrypt 免费SSL证书：

```bash
# 安装 Certbot
sudo apt-get install certbot python3-certbot-nginx -y

# 获取证书
sudo certbot --nginx -d auth.yourdomain.com

# 自动续期
sudo certbot renew --dry-run
```

### 9. 设置管理员用户

```bash
# Linux/Mac
./set-admin-docker.sh 用户名

# 或直接使用Docker命令
docker exec -i postgres_auth psql -U admin -d auth_system -c \
  "UPDATE users SET role = 'admin' WHERE username = '用户名';"
```

## 🔄 更新部署

```bash
# 1. 拉取最新代码
git pull

# 2. 安装依赖
cd backend
pnpm install --prod

# 3. 构建
pnpm run build

# 4. 重启服务
pm2 restart auth-service

# 5. 查看状态
pm2 status
pm2 logs auth-service
```

## 🗄️ 数据库管理

### 备份数据库

```bash
# 备份
docker exec postgres_auth pg_dump -U admin auth_system > backup_$(date +%Y%m%d).sql

# 自动备份脚本
cat > backup.sh << 'EOF'
#!/bin/bash
BACKUP_DIR="/path/to/backups"
mkdir -p $BACKUP_DIR
docker exec postgres_auth pg_dump -U admin auth_system > \
  $BACKUP_DIR/backup_$(date +%Y%m%d_%H%M%S).sql
# 删除30天前的备份
find $BACKUP_DIR -name "backup_*.sql" -mtime +30 -delete
EOF

chmod +x backup.sh

# 添加到crontab（每天凌晨2点备份）
# 0 2 * * * /path/to/backup.sh
```

### 恢复数据库

```bash
# 停止服务
pm2 stop auth-service

# 恢复数据库
cat backup.sql | docker exec -i postgres_auth psql -U admin -d auth_system

# 启动服务
pm2 start auth-service
```

### 数据库连接

```bash
# 进入PostgreSQL
docker exec -it postgres_auth psql -U admin -d auth_system

# 常用SQL
\dt              # 查看表
\d users         # 查看users表结构
SELECT * FROM users;  # 查看用户
```

## 📊 监控和日志

### PM2 监控

```bash
# 查看状态
pm2 status

# 查看日志
pm2 logs auth-service
pm2 logs auth-service --lines 100

# 实时监控
pm2 monit

# 重启
pm2 restart auth-service

# 停止
pm2 stop auth-service

# 删除
pm2 delete auth-service
```

### Docker 监控

```bash
# 查看容器状态
docker ps

# 查看日志
docker-compose logs -f postgres_auth
docker-compose logs -f redis_auth

# 重启容器
docker-compose restart postgres_auth
docker-compose restart redis_auth

# 查看资源使用
docker stats
```

### 系统监控

```bash
# 查看端口
netstat -tlnp | grep 3000

# 查看进程
ps aux | grep node

# 查看内存
free -h

# 查看磁盘
df -h
```

## 🛡️ 安全配置

### 1. 数据库安全

- ✅ 使用强密码
- ✅ 限制数据库只能从localhost访问
- ✅ 定期备份
- ✅ 定期更新PostgreSQL版本

### 2. Redis安全

- ✅ 设置密码
- ✅ 限制只能从localhost访问
- ✅ 禁用危险命令

修改 `docker-compose.yml` 添加：
```yaml
redis_auth:
  command: redis-server --requirepass ${REDIS_PASSWORD} --rename-command CONFIG ""
```

### 3. 应用安全

- ✅ 使用环境变量存储敏感信息
- ✅ 设置强JWT密钥
- ✅ 配置CORS限制
- ✅ 实现限流保护
- ✅ 启用HTTPS

### 4. 服务器安全

```bash
# 禁用root登录
sudo nano /etc/ssh/sshd_config
# PermitRootLogin no

# 配置防火墙
sudo ufw enable
sudo ufw default deny incoming
sudo ufw default allow outgoing
sudo ufw allow 22/tcp
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp

# 自动安全更新
sudo apt-get install unattended-upgrades -y
```

## 🔍 故障排查

### 服务无法启动

```bash
# 检查端口占用
netstat -tlnp | grep 3000

# 查看PM2日志
pm2 logs auth-service --lines 100

# 查看环境变量
cd backend && cat .env
```

### 数据库连接失败

```bash
# 检查容器状态
docker ps

# 检查数据库日志
docker-compose logs postgres_auth

# 测试连接
docker exec -it postgres_auth psql -U admin -d auth_system
```

### Redis连接失败

```bash
# 检查Redis状态
docker-compose logs redis_auth

# 测试连接
docker exec -it redis_auth redis-cli -a <password>
```

### 内存不足

```bash
# 增加PM2内存限制
pm2 start dist/main.js --name "auth-service" --max-memory-restart 500M

# 查看内存使用
pm2 monit
```

## 📈 性能优化

### 1. 数据库优化

```sql
-- 添加索引
CREATE INDEX idx_users_username ON users(username);
CREATE INDEX idx_users_email ON users(email);

-- 查看慢查询
SELECT * FROM pg_stat_statements ORDER BY total_time DESC LIMIT 10;
```

### 2. Redis优化

```bash
# 配置最大内存
docker-compose.yml 添加：
command: redis-server --maxmemory 256mb --maxmemory-policy allkeys-lru
```

### 3. 应用优化

- 启用gzip压缩
- 配置缓存头
- 使用连接池
- 实现请求缓存

## 📞 技术支持

如有问题，请查看：
- [README.md](./README.md) - 项目文档
- [backend/添加管理员说明.md](./backend/添加管理员说明.md) - 用户管理

## 📄 许可证

私有项目，未经授权不得使用。

