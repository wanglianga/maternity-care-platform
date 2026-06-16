const express = require('express');
const { v4: uuidv4 } = require('uuid');
const router = express.Router();
const { readData, writeData, DATA_FILES } = require('../data/initData');
const { checkRole, ROLES } = require('../middleware/auth');

router.get('/', (req, res) => {
  const records = readData(DATA_FILES.disinfection);
  const { roomId, area, date } = req.query;
  let filtered = records;
  if (roomId) filtered = filtered.filter(r => r.roomId === roomId);
  if (area) filtered = filtered.filter(r => r.area === area);
  if (date) filtered = filtered.filter(r => r.date === date);
  res.json(filtered);
});

router.get('/:id', (req, res) => {
  const records = readData(DATA_FILES.disinfection);
  const record = records.find(r => r.id === req.params.id);
  if (!record) {
    return res.status(404).json({ error: '消毒记录不存在' });
  }
  res.json(record);
});

router.post('/', checkRole([ROLES.ADMIN, ROLES.RECEPTION, ROLES.HEAD_NURSE, ROLES.NURSE]), (req, res) => {
  const records = readData(DATA_FILES.disinfection);
  const newRecord = {
    id: uuidv4(),
    ...req.body,
    performedBy: req.user.id,
    createdAt: new Date().toISOString()
  };
  records.push(newRecord);
  writeData(DATA_FILES.disinfection, records);
  res.status(201).json(newRecord);
});

router.put('/:id', checkRole([ROLES.ADMIN, ROLES.HEAD_NURSE]), (req, res) => {
  const records = readData(DATA_FILES.disinfection);
  const idx = records.findIndex(r => r.id === req.params.id);
  if (idx === -1) {
    return res.status(404).json({ error: '消毒记录不存在' });
  }
  records[idx] = { ...records[idx], ...req.body, id: records[idx].id };
  writeData(DATA_FILES.disinfection, records);
  res.json(records[idx]);
});

router.delete('/:id', checkRole([ROLES.ADMIN]), (req, res) => {
  let records = readData(DATA_FILES.disinfection);
  records = records.filter(r => r.id !== req.params.id);
  writeData(DATA_FILES.disinfection, records);
  res.json({ message: '删除成功' });
});

module.exports = router;
