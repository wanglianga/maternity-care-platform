const express = require('express');
const { v4: uuidv4 } = require('uuid');
const router = express.Router();
const { readData, writeData, DATA_FILES } = require('../data/initData');
const { checkRole, ROLES } = require('../middleware/auth');

router.get('/', (req, res) => {
  const observations = readData(DATA_FILES.observations);
  const { motherId, babyId, type, recordedBy } = req.query;
  let filtered = observations;
  if (motherId) filtered = filtered.filter(o => o.motherId === motherId);
  if (babyId) filtered = filtered.filter(o => o.babyId === babyId);
  if (type) filtered = filtered.filter(o => o.type === type);
  if (recordedBy) filtered = filtered.filter(o => o.recordedBy === recordedBy);
  
  if (req.user.role === ROLES.FAMILY) {
    const users = readData(DATA_FILES.users);
    const user = users.find(u => u.id === req.user.id);
    const motherIds = user?.motherIds || [];
    filtered = filtered.filter(o => motherIds.includes(o.motherId));
  }
  
  res.json(filtered);
});

router.get('/:id', (req, res) => {
  const observations = readData(DATA_FILES.observations);
  const observation = observations.find(o => o.id === req.params.id);
  if (!observation) {
    return res.status(404).json({ error: '观察记录不存在' });
  }
  res.json(observation);
});

router.post('/', checkRole([ROLES.ADMIN, ROLES.HEAD_NURSE, ROLES.NURSE, ROLES.NUTRITIONIST]), (req, res) => {
  const observations = readData(DATA_FILES.observations);
  const newObservation = {
    id: uuidv4(),
    ...req.body,
    recordedBy: req.user.id,
    createdAt: new Date().toISOString()
  };
  observations.push(newObservation);
  writeData(DATA_FILES.observations, observations);
  res.status(201).json(newObservation);
});

router.put('/:id', checkRole([ROLES.ADMIN, ROLES.HEAD_NURSE]), (req, res) => {
  const observations = readData(DATA_FILES.observations);
  const idx = observations.findIndex(o => o.id === req.params.id);
  if (idx === -1) {
    return res.status(404).json({ error: '观察记录不存在' });
  }
  observations[idx] = { ...observations[idx], ...req.body, id: observations[idx].id, updatedAt: new Date().toISOString() };
  writeData(DATA_FILES.observations, observations);
  res.json(observations[idx]);
});

router.delete('/:id', checkRole([ROLES.ADMIN]), (req, res) => {
  let observations = readData(DATA_FILES.observations);
  observations = observations.filter(o => o.id !== req.params.id);
  writeData(DATA_FILES.observations, observations);
  res.json({ message: '删除成功' });
});

module.exports = router;
