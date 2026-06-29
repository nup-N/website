const { body, validationResult } = require('express-validator');

const VALID_ROLES = ['guest', 'user', 'premium', 'admin', 'super_admin'];

function handleValidationErrors(req, res, next) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const messages = errors.array().map(e => e.msg).join('; ');
    return res.status(400).json({ message: messages });
  }
  next();
}

const register = [
  body('username').trim().isLength({ min: 3, max: 20 }).withMessage('用户名长度需为 3-20 个字符'),
  body('email').trim().isEmail().normalizeEmail().withMessage('邮箱格式不正确'),
  body('password').isLength({ min: 1 }).withMessage('密码不能为空'),
  handleValidationErrors
];

const login = [
  body('username').trim().notEmpty().withMessage('用户名不能为空'),
  body('password').notEmpty().withMessage('密码不能为空'),
  handleValidationErrors
];

const updateUser = [
  body('username').optional().trim().isLength({ min: 3, max: 20 }).withMessage('用户名长度需为 3-20 个字符'),
  body('email').optional().trim().isEmail().normalizeEmail().withMessage('邮箱格式不正确'),
  body('role').optional().isIn(VALID_ROLES).withMessage('角色不合法'),
  body('password').optional().isLength({ min: 1 }).withMessage('密码不能为空'),
  handleValidationErrors
];

module.exports = { register, login, updateUser };
