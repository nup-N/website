# 通过 Docker 设置管理员用户

## 方法1：使用脚本（推荐）

### Windows 系统：

```bash
cd website
set-admin-docker.bat admin
```

或设置为超级管理员：
```bash
set-admin-docker.bat super_admin
```

### Linux/Mac 系统：

```bash
cd website
chmod +x set-admin-docker.sh
./set-admin-docker.sh admin
```

或设置为超级管理员：
```bash
./set-admin-docker.sh super_admin
```

---

## 方法2：直接执行 Docker 命令

### Windows PowerShell：

```powershell
# 设置为 admin
docker exec -i postgres_auth psql -U admin -d auth_system -c "UPDATE users SET role = 'admin' WHERE username = 'admin';"

# 验证
docker exec -i postgres_auth psql -U admin -d auth_system -c "SELECT id, username, email, role FROM users WHERE username = 'admin';"
```

### Linux/Mac：

```bash
# 设置为 admin
docker exec -i postgres_auth psql -U admin -d auth_system -c "UPDATE users SET role = 'admin' WHERE username = 'admin';"

# 验证
docker exec -i postgres_auth psql -U admin -d auth_system -c "SELECT id, username, email, role FROM users WHERE username = 'admin';"
```

---

## 方法3：进入容器执行 SQL

### 步骤：

1. **进入 PostgreSQL 容器**
   ```bash
   docker exec -it postgres_auth psql -U admin -d auth_system
   ```

2. **执行 SQL 语句**
   ```sql
   UPDATE users 
   SET role = 'admin' 
   WHERE username = 'admin';
   ```

3. **验证**
   ```sql
   SELECT id, username, email, role 
   FROM users 
   WHERE username = 'admin';
   ```

4. **退出**
   ```sql
   \q
   ```

---

## 方法4：使用 SQL 文件

1. **创建 SQL 文件**（已创建 `set-admin.sql`）

2. **执行 SQL 文件**
   ```bash
   docker exec -i postgres_auth psql -U admin -d auth_system < backend/set-admin.sql
   ```

---

## 数据库连接信息

根据 `docker-compose.yml` 配置：
- **容器名**: `postgres_auth`
- **数据库名**: `auth_system`
- **用户名**: `admin`
- **密码**: `admin123`
- **端口**: `5432`

---

## 验证设置是否成功

执行以下命令验证：

```bash
docker exec -i postgres_auth psql -U admin -d auth_system -c "SELECT id, username, email, role FROM users WHERE username = 'admin';"
```

应该看到 `role` 字段显示为 `admin` 或 `super_admin`。

---

## 常见问题

### Q: 容器未运行怎么办？
```bash
# 检查容器状态
docker ps -a | grep postgres_auth

# 如果容器未运行，启动它
cd website
docker-compose up -d postgres_auth
```

### Q: 如何查看所有用户？
```bash
docker exec -i postgres_auth psql -U admin -d auth_system -c "SELECT id, username, email, role FROM users ORDER BY id;"
```

### Q: 如何撤销管理员权限？
```bash
docker exec -i postgres_auth psql -U admin -d auth_system -c "UPDATE users SET role = 'user' WHERE username = 'admin';"
```

