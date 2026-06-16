const express = require('express');
const { v4: uuidv4 } = require('uuid');
const router = express.Router();
const { readData, writeData, DATA_FILES } = require('../data/initData');
const { checkRole, ROLES } = require('../middleware/auth');

router.get('/', (req, res) => {
  const handovers = readData(DATA_FILES.handovers);
  const { motherId, type, status } = req.query;
  let filtered = handovers;
  if (motherId) filtered = filtered.filter(h => h.motherId === motherId);
  if (type) filtered = filtered.filter(h => h.type === type);
  if (status) filtered = filtered.filter(h => h.status === status);
  res.json(filtered);
});

router.get('/:id', (req, res) => {
  const handovers = readData(DATA_FILES.handovers);
  const handover = handovers.find(h => h.id === req.params.id);
  if (!handover) {
    return res.status(404).json({ error: '交接记录不存在' });
  }
  res.json(handover);
});

router.post('/', checkRole([ROLES.ADMIN, ROLES.HEAD_NURSE, ROLES.NURSE]), (req, res) => {
  const handovers = readData(DATA_FILES.handovers);
  const newHandover = {
    id: uuidv4(),
    ...req.body,
    status: req.body.status || 'pending',
    createdBy: req.user.id,
    createdAt: new Date().toISOString()
  };
  handovers.push(newHandover);
  writeData(DATA_FILES.handovers, handovers);
  res.status(201).json(newHandover);
});

router.put('/:id', checkRole([ROLES.ADMIN, ROLES.HEAD_NURSE]), (req, res) => {
  const handovers = readData(DATA_FILES.handovers);
  const idx = handovers.findIndex(h => h.id === req.params.id);
  if (idx === -1) {
    return res.status(404).json({ error: '交接记录不存在' });
  }
  handovers[idx] = { ...handovers[idx], ...req.body, id: handovers[idx].id, updatedAt: new Date().toISOString() };
  writeData(DATA_FILES.handovers, handovers);
  res.json(handovers[idx]);
});

router.post('/:id/confirm', checkRole([ROLES.ADMIN, ROLES.HEAD_NURSE]), (req, res) => {
  const handovers = readData(DATA_FILES.handovers);
  const idx = handovers.findIndex(h => h.id === req.params.id);
  if (idx === -1) {
    return res.status(404).json({ error: '交接记录不存在' });
  }
  handovers[idx].status = 'completed';
  handovers[idx].confirmedBy = req.user.id;
  handovers[idx].confirmedAt = new Date().toISOString();
  writeData(DATA_FILES.handovers, handovers);
  res.json(handovers[idx]);
});

router.delete('/:id', checkRole([ROLES.ADMIN]), (req, res) => {
  let handovers = readData(DATA_FILES.handovers);
  handovers = handovers.filter(h => h.id !== req.params.id);
  writeData(DATA_FILES.handovers, handovers);
  res.json({ message: '删除成功' });
});

module.exports = router;
