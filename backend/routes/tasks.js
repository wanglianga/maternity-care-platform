const express = require('express');
const { v4: uuidv4 } = require('uuid');
const router = express.Router();
const { readData, writeData, DATA_FILES } = require('../data/initData');
const { checkRole, ROLES } = require('../middleware/auth');

router.get('/', (req, res) => {
  const tasks = readData(DATA_FILES.tasks);
  const { motherId, babyId, type, status, assignedTo } = req.query;
  let filtered = tasks;
  if (motherId) filtered = filtered.filter(t => t.motherId === motherId);
  if (babyId) filtered = filtered.filter(t => t.babyId === babyId);
  if (type) filtered = filtered.filter(t => t.type === type);
  if (status) filtered = filtered.filter(t => t.status === status);
  if (assignedTo) filtered = filtered.filter(t => t.assignedTo === assignedTo);
  
  if (req.user.role === ROLES.NURSE) {
    filtered = filtered.filter(t => t.assignedTo === req.user.id || !t.assignedTo);
  }
  
  res.json(filtered);
});

router.get('/:id', (req, res) => {
  const tasks = readData(DATA_FILES.tasks);
  const task = tasks.find(t => t.id === req.params.id);
  if (!task) {
    return res.status(404).json({ error: '任务不存在' });
  }
  res.json(task);
});

router.post('/', checkRole([ROLES.ADMIN, ROLES.HEAD_NURSE, ROLES.NUTRITIONIST]), (req, res) => {
  const tasks = readData(DATA_FILES.tasks);
  const newTask = {
    id: uuidv4(),
    ...req.body,
    status: req.body.status || 'pending',
    createdBy: req.user.id,
    createdAt: new Date().toISOString()
  };
  tasks.push(newTask);
  writeData(DATA_FILES.tasks, tasks);
  res.status(201).json(newTask);
});

router.put('/:id', checkRole([ROLES.ADMIN, ROLES.HEAD_NURSE, ROLES.NURSE]), (req, res) => {
  const tasks = readData(DATA_FILES.tasks);
  const idx = tasks.findIndex(t => t.id === req.params.id);
  if (idx === -1) {
    return res.status(404).json({ error: '任务不存在' });
  }
  tasks[idx] = { ...tasks[idx], ...req.body, id: tasks[idx].id, updatedAt: new Date().toISOString() };
  writeData(DATA_FILES.tasks, tasks);
  res.json(tasks[idx]);
});

router.post('/:id/complete', checkRole([ROLES.ADMIN, ROLES.HEAD_NURSE, ROLES.NURSE]), (req, res) => {
  const tasks = readData(DATA_FILES.tasks);
  const idx = tasks.findIndex(t => t.id === req.params.id);
  if (idx === -1) {
    return res.status(404).json({ error: '任务不存在' });
  }
  tasks[idx].status = 'completed';
  tasks[idx].completedBy = req.user.id;
  tasks[idx].completedAt = new Date().toISOString();
  tasks[idx].result = req.body.result || '';
  writeData(DATA_FILES.tasks, tasks);
  res.json(tasks[idx]);
});

router.delete('/:id', checkRole([ROLES.ADMIN, ROLES.HEAD_NURSE]), (req, res) => {
  let tasks = readData(DATA_FILES.tasks);
  tasks = tasks.filter(t => t.id !== req.params.id);
  writeData(DATA_FILES.tasks, tasks);
  res.json({ message: '删除成功' });
});

module.exports = router;
