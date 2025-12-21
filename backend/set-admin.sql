-- 设置管理员用户脚本
-- 使用方法：直接在数据库中执行此 SQL 语句

-- 方法1：将指定用户名的用户设置为 admin
UPDATE users 
SET role = 'admin' 
WHERE username = 'testuser';

-- 方法2：将指定用户名的用户设置为 super_admin
-- UPDATE users 
-- SET role = 'super_admin' 
-- WHERE username = 'testuser';

-- 方法3：将指定用户ID的用户设置为 admin
-- UPDATE users 
-- SET role = 'admin' 
-- WHERE id = 1;

-- 方法4：查看所有用户及其角色
-- SELECT id, username, email, role, created_at 
-- FROM users 
-- ORDER BY id;

-- 方法5：查看指定用户的角色
-- SELECT id, username, email, role 
-- FROM users 
-- WHERE username = 'testuser';

