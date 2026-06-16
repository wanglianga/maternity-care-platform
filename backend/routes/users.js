const express = require('express');
const { v4: uuidv4 } = require('uuid');
const router = express.Router();
const { readData, writeData, DATA_FILES } = require('../data/initData');
const { checkRole, ROLES } = require('../middleware/auth');

router.get('/', checkRole([ROLES.ADMIN, ROLES.SALES, ROLES.HEAD_NURSE, ROLES.RECEPTION]), (req, res) => {
  const users = readData(DATA_FILES.users);
  const { role } = req.query;
  let filtered = users;
  if (role) {
    filtered = users.filter(u => u.role === role);
  }
  res.json(filtered.map(u => ({
    id: u.id,
    username: u.username,
    name: u.name,
    role: u.role,
    phone: u.phone,
    createdAt: u.createdAt
  })));
});

router.get('/:id', (req, res) => {
  const users = readData(DATA_FILES.users);
  const user = users.find(u => u.id === req.params.id);
  if (!user) {
    return res.status(404).json({ error: '用户不存在' });
  }
  res.json({
    id: user.id,
    username: user.username,
    name: user.name,
    role: user.role,
    phone: user.phone,
    createdAt: user.createdAt,
    motherIds: user.motherIds || []
  });
});

router.post('/', checkRole([ROLES.ADMIN]), (req, res) => {
  const users = readData(DATA_FILES.users);
  const { username, password, name, role, phone } = req.body;
  
  if (users.find(u => u.username === username)) {
    return res.status(400).json({ error: '用户名已存在' });
  }

  const bcrypt = require('bcryptjs');
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
  res.status(201).json(newUser);
});

router.put('/:id', checkRole([ROLES.ADMIN]), (req, res) => {
  const users = readData(DATA_FILES.users);
  const idx = users.findIndex(u => u.id === req.params.id);
  if (idx === -1) {
    return res.status(404).json({ error: '用户不存在' });
  }
  users[idx] = { ...users[idx], ...req.body, id: users[idx].id, password: users[idx].password };
  writeData(DATA_FILES.users, users);
  res.json(users[idx]);
});

router.delete('/:id', checkRole([ROLES.ADMIN]), (req, res) => {
  let users = readData(DATA_FILES.users);
  users = users.filter(u => u.id !== req.params.id);
  writeData(DATA_FILES.users, users);
  res.json({ message: '删除成功' });
});

module.exports = router;
