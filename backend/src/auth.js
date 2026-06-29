const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) {
  console.error('FATAL: JWT_SECRET environment variable is required');
  process.exit(1);
}
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';

const ROLE_HIERARCHY = { guest: 0, user: 1, premium: 2, admin: 3, super_admin: 4 };

function signToken(user) {
  return jwt.sign(
    { sub: user.id, username: user.username, role: user.role, tv: user.token_version },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRES_IN }
  );
}

function verifyToken(token) {
  return jwt.verify(token, JWT_SECRET);
}

function extractToken(req) {
  const auth = req.headers.authorization;
  if (auth && auth.startsWith('Bearer ')) return auth.slice(7);
  return req.cookies?.access_token || null;
}

function getTokenTtlSeconds(token) {
  try {
    const decoded = jwt.decode(token);
    if (!decoded?.exp) return null;
    return Math.max(0, decoded.exp - Math.floor(Date.now() / 1000));
  } catch { return null; }
}

function requireAuth(req, res, next) {
  const token = extractToken(req);
  if (!token) return res.status(401).json({ message: '未提供认证令牌' });

  try {
    const payload = verifyToken(token);
    const user = require('./db').getById(payload.sub);
    if (!user) return res.status(401).json({ message: '用户不存在' });
    if (user.token_version !== payload.tv) return res.status(401).json({ message: 'Token 已失效，请重新登录' });

    req.user = { id: user.id, username: user.username, role: user.role };
    req.tokenPayload = payload;
    next();
  } catch (err) {
    const msg = err.name === 'TokenExpiredError' ? 'Token 已过期，请重新登录' : 'Token 无效';
    return res.status(401).json({ message: msg });
  }
}

function requireRole(...roles) {
  return (req, res, next) => {
    if (!req.user) return res.status(401).json({ message: '未认证' });
    const levels = roles.map(r => ROLE_HIERARCHY[r] ?? -1);
    if ((ROLE_HIERARCHY[req.user.role] ?? -1) < Math.min(...levels)) {
      return res.status(403).json({ message: '权限不足' });
    }
    next();
  };
}

module.exports = { signToken, verifyToken, extractToken, getTokenTtlSeconds, requireAuth, requireRole, ROLE_HIERARCHY };
