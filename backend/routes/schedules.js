const express = require('express');
const { v4: uuidv4 } = require('uuid');
const router = express.Router();
const { readData, writeData, DATA_FILES } = require('../data/initData');
const { checkRole, ROLES } = require('../middleware/auth');

router.get('/', (req, res) => {
  const schedules = readData(DATA_FILES.schedules);
  const { nurseId, motherId, date } = req.query;
  let filtered = schedules;
  if (nurseId) filtered = filtered.filter(s => s.nurseId === nurseId);
  if (motherId) filtered = filtered.filter(s => s.motherId === motherId);
  if (date) filtered = filtered.filter(s => s.date === date);
  res.json(filtered);
});

router.get('/:id', (req, res) => {
  const schedules = readData(DATA_FILES.schedules);
  const schedule = schedules.find(s => s.id === req.params.id);
  if (!schedule) {
    return res.status(404).json({ error: '排班记录不存在' });
  }
  res.json(schedule);
});

router.post('/', checkRole([ROLES.ADMIN, ROLES.HEAD_NURSE]), (req, res) => {
  const schedules = readData(DATA_FILES.schedules);
  const newSchedule = {
    id: uuidv4(),
    ...req.body,
    status: req.body.status || 'scheduled',
    createdAt: new Date().toISOString()
  };
  schedules.push(newSchedule);
  writeData(DATA_FILES.schedules, schedules);
  res.status(201).json(newSchedule);
});

router.put('/:id', checkRole([ROLES.ADMIN, ROLES.HEAD_NURSE]), (req, res) => {
  const schedules = readData(DATA_FILES.schedules);
  const idx = schedules.findIndex(s => s.id === req.params.id);
  if (idx === -1) {
    return res.status(404).json({ error: '排班记录不存在' });
  }
  schedules[idx] = { ...schedules[idx], ...req.body, id: schedules[idx].id };
  writeData(DATA_FILES.schedules, schedules);
  res.json(schedules[idx]);
});

router.delete('/:id', checkRole([ROLES.ADMIN, ROLES.HEAD_NURSE]), (req, res) => {
  let schedules = readData(DATA_FILES.schedules);
  schedules = schedules.filter(s => s.id !== req.params.id);
  writeData(DATA_FILES.schedules, schedules);
  res.json({ message: '删除成功' });
});

module.exports = router;
