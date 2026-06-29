const { Router } = require('express');
const bcrypt = require('bcrypt');
const rateLimit = require('express-rate-limit');
const db = require('./db');
const auth = require('./auth');

const router = Router();
const loginLimiter = rateLimit({ windowMs: 60000, max: 5, message: { message: '登录请求过于频繁，请稍后再试' } });

function setCookie(res, token) {
  const secure = process.env.NODE_ENV === 'production';
  const maxAge = (auth.getTokenTtlSeconds(token) ?? 86400) * 1000;
  res.cookie('access_token', token, { httpOnly: true, secure, sameSite: 'lax', path: '/', maxAge });
}

// POST /api/auth/register
router.post('/auth/register', (req, res) => {
  try {
    const { username, email, password } = req.body;
    if (!username || !email || !password) return res.status(400).json({ message: '用户名、邮箱和密码不能为空' });
    if (username.length < 3 || username.length > 20) return res.status(400).json({ message: '用户名长度需为 3-20 个字符' });
    if (db.getByUsername(username)) return res.status(409).json({ message: '用户名已存在' });

    const user = db.createUser({ username, email, password });
    const token = auth.signToken(user);
    setCookie(res, token);
    res.status(201).json({ access_token: token, user: { id: user.id, username: user.username, role: user.role } });
  } catch (err) {
    if (err?.code === 'SQLITE_CONSTRAINT_UNIQUE') return res.status(409).json({ message: '用户名或邮箱已被注册' });
    console.error('Register error:', err);
    res.status(500).json({ message: '注册失败' });
  }
});

// POST /api/auth/login
router.post('/auth/login', loginLimiter, (req, res) => {
  try {
    const { username, password } = req.body;
    if (!username || !password) return res.status(400).json({ message: '用户名和密码不能为空' });

    const user = db.getByUsername(username);
    if (!user || !bcrypt.compareSync(password, user.password)) return res.status(401).json({ message: '用户名或密码不正确' });

    const token = auth.signToken(user);
    setCookie(res, token);
    res.json({ access_token: token, user: { id: user.id, username: user.username, role: user.role } });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ message: '登录失败' });
  }
});

// POST /api/auth/logout
router.post('/auth/logout', auth.requireAuth, (req, res) => {
  db.incrementTokenVersion(req.user.id);
  res.clearCookie('access_token', { path: '/', httpOnly: true, sameSite: 'lax' });
  res.json({ message: '已成功登出' });
});

// GET /api/auth/profile
router.get('/auth/profile', auth.requireAuth, (req, res) => {
  res.json({ id: req.user.id, username: req.user.username, role: req.user.role });
});

// POST /api/auth/validate
router.post('/auth/validate', (req, res) => {
  const token = auth.extractToken(req);
  if (!token) return res.json({ valid: false, message: '未提供有效的认证令牌' });
  try {
    const payload = auth.verifyToken(token);
    const user = db.getById(payload.sub);
    if (!user || user.token_version !== payload.tv) return res.json({ valid: false, message: 'Token 已失效' });
    res.json({ valid: true, user: { id: user.id, username: user.username, role: user.role } });
  } catch {
    res.json({ valid: false, message: 'Token 无效或已过期' });
  }
});

// GET /api/users
router.get('/users', auth.requireAuth, auth.requireRole('admin', 'super_admin'), (req, res) => {
  res.json(db.getAllUsers());
});

// GET /api/users/:id
router.get('/users/:id', auth.requireAuth, auth.requireRole('admin', 'super_admin'), (req, res) => {
  const user = db.getById(Number(req.params.id));
  if (!user) return res.status(404).json({ message: '用户不存在' });
  res.json(user);
});

// PATCH /api/users/:id
router.patch('/users/:id', auth.requireAuth, auth.requireRole('admin', 'super_admin'), (req, res) => {
  const targetId = Number(req.params.id);
  const actor = req.user;
  const target = db.getById(targetId);
  if (!target) return res.status(404).json({ message: '用户不存在' });

  if (targetId === actor.id && req.body.role !== undefined) {
    return res.status(403).json({ message: '不能修改自己的角色' });
  }

  const updateData = {};
  if (req.body.role !== undefined) {
    const actorLvl = auth.ROLE_HIERARCHY[actor.role];
    const targetLvl = auth.ROLE_HIERARCHY[target.role];
    const newLvl = auth.ROLE_HIERARCHY[req.body.role];

    if (newLvl > actorLvl) return res.status(403).json({ message: '不能设置高于自己等级的角色' });
    if (actor.role !== 'super_admin') {
      if (targetLvl >= auth.ROLE_HIERARCHY.admin) return res.status(403).json({ message: '不能调整管理员及以上角色' });
      if (newLvl >= auth.ROLE_HIERARCHY.admin) return res.status(403).json({ message: '只能设置为访客/用户/高级用户' });
      if (targetLvl >= actorLvl) return res.status(403).json({ message: '不能修改同级或更高级别用户的角色' });
    }
    updateData.role = req.body.role;
  }
  if (req.body.username !== undefined) updateData.username = req.body.username;
  if (req.body.email !== undefined) updateData.email = req.body.email;
  if (req.body.password !== undefined) updateData.password = req.body.password;

  res.json(db.updateUser(targetId, updateData));
});

// DELETE /api/users/:id
router.delete('/users/:id', auth.requireAuth, auth.requireRole('super_admin'), (req, res) => {
  const targetId = Number(req.params.id);
  if (!db.getById(targetId)) return res.status(404).json({ message: '用户不存在' });
  db.deleteUser(targetId);
  res.json({ message: '用户已删除' });
});

module.exports = router;
