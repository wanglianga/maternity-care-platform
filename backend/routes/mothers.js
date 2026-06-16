const express = require('express');
const { v4: uuidv4 } = require('uuid');
const router = express.Router();
const { readData, writeData, DATA_FILES } = require('../data/initData');
const { checkRole, ROLES } = require('../middleware/auth');

router.get('/', (req, res) => {
  const mothers = readData(DATA_FILES.mothers);
  const { status, roomId } = req.query;
  let filtered = mothers;
  if (status) filtered = mothers.filter(m => m.status === status);
  if (roomId) filtered = mothers.filter(m => m.roomId === roomId);
  
  if (req.user.role === ROLES.FAMILY) {
    const users = readData(DATA_FILES.users);
    const user = users.find(u => u.id === req.user.id);
    const motherIds = user?.motherIds || [];
    filtered = filtered.filter(m => motherIds.includes(m.id));
  }
  
  res.json(filtered);
});

router.get('/:id', (req, res) => {
  const mothers = readData(DATA_FILES.mothers);
  const mother = mothers.find(m => m.id === req.params.id);
  if (!mother) {
    return res.status(404).json({ error: '产妇档案不存在' });
  }
  
  if (req.user.role === ROLES.FAMILY) {
    const users = readData(DATA_FILES.users);
    const user = users.find(u => u.id === req.user.id);
    const motherIds = user?.motherIds || [];
    if (!motherIds.includes(mother.id)) {
      return res.status(403).json({ error: '无权查看此档案' });
    }
  }
  
  res.json(mother);
});

router.post('/', checkRole([ROLES.ADMIN, ROLES.SALES, ROLES.HEAD_NURSE]), (req, res) => {
  const mothers = readData(DATA_FILES.mothers);
  const newMother = {
    id: uuidv4(),
    ...req.body,
    status: req.body.status || 'active',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
  mothers.push(newMother);
  writeData(DATA_FILES.mothers, mothers);
  
  if (req.body.roomId) {
    const rooms = readData(DATA_FILES.rooms);
    const roomIdx = rooms.findIndex(r => r.id === req.body.roomId);
    if (roomIdx !== -1) {
      rooms[roomIdx].status = 'occupied';
      rooms[roomIdx].motherId = newMother.id;
      writeData(DATA_FILES.rooms, rooms);
    }
  }
  
  res.status(201).json(newMother);
});

router.put('/:id', checkRole([ROLES.ADMIN, ROLES.SALES, ROLES.HEAD_NURSE]), (req, res) => {
  const mothers = readData(DATA_FILES.mothers);
  const idx = mothers.findIndex(m => m.id === req.params.id);
  if (idx === -1) {
    return res.status(404).json({ error: '产妇档案不存在' });
  }
  
  const oldRoomId = mothers[idx].roomId;
  const newRoomId = req.body.roomId;
  
  if (oldRoomId !== newRoomId) {
    const rooms = readData(DATA_FILES.rooms);
    if (oldRoomId) {
      const oldIdx = rooms.findIndex(r => r.id === oldRoomId);
      if (oldIdx !== -1) {
        rooms[oldIdx].status = 'empty';
        rooms[oldIdx].motherId = null;
      }
    }
    if (newRoomId) {
      const newIdx = rooms.findIndex(r => r.id === newRoomId);
      if (newIdx !== -1) {
        rooms[newIdx].status = 'occupied';
        rooms[newIdx].motherId = mothers[idx].id;
      }
    }
    writeData(DATA_FILES.rooms, rooms);
  }
  
  mothers[idx] = { ...mothers[idx], ...req.body, id: mothers[idx].id, updatedAt: new Date().toISOString() };
  writeData(DATA_FILES.mothers, mothers);
  res.json(mothers[idx]);
});

router.delete('/:id', checkRole([ROLES.ADMIN]), (req, res) => {
  let mothers = readData(DATA_FILES.mothers);
  const mother = mothers.find(m => m.id === req.params.id);
  mothers = mothers.filter(m => m.id !== req.params.id);
  writeData(DATA_FILES.mothers, mothers);
  
  if (mother?.roomId) {
    const rooms = readData(DATA_FILES.rooms);
    const roomIdx = rooms.findIndex(r => r.id === mother.roomId);
    if (roomIdx !== -1) {
      rooms[roomIdx].status = 'empty';
      rooms[roomIdx].motherId = null;
      writeData(DATA_FILES.rooms, rooms);
    }
  }
  
  res.json({ message: '删除成功' });
});

module.exports = router;
