/**
 * 设置管理员脚本
 * 用于将普通用户提升为管理员（admin或super_admin）
 * 
 * 使用方法：
 * node set-admin.js <admin_username> <admin_password> <target_username> [role]
 * 
 * 参数说明：
 * - admin_username: 已有管理员账号的用户名（用于认证）
 * - admin_password: 管理员账号的密码
 * - target_username: 要设置为管理员的用户名
 * - role: 角色类型，可选值: admin 或 super_admin（默认为 admin）
 * 
 * 示例：
 * node set-admin.js admin 123456 testuser admin
 * node set-admin.js admin 123456 testuser super_admin
 * 
 * 注意：如果没有管理员账号，请先通过数据库直接设置一个管理员
 */

const http = require('http');

const AUTH_SERVICE_URL = process.env.AUTH_SERVICE_URL || 'http://localhost:3000/api';

// 首先需要登录获取token
async function login(username, password) {
  return new Promise((resolve, reject) => {
    const url = new URL(`${AUTH_SERVICE_URL}/auth/login`);
    
    const postData = JSON.stringify({
      username,
      password,
    });

    const options = {
      hostname: url.hostname,
      port: url.port || (url.protocol === 'https:' ? 443 : 80),
      path: url.pathname,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData),
      },
    };

    const req = http.request(options, (res) => {
      let data = '';

      res.on('data', (chunk) => {
        data += chunk;
      });

      res.on('end', () => {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          try {
            const result = JSON.parse(data);
            resolve(result.access_token);
          } catch (e) {
            reject(new Error('无法解析登录响应'));
          }
        } else {
          try {
            const error = JSON.parse(data);
            reject(new Error(error.message || `登录失败: HTTP ${res.statusCode}`));
          } catch (e) {
            reject(new Error(`登录失败: HTTP ${res.statusCode}: ${data}`));
          }
        }
      });
    });

    req.on('error', (error) => {
      reject(error);
    });

    req.write(postData);
    req.end();
  });
}

// 获取所有用户
async function getAllUsers(token) {
  return new Promise((resolve, reject) => {
    const url = new URL(`${AUTH_SERVICE_URL}/users`);

    const options = {
      hostname: url.hostname,
      port: url.port || (url.protocol === 'https:' ? 443 : 80),
      path: url.pathname,
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    };

    const req = http.request(options, (res) => {
      let data = '';

      res.on('data', (chunk) => {
        data += chunk;
      });

      res.on('end', () => {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          try {
            const result = JSON.parse(data);
            resolve(result);
          } catch (e) {
            reject(new Error('无法解析用户列表响应'));
          }
        } else {
          try {
            const error = JSON.parse(data);
            reject(new Error(error.message || `获取用户列表失败: HTTP ${res.statusCode}`));
          } catch (e) {
            reject(new Error(`获取用户列表失败: HTTP ${res.statusCode}: ${data}`));
          }
        }
      });
    });

    req.on('error', (error) => {
      reject(error);
    });

    req.end();
  });
}

// 更新用户角色
async function updateUserRole(token, userId, role) {
  return new Promise((resolve, reject) => {
    const url = new URL(`${AUTH_SERVICE_URL}/users/${userId}`);

    const postData = JSON.stringify({
      role: role,
    });

    const options = {
      hostname: url.hostname,
      port: url.port || (url.protocol === 'https:' ? 443 : 80),
      path: url.pathname,
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData),
        'Authorization': `Bearer ${token}`,
      },
    };

    const req = http.request(options, (res) => {
      let data = '';

      res.on('data', (chunk) => {
        data += chunk;
      });

      res.on('end', () => {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          try {
            const result = JSON.parse(data);
            resolve(result);
          } catch (e) {
            reject(new Error('无法解析更新响应'));
          }
        } else {
          try {
            const error = JSON.parse(data);
            reject(new Error(error.message || `更新用户失败: HTTP ${res.statusCode}`));
          } catch (e) {
            reject(new Error(`更新用户失败: HTTP ${res.statusCode}: ${data}`));
          }
        }
      });
    });

    req.on('error', (error) => {
      reject(error);
    });

    req.write(postData);
    req.end();
  });
}

async function main() {
  const args = process.argv.slice(2);

  if (args.length < 3) {
    console.log('使用方法: node set-admin.js <admin_username> <admin_password> <target_username> [role]');
    console.log('');
    console.log('参数说明:');
    console.log('  admin_username: 已有管理员账号的用户名（用于认证）');
    console.log('  admin_password: 管理员账号的密码');
    console.log('  target_username: 要设置为管理员的用户名');
    console.log('  role: 角色类型，可选值: admin 或 super_admin（默认为 admin）');
    console.log('');
    console.log('示例:');
    console.log('  node set-admin.js admin 123456 testuser admin');
    console.log('  node set-admin.js admin 123456 testuser super_admin');
    process.exit(1);
  }

  const [adminUsername, adminPassword, targetUsername, role = 'admin'] = args;

  // 验证角色
  if (role !== 'admin' && role !== 'super_admin') {
    console.error('❌ 角色必须是 admin 或 super_admin');
    process.exit(1);
  }

  try {
    console.log('🔐 正在登录管理员账号...');
    const token = await login(adminUsername, adminPassword);
    console.log('✅ 登录成功');

    console.log('📋 正在获取用户列表...');
    const users = await getAllUsers(token);
    console.log(`✅ 找到 ${users.length} 个用户`);

    // 查找目标用户
    const targetUser = users.find(u => u.username === targetUsername);
    if (!targetUser) {
      console.error(`❌ 用户 "${targetUsername}" 不存在`);
      console.log('\n可用用户列表:');
      users.forEach(u => {
        console.log(`  - ${u.username} (ID: ${u.id}, 角色: ${u.role})`);
      });
      process.exit(1);
    }

    if (targetUser.role === role) {
      console.log(`ℹ️  用户 "${targetUsername}" 已经是 ${role} 角色`);
      process.exit(0);
    }

    console.log(`📝 正在将用户 "${targetUsername}" (ID: ${targetUser.id}) 的角色从 "${targetUser.role}" 更新为 "${role}"...`);
    const updatedUser = await updateUserRole(token, targetUser.id, role);
    
    console.log('✅ 用户角色更新成功！');
    console.log('📋 更新后的用户信息:');
    console.log(JSON.stringify(updatedUser, null, 2));
  } catch (error) {
    console.error('❌ 操作失败:');
    console.error(`   错误: ${error.message}`);
    console.error('');
    console.error('请检查:');
    console.error('  1. 认证服务是否正在运行');
    console.error('  2. 服务地址是否正确:', AUTH_SERVICE_URL);
    console.error('  3. 管理员账号和密码是否正确');
    console.error('  4. 目标用户名是否存在');
    process.exit(1);
  }
}

main();

