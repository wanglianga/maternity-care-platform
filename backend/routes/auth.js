const express = require('express');
const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');
const router = express.Router();
const { readData, writeData, DATA_FILES } = require('../data/initData');
const { generateToken, authenticateToken } = require('../middleware/auth');

router.post('/login', (req, res) => {
  const { username, password } = req.body;
  const users = readData(DATA_FILES.users);
  const user = users.find(u => u.username === username);

  if (!user) {
    return res.status(401).json({ error: '用户名或密码错误' });
  }

  if (!bcrypt.compareSync(password, user.password)) {
    return res.status(401).json({ error: '用户名或密码错误' });
  }

  const token = generateToken(user);
  res.json({
    token,
    user: {
      id: user.id,
      username: user.username,
      name: user.name,
      role: user.role,
      phone: user.phone
    }
  });
});

router.post('/register', (req, res) => {
  const { username, password, name, role, phone } = req.body;
  const users = readData(DATA_FILES.users);

  if (users.find(u => u.username === username)) {
    return res.status(400).json({ error: '用户名已存在' });
  }

  const newUser = {
    id: uuidv4(),
    username,
    password: bcrypt.hashSync(password, 10),
    name,
    role,
    phone,
    createdAt: new Date().toISOString()
  };

  users.push(newUser);
  writeData(DATA_FILES.users, users);

  const token = generateToken(newUser);
  res.json({
    token,
    user: {
      id: newUser.id,
      username: newUser.username,
      name: newUser.name,
      role: newUser.role,
      phone: newUser.phone
    }
  });
});

router.get('/me', authenticateToken, (req, res) => {
  const users = readData(DATA_FILES.users);
  const user = users.find(u => u.id === req.user.id);
  if (!user) {
    return res.status(404).json({ error: '用户不存在' });
  }
  res.json({
    id: user.id,
    username: user.username,
    name: user.name,
    role: user.role,
    phone: user.phone,
    motherIds: user.motherIds || []
  });
});

module.exports = router;
