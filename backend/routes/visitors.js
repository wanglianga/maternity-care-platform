const express = require('express');
const { v4: uuidv4 } = require('uuid');
const router = express.Router();
const { readData, writeData, DATA_FILES } = require('../data/initData');
const { checkRole, ROLES } = require('../middleware/auth');

router.get('/', (req, res) => {
  const visitors = readData(DATA_FILES.visitors);
  const { motherId, status, date } = req.query;
  let filtered = visitors;
  if (motherId) filtered = filtered.filter(v => v.motherId === motherId);
  if (status) filtered = filtered.filter(v => v.status === status);
  if (date) filtered = filtered.filter(v => v.visitDate === date);
  
  if (req.user.role === ROLES.FAMILY) {
    const users = readData(DATA_FILES.users);
    const user = users.find(u => u.id === req.user.id);
    const motherIds = user?.motherIds || [];
    filtered = filtered.filter(v => motherIds.includes(v.motherId));
  }
  
  res.json(filtered);
});

router.get('/:id', (req, res) => {
  const visitors = readData(DATA_FILES.visitors);
  const visitor = visitors.find(v => v.id === req.params.id);
  if (!visitor) {
    return res.status(404).json({ error: '访客记录不存在' });
  }
  res.json(visitor);
});

router.post('/', checkRole([ROLES.ADMIN, ROLES.RECEPTION, ROLES.FAMILY]), (req, res) => {
  const visitors = readData(DATA_FILES.visitors);
  const newVisitor = {
    id: uuidv4(),
    ...req.body,
    status: req.body.status || 'pending',
    createdBy: req.user.id,
    createdAt: new Date().toISOString()
  };
  visitors.push(newVisitor);
  writeData(DATA_FILES.visitors, visitors);
  res.status(201).json(newVisitor);
});

router.put('/:id', checkRole([ROLES.ADMIN, ROLES.RECEPTION]), (req, res) => {
  const visitors = readData(DATA_FILES.visitors);
  const idx = visitors.findIndex(v => v.id === req.params.id);
  if (idx === -1) {
    return res.status(404).json({ error: '访客记录不存在' });
  }
  visitors[idx] = { ...visitors[idx], ...req.body, id: visitors[idx].id };
  writeData(DATA_FILES.visitors, visitors);
  res.json(visitors[idx]);
});

router.post('/:id/checkin', checkRole([ROLES.ADMIN, ROLES.RECEPTION]), (req, res) => {
  const visitors = readData(DATA_FILES.visitors);
  const idx = visitors.findIndex(v => v.id === req.params.id);
  if (idx === -1) {
    return res.status(404).json({ error: '访客记录不存在' });
  }
  visitors[idx].status = 'checked_in';
  visitors[idx].actualCheckIn = new Date().toISOString();
  visitors[idx].checkedInBy = req.user.id;
  visitors[idx].disinfectionDone = req.body.disinfectionDone || true;
  writeData(DATA_FILES.visitors, visitors);
  res.json(visitors[idx]);
});

router.post('/:id/checkout', checkRole([ROLES.ADMIN, ROLES.RECEPTION]), (req, res) => {
  const visitors = readData(DATA_FILES.visitors);
  const idx = visitors.findIndex(v => v.id === req.params.id);
  if (idx === -1) {
    return res.status(404).json({ error: '访客记录不存在' });
  }
  visitors[idx].status = 'checked_out';
  visitors[idx].actualCheckOut = new Date().toISOString();
  visitors[idx].checkedOutBy = req.user.id;
  writeData(DATA_FILES.visitors, visitors);
  res.json(visitors[idx]);
});

router.delete('/:id', checkRole([ROLES.ADMIN, ROLES.RECEPTION]), (req, res) => {
  let visitors = readData(DATA_FILES.visitors);
  visitors = visitors.filter(v => v.id !== req.params.id);
  writeData(DATA_FILES.visitors, visitors);
  res.json({ message: '删除成功' });
});

module.exports = router;
