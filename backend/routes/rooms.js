const express = require('express');
const { v4: uuidv4 } = require('uuid');
const router = express.Router();
const { readData, writeData, DATA_FILES } = require('../data/initData');
const { checkRole, ROLES } = require('../middleware/auth');

router.get('/', (req, res) => {
  const rooms = readData(DATA_FILES.rooms);
  const { status } = req.query;
  let filtered = rooms;
  if (status) filtered = rooms.filter(r => r.status === status);
  res.json(filtered);
});

router.get('/:id', (req, res) => {
  const rooms = readData(DATA_FILES.rooms);
  const room = rooms.find(r => r.id === req.params.id);
  if (!room) {
    return res.status(404).json({ error: '房间不存在' });
  }
  res.json(room);
});

router.post('/', checkRole([ROLES.ADMIN, ROLES.RECEPTION]), (req, res) => {
  const rooms = readData(DATA_FILES.rooms);
  const newRoom = {
    id: uuidv4(),
    ...req.body,
    status: req.body.status || 'empty',
    createdAt: new Date().toISOString()
  };
  rooms.push(newRoom);
  writeData(DATA_FILES.rooms, rooms);
  res.status(201).json(newRoom);
});

router.put('/:id', checkRole([ROLES.ADMIN, ROLES.RECEPTION]), (req, res) => {
  const rooms = readData(DATA_FILES.rooms);
  const idx = rooms.findIndex(r => r.id === req.params.id);
  if (idx === -1) {
    return res.status(404).json({ error: '房间不存在' });
  }
  rooms[idx] = { ...rooms[idx], ...req.body, id: rooms[idx].id };
  writeData(DATA_FILES.rooms, rooms);
  res.json(rooms[idx]);
});

router.delete('/:id', checkRole([ROLES.ADMIN]), (req, res) => {
  let rooms = readData(DATA_FILES.rooms);
  rooms = rooms.filter(r => r.id !== req.params.id);
  writeData(DATA_FILES.rooms, rooms);
  res.json({ message: '删除成功' });
});

module.exports = router;
