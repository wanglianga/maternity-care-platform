const express = require('express');
const { v4: uuidv4 } = require('uuid');
const router = express.Router();
const { readData, writeData, DATA_FILES } = require('../data/initData');
const { checkRole, ROLES } = require('../middleware/auth');

router.get('/', (req, res) => {
  const fees = readData(DATA_FILES.fees);
  const { motherId, type, status } = req.query;
  let filtered = fees;
  if (motherId) filtered = filtered.filter(f => f.motherId === motherId);
  if (type) filtered = filtered.filter(f => f.type === type);
  if (status) filtered = filtered.filter(f => f.status === status);
  
  if (req.user.role === ROLES.FAMILY) {
    const users = readData(DATA_FILES.users);
    const user = users.find(u => u.id === req.user.id);
    const motherIds = user?.motherIds || [];
    filtered = filtered.filter(f => motherIds.includes(f.motherId));
  }
  
  res.json(filtered);
});

router.get('/:id', (req, res) => {
  const fees = readData(DATA_FILES.fees);
  const fee = fees.find(f => f.id === req.params.id);
  if (!fee) {
    return res.status(404).json({ error: '费用记录不存在' });
  }
  res.json(fee);
});

router.post('/', checkRole([ROLES.ADMIN, ROLES.SALES]), (req, res) => {
  const fees = readData(DATA_FILES.fees);
  const newFee = {
    id: uuidv4(),
    ...req.body,
    status: req.body.status || 'pending',
    createdBy: req.user.id,
    createdAt: new Date().toISOString()
  };
  fees.push(newFee);
  writeData(DATA_FILES.fees, fees);
  res.status(201).json(newFee);
});

router.put('/:id', checkRole([ROLES.ADMIN, ROLES.SALES]), (req, res) => {
  const fees = readData(DATA_FILES.fees);
  const idx = fees.findIndex(f => f.id === req.params.id);
  if (idx === -1) {
    return res.status(404).json({ error: '费用记录不存在' });
  }
  fees[idx] = { ...fees[idx], ...req.body, id: fees[idx].id, updatedAt: new Date().toISOString() };
  writeData(DATA_FILES.fees, fees);
  res.json(fees[idx]);
});

router.post('/:id/pay', checkRole([ROLES.ADMIN, ROLES.SALES]), (req, res) => {
  const fees = readData(DATA_FILES.fees);
  const idx = fees.findIndex(f => f.id === req.params.id);
  if (idx === -1) {
    return res.status(404).json({ error: '费用记录不存在' });
  }
  fees[idx].status = 'paid';
  fees[idx].paidAt = new Date().toISOString();
  fees[idx].paidBy = req.user.id;
  fees[idx].paymentMethod = req.body.paymentMethod || 'cash';
  writeData(DATA_FILES.fees, fees);
  res.json(fees[idx]);
});

router.delete('/:id', checkRole([ROLES.ADMIN]), (req, res) => {
  let fees = readData(DATA_FILES.fees);
  fees = fees.filter(f => f.id !== req.params.id);
  writeData(DATA_FILES.fees, fees);
  res.json({ message: '删除成功' });
});

module.exports = router;
