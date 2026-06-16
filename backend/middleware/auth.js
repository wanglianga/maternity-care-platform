const jwt = require('jsonwebtoken');
const SECRET_KEY = 'maternity-care-platform-secret-key-2024';

const ROLES = {
  SALES: 'sales',
  HEAD_NURSE: 'head_nurse',
  NURSE: 'nurse',
  NUTRITIONIST: 'nutritionist',
  RECEPTION: 'reception',
  FAMILY: 'family',
  ADMIN: 'admin'
};

const ROLE_NAMES = {
  sales: '销售',
  head_nurse: '护士长',
  nurse: '月嫂',
  nutritionist: '营养师',
  reception: '前台',
  family: '家属',
  admin: '管理员'
};

const generateToken = (user) => {
  return jwt.sign(
    {
      id: user.id,
      username: user.username,
      role: user.role,
      name: user.name
    },
    SECRET_KEY,
    { expiresIn: '24h' }
  );
};

const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: '未授权访问，请先登录' });
  }

  jwt.verify(token, SECRET_KEY, (err, user) => {
    if (err) {
      return res.status(403).json({ error: 'Token无效或已过期' });
    }
    req.user = user;
    next();
  });
};

const checkRole = (allowedRoles) => {
  return (req, res, next) => {
    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ error: '权限不足，无法执行此操作' });
    }
    next();
  };
};

module.exports = {
  SECRET_KEY,
  ROLES,
  ROLE_NAMES,
  generateToken,
  authenticateToken,
  checkRole
};
