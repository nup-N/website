/**
 * 创建用户脚本
 * 用于快速创建普通用户（user角色）
 * 
 * 使用方法：
 * node create-user.js <username> <email> <password>
 * 
 * 示例：
 * node create-user.js testuser testuser@example.com 123456
 */

const http = require('http');

const AUTH_SERVICE_URL = process.env.AUTH_SERVICE_URL || 'http://localhost:3000/api';

function createUser(username, email, password) {
  return new Promise((resolve, reject) => {
    const url = new URL(`${AUTH_SERVICE_URL}/users/register`);
    
    const postData = JSON.stringify({
      username,
      email,
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
            resolve(result);
          } catch (e) {
            reject(new Error('无法解析响应数据'));
          }
        } else {
          try {
            const error = JSON.parse(data);
            reject(new Error(error.message || `HTTP ${res.statusCode}: ${data}`));
          } catch (e) {
            reject(new Error(`HTTP ${res.statusCode}: ${data}`));
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
  // 从命令行参数获取用户信息
  const args = process.argv.slice(2);

  if (args.length < 3) {
    console.log('使用方法: node create-user.js <username> <email> <password>');
    console.log('');
    console.log('示例:');
    console.log('  node create-user.js testuser testuser@example.com 123456');
    process.exit(1);
  }

  const [username, email, password] = args;

  // 验证参数
  if (username.length < 3 || username.length > 20) {
    console.error('❌ 用户名长度必须在3到20个字符之间');
    process.exit(1);
  }

  if (password.length < 6 || password.length > 20) {
    console.error('❌ 密码长度必须在6到20个字符之间');
    process.exit(1);
  }

  try {
    console.log('📝 正在创建用户...');
    console.log(`   用户名: ${username}`);
    console.log(`   邮箱: ${email}`);
    console.log(`   角色: user (默认)`);
    console.log(`   服务地址: ${AUTH_SERVICE_URL}`);
    console.log('');

    const result = await createUser(username, email, password);

    console.log('✅ 用户创建成功！');
    console.log('📋 用户信息:');
    console.log(JSON.stringify(result, null, 2));
  } catch (error) {
    console.error('❌ 创建用户失败:');
    console.error(`   错误: ${error.message}`);
    console.error('');
    console.error('请检查:');
    console.error('  1. 认证服务是否正在运行');
    console.error('  2. 服务地址是否正确:', AUTH_SERVICE_URL);
    console.error('  3. 用户名和邮箱是否已被使用');
    process.exit(1);
  }
}

main();

