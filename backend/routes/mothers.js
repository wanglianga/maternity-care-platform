const express = require('express');
const { v4: uuidv4 } = require('uuid');
const router = express.Router();
const { readData, writeData, DATA_FILES } = require('../data/initData');
const { checkRole, ROLES } = require('../middleware/auth');

const maskPhone = (phone = '') => {
  if (!phone) return '';
  if (phone.length <= 7) return phone.slice(0, 2) + '*'.repeat(Math.max(0, phone.length - 2));
  return phone.slice(0, 3) + '****' + phone.slice(-4);
};

const maskIdCard = (id = '') => {
  if (!id) return '';
  if (id.length <= 8) return id.slice(0, 2) + '*'.repeat(Math.max(0, id.length - 2));
  return id.slice(0, 4) + '*'.repeat(id.length - 8) + id.slice(-4);
};

const sanitizeMotherForFamily = (mother) => {
  const statusName = {
    active: '在住',
    booking: '预约中',
    discharged: '已出院'
  };
  const healthStatus = mother.healthStatus || '恢复良好';
  return {
    id: mother.id,
    name: mother.name,
    age: mother.age,
    status: mother.status,
    statusName: statusName[mother.status] || '在住',
    checkInDate: mother.checkInDate,
    expectedCheckOut: mother.expectedCheckOut,
    healthStatusSummary: healthStatus.includes('良') || healthStatus.includes('正常') ? '恢复良好，医护团队每日关注' : (healthStatus.includes('注') || healthStatus.includes('观察') ? '持续观察中，如有异常会及时通知' : healthStatus),
    daysStayed: mother.checkInDate
      ? Math.max(0, Math.ceil((Date.now() - new Date(mother.checkInDate).getTime()) / (1000 * 60 * 60 * 24)))
      : 0,
    daysRemaining: mother.expectedCheckOut
      ? Math.max(0, Math.ceil((new Date(mother.expectedCheckOut).getTime() - Date.now()) / (1000 * 60 * 60 * 24)))
      : null,
    contactPhoneMasked: maskPhone(mother.phone),
    emergencyContactMasked: maskPhone(mother.emergencyContact),
    idCardMasked: maskIdCard(mother.idCard),
    careLevel: mother.careLevel || '标准护理',
    remarks: '完整的医疗档案、检查报告、内部护理评估等由医护团队存档管理。如需了解详细情况，可预约每日医生巡诊时间当面沟通，或联系护士长。',
    privacyNotice: '为保护产妇隐私，身份证号、手机号等敏感信息在本页面已脱敏展示。'
  };
};

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
    filtered = filtered.map(sanitizeMotherForFamily);
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
      return res.status(403).json({ error: '权限不足，您无权查看此档案。产妇健康档案受医疗隐私保护，仅授权家属可见关联信息。' });
    }
    return res.json(sanitizeMotherForFamily(mother));
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
