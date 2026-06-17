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
  
  if (req.user.role === ROLES.FAMILY) {
    return res.status(403).json({
      error: '权限不足，家属端不提供内部任务明细查询。',
      tip: '日常护理进度、已完成的服务摘要可在"宝宝护理"和"妈妈恢复"页面查看结论性描述，内部排班、交班流程等信息不对外展示。'
    });
  }
  
  res.json(filtered);
});

router.get('/:id', (req, res) => {
  const tasks = readData(DATA_FILES.tasks);
  const task = tasks.find(t => t.id === req.params.id);
  if (!task) {
    return res.status(404).json({ error: '任务不存在' });
  }
  
  if (req.user.role === ROLES.FAMILY) {
    return res.status(403).json({
      error: '权限不足，您无权查询内部任务详情。',
      tip: '内部护理任务、排班调度与交班流程不对外展示。如需了解当日护理进度，请查看"宝宝护理"页面的护理活动摘要，或直接联系护士长。'
    });
  }
  
  if (req.user.role === ROLES.NURSE && task.assignedTo && task.assignedTo !== req.user.id) {
    return res.status(403).json({ error: '权限不足，您只能查看分配给您的任务。' });
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
