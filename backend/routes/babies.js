const express = require('express');
const { v4: uuidv4 } = require('uuid');
const router = express.Router();
const { readData, writeData, DATA_FILES } = require('../data/initData');
const { checkRole, ROLES } = require('../middleware/auth');

router.get('/', (req, res) => {
  const babies = readData(DATA_FILES.babies);
  const { motherId } = req.query;
  let filtered = babies;
  if (motherId) filtered = babies.filter(b => b.motherId === motherId);
  
  if (req.user.role === ROLES.FAMILY) {
    const users = readData(DATA_FILES.users);
    const user = users.find(u => u.id === req.user.id);
    const motherIds = user?.motherIds || [];
    filtered = filtered.filter(b => motherIds.includes(b.motherId));
  }
  
  res.json(filtered);
});

router.get('/:id', (req, res) => {
  const babies = readData(DATA_FILES.babies);
  const baby = babies.find(b => b.id === req.params.id);
  if (!baby) {
    return res.status(404).json({ error: '宝宝记录不存在' });
  }
  
  if (req.user.role === ROLES.FAMILY) {
    const users = readData(DATA_FILES.users);
    const user = users.find(u => u.id === req.user.id);
    const motherIds = user?.motherIds || [];
    if (!motherIds.includes(baby.motherId)) {
      return res.status(403).json({ error: '无权查看此记录' });
    }
  }
  
  res.json(baby);
});

router.post('/', checkRole([ROLES.ADMIN, ROLES.HEAD_NURSE, ROLES.NURSE]), (req, res) => {
  const babies = readData(DATA_FILES.babies);
  const newBaby = {
    id: uuidv4(),
    ...req.body,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
  babies.push(newBaby);
  writeData(DATA_FILES.babies, babies);
  res.status(201).json(newBaby);
});

router.put('/:id', checkRole([ROLES.ADMIN, ROLES.HEAD_NURSE, ROLES.NURSE]), (req, res) => {
  const babies = readData(DATA_FILES.babies);
  const idx = babies.findIndex(b => b.id === req.params.id);
  if (idx === -1) {
    return res.status(404).json({ error: '宝宝记录不存在' });
  }
  babies[idx] = { ...babies[idx], ...req.body, id: babies[idx].id, updatedAt: new Date().toISOString() };
  writeData(DATA_FILES.babies, babies);
  res.json(babies[idx]);
});

router.delete('/:id', checkRole([ROLES.ADMIN]), (req, res) => {
  let babies = readData(DATA_FILES.babies);
  babies = babies.filter(b => b.id !== req.params.id);
  writeData(DATA_FILES.babies, babies);
  res.json({ message: '删除成功' });
});

module.exports = router;
