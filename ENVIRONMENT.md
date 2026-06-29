# 环境变量配置指南

## 配置说明

本项目使用 `.env` 文件（位于项目根目录），应用启动时自动读取。

## 完整配置

```env
# JWT 密钥（必须修改，64位随机字符）
JWT_SECRET=<64位随机密钥>
JWT_EXPIRES_IN=7d

# 服务端口
PORT=3000
NODE_ENV=development

# CORS（开发时前端地址，多个用逗号分隔）
CORS_ORIGIN=http://localhost:5173
```

## 生产环境

```env
NODE_ENV=production
CORS_ORIGIN=https://你的域名.com
```

## 生成密钥

```bash
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

## 安全建议

1. **永远不要提交 .env 文件到 Git**
2. **JWT_SECRET 至少 64 字符**
3. **生产环境必须设置 NODE_ENV=production**
