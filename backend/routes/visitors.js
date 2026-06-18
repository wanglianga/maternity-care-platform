const express = require('express');
const { v4: uuidv4 } = require('uuid');
const router = express.Router();
const { readData, writeData, DATA_FILES } = require('../data/initData');
const { checkRole, ROLES } = require('../middleware/auth');

const REST_PERIODS = [
  { start: '12:00', end: '15:00', label: '午休时间' },
  { start: '20:00', end: '23:59', label: '晚间休息' },
  { start: '00:00', end: '08:00', label: '夜间休息' }
];

const VISIT_DURATION_LIMIT = 30;
const MAX_VISITORS_PER_ROOM = 2;

const getFamilyMotherIds = (userId) => {
  const users = readData(DATA_FILES.users);
  const user = users.find(u => u.id === userId);
  return user?.motherIds || [];
};

const getMotherRoom = (motherId) => {
  if (!motherId) return null;
  const rooms = readData(DATA_FILES.rooms);
  return rooms.find(r => r.motherId === motherId) || null;
};

const getRoomCapacity = (roomId) => {
  if (!roomId) return MAX_VISITORS_PER_ROOM;
  const rooms = readData(DATA_FILES.rooms);
  const room = rooms.find(r => r.id === roomId);
  return room?.capacity ? Math.min(room.capacity, MAX_VISITORS_PER_ROOM + 1) : MAX_VISITORS_PER_ROOM;
};

const maskIdCard = (id = '') => {
  if (!id) return '';
  if (id.length <= 8) return id.slice(0, 2) + '*'.repeat(Math.max(0, id.length - 2));
  return id.slice(0, 4) + '*'.repeat(id.length - 8) + id.slice(-4);
};

const maskPhone = (phone = '') => {
  if (!phone) return '';
  if (phone.length <= 7) return phone.slice(0, 2) + '*'.repeat(Math.max(0, phone.length - 2));
  return phone.slice(0, 3) + '****' + phone.slice(-4);
};

const isInRestPeriod = (timeStr) => {
  if (!timeStr) return false;
  const time = timeStr.slice(0, 5);
  for (const period of REST_PERIODS) {
    if (time >= period.start && time < period.end) {
      return period.label;
    }
  }
  return false;
};

const getAuthorizedVisitors = (motherId) => {
  const authList = readData(DATA_FILES.visitorAuthList);
  return authList.filter(a => a.motherId === motherId && a.status === 'authorized');
};

const isVisitorAuthorized = (motherId, idCard, name) => {
  const authorized = getAuthorizedVisitors(motherId);
  return authorized.some(a =>
    (a.idCard && a.idCard === idCard) ||
    (a.name && a.name === name)
  );
};

const checkRoomVisitorConflict = (motherId, visitDate, startTime, endTime, excludeId = null) => {
  const visitors = readData(DATA_FILES.visitors);
  const room = getMotherRoom(motherId);
  const roomCapacity = getRoomCapacity(room?.id);

  const sameTimeVisitors = visitors.filter(v => {
    if (excludeId && v.id === excludeId) return false;
    if (v.motherId !== motherId) return false;
    if (v.visitDate !== visitDate) return false;
    if (v.status === 'cancelled' || v.status === 'rejected' || v.status === 'checked_out') return false;

    const vStart = v.startTime?.slice(0, 5);
    const vEnd = v.endTime?.slice(0, 5);
    const reqStart = startTime?.slice(0, 5);
    const reqEnd = endTime?.slice(0, 5);

    if (!vStart || !vEnd || !reqStart || !reqEnd) return false;

    return reqStart < vEnd && reqEnd > vStart;
  });

  const totalVisitors = sameTimeVisitors.reduce((sum, v) => sum + (Number(v.visitorCount) || 1), 0);

  return {
    hasConflict: totalVisitors >= roomCapacity,
    currentCount: totalVisitors,
    maxCapacity: roomCapacity,
    conflictingVisits: sameTimeVisitors
  };
};

const sanitizeVisitorForFamily = (visitor) => {
  const statusName = {
    pending: '待前台审批',
    approved: '已批准，可按预约时间到场',
    rejected: '已拒绝，详情请咨询',
    checked_in: '已入场',
    checked_out: '已离场',
    cancelled: '已取消',
    need_head_nurse_approval: '需护士长审批中'
  };
  return {
    id: visitor.id,
    motherId: visitor.motherId,
    visitorName: visitor.name,
    relation: visitor.relation,
    visitorCount: Number(visitor.visitorCount) || 1,
    visitDate: visitor.visitDate,
    startTime: visitor.startTime,
    endTime: visitor.endTime,
    status: visitor.status,
    statusName: statusName[visitor.status] || visitor.status,
    appliedAt: visitor.createdAt,
    isOwn: visitor.createdBy === getFamilyMotherIds.toString().slice(0, 0) ? true : undefined,
    actualCheckIn: visitor.actualCheckIn || null,
    actualCheckOut: visitor.actualCheckOut || null,
    disinfectionDone: visitor.disinfectionDone || false,
    isSpecial: visitor.isSpecial || false,
    affectCarePlan: visitor.affectCarePlan || false,
    tips: [
      '请在预约时间前10分钟到达前台，配合核验身份证件',
      '入场前请完成手部消毒、鞋套更换、体温测量',
      '中午12:00-15:00及晚间20:00后为妈妈休息时间，恕不接待访客',
      '每次探视建议不超过30分钟，同行访客不超过2人'
    ]
  };
};

const detectConflicts = (visitorData, excludeId = null) => {
  const conflicts = [];
  const warnings = [];

  const restPeriod = isInRestPeriod(visitorData.startTime);
  if (restPeriod) {
    conflicts.push({
      type: 'rest_period',
      message: `预约时间处于${restPeriod}，不安排探视`,
      severity: 'error'
    });
  }

  const roomConflict = checkRoomVisitorConflict(
    visitorData.motherId,
    visitorData.visitDate,
    visitorData.startTime,
    visitorData.endTime,
    excludeId
  );

  if (roomConflict.hasConflict) {
    conflicts.push({
      type: 'room_capacity',
      message: `该时段房间内访客已达上限（${roomConflict.maxCapacity}人），请选择其他时段`,
      severity: 'error',
      currentCount: roomConflict.currentCount,
      maxCapacity: roomConflict.maxCapacity
    });
  } else if (roomConflict.currentCount > 0) {
    warnings.push({
      type: 'room_near_capacity',
      message: `该时段已有${roomConflict.currentCount}位访客，房间容量${roomConflict.maxCapacity}人`,
      severity: 'warning'
    });
  }

  const authorized = isVisitorAuthorized(visitorData.motherId, visitorData.idCard, visitorData.name);
  if (!authorized && visitorData.status !== 'pending') {
    warnings.push({
      type: 'unauthorized',
      message: '该访客不在授权名单中，需特殊审批',
      severity: 'warning'
    });
  }

  const visitorCount = Number(visitorData.visitorCount) || 1;
  if (visitorCount > MAX_VISITORS_PER_ROOM) {
    warnings.push({
      type: 'exceed_standard',
      message: `探视人数超过标准限制（建议${MAX_VISITORS_PER_ROOM}人），需特殊审批`,
      severity: 'warning'
    });
  }

  const isSpecial = !authorized || visitorCount > MAX_VISITORS_PER_ROOM || restPeriod;
  if (isSpecial && !conflicts.some(c => c.severity === 'error')) {
    warnings.push({
      type: 'special_visit',
      message: '本次探视属于特殊探视，需护士长审批',
      severity: 'warning'
    });
  }

  return { conflicts, warnings, isSpecial };
};

router.get('/auth-list', checkRole([ROLES.ADMIN, ROLES.RECEPTION, ROLES.HEAD_NURSE]), (req, res) => {
  const authList = readData(DATA_FILES.visitorAuthList);
  const { motherId, status } = req.query;
  let filtered = authList;

  if (motherId) filtered = filtered.filter(a => a.motherId === motherId);
  if (status) filtered = filtered.filter(a => a.status === status);

  filtered = filtered.map(a => ({
    ...a,
    idCardMasked: maskIdCard(a.idCard),
    phoneMasked: maskPhone(a.phone)
  }));

  res.json(filtered);
});

router.post('/auth-list', checkRole([ROLES.ADMIN, ROLES.RECEPTION, ROLES.HEAD_NURSE]), (req, res) => {
  const authList = readData(DATA_FILES.visitorAuthList);
  const { motherId, name, relation, idCard, phone } = req.body;

  if (!motherId || !name) {
    return res.status(400).json({ error: '产妇ID和访客姓名为必填项' });
  }

  const newAuth = {
    id: uuidv4(),
    motherId,
    name,
    relation: relation || '',
    idCard: idCard || '',
    phone: phone || '',
    status: 'authorized',
    createdBy: req.user.id,
    createdAt: new Date().toISOString()
  };

  authList.push(newAuth);
  writeData(DATA_FILES.visitorAuthList, authList);
  res.status(201).json({ ...newAuth, idCardMasked: maskIdCard(idCard), phoneMasked: maskPhone(phone) });
});

router.put('/auth-list/:id', checkRole([ROLES.ADMIN, ROLES.RECEPTION, ROLES.HEAD_NURSE]), (req, res) => {
  const authList = readData(DATA_FILES.visitorAuthList);
  const idx = authList.findIndex(a => a.id === req.params.id);
  if (idx === -1) {
    return res.status(404).json({ error: '授权记录不存在' });
  }

  authList[idx] = {
    ...authList[idx],
    ...req.body,
    updatedAt: new Date().toISOString()
  };

  writeData(DATA_FILES.visitorAuthList, authList);
  res.json(authList[idx]);
});

router.delete('/auth-list/:id', checkRole([ROLES.ADMIN, ROLES.HEAD_NURSE]), (req, res) => {
  let authList = readData(DATA_FILES.visitorAuthList);
  authList = authList.filter(a => a.id !== req.params.id);
  writeData(DATA_FILES.visitorAuthList, authList);
  res.json({ message: '删除成功' });
});

router.post('/check-conflicts', checkRole([ROLES.ADMIN, ROLES.RECEPTION, ROLES.HEAD_NURSE]), (req, res) => {
  const result = detectConflicts(req.body);
  res.json(result);
});

router.get('/', (req, res) => {
  const visitors = readData(DATA_FILES.visitors);
  const { motherId, status, date } = req.query;
  let filtered = visitors;
  if (motherId) filtered = filtered.filter(v => v.motherId === motherId);
  if (status) filtered = filtered.filter(v => v.status === status);
  if (date) filtered = filtered.filter(v => v.visitDate === date);
  
  if (req.user.role === ROLES.FAMILY) {
    const motherIds = getFamilyMotherIds(req.user.id);
    filtered = filtered.filter(v => motherIds.includes(v.motherId));
    filtered = filtered.map(sanitizeVisitorForFamily).map(v => ({
      ...v,
      isOwn: (visitors.find(x => x.id === v.id)?.createdBy) === req.user.id
    }));
  }
  
  if (req.user.role === ROLES.RECEPTION || req.user.role === ROLES.ADMIN || req.user.role === ROLES.HEAD_NURSE) {
    filtered = filtered.map(v => ({
      ...v,
      idCard: v.idCard,
      phone: v.phone,
      _idCardMasked: maskIdCard(v.idCard),
      _phoneMasked: maskPhone(v.phone),
      isSpecial: v.isSpecial || false,
      affectCarePlan: v.affectCarePlan || false,
      headNurseApproved: v.headNurseApproved || false,
      headNurseApprovedBy: v.headNurseApprovedBy || null,
      headNurseApprovedAt: v.headNurseApprovedAt || null,
      headNurseNote: v.headNurseNote || ''
    }));
  }
  
  res.json(filtered);
});

router.get('/:id', (req, res) => {
  const visitors = readData(DATA_FILES.visitors);
  const visitor = visitors.find(v => v.id === req.params.id);
  if (!visitor) {
    return res.status(404).json({ error: '访客记录不存在' });
  }
  
  if (req.user.role === ROLES.FAMILY) {
    const motherIds = getFamilyMotherIds(req.user.id);
    if (!motherIds.includes(visitor.motherId)) {
      return res.status(403).json({ error: '权限不足，您无权查看此探视预约。探视预约涉及产妇隐私，请通过前台预约。' });
    }
    const data = sanitizeVisitorForFamily(visitor);
    data.isOwn = visitor.createdBy === req.user.id;
    if (data.isOwn) {
      data.phone = maskPhone(visitor.phone);
      data.idCard = maskIdCard(visitor.idCard);
      data.notes = visitor.notes || '';
    }
    return res.json(data);
  }
  
  res.json({
    ...visitor,
    _idCardMasked: maskIdCard(visitor.idCard),
    _phoneMasked: maskPhone(visitor.phone),
    isSpecial: visitor.isSpecial || false,
    affectCarePlan: visitor.affectCarePlan || false,
    headNurseApproved: visitor.headNurseApproved || false,
    headNurseApprovedBy: visitor.headNurseApprovedBy || null,
    headNurseApprovedAt: visitor.headNurseApprovedAt || null,
    headNurseNote: visitor.headNurseNote || ''
  });
});

router.post('/', checkRole([ROLES.ADMIN, ROLES.RECEPTION, ROLES.FAMILY]), (req, res) => {
  const visitors = readData(DATA_FILES.visitors);
  
  const visitorData = {
    ...req.body,
    status: req.body.status || 'pending'
  };

  const conflictResult = detectConflicts(visitorData);

  if (req.user.role === ROLES.RECEPTION || req.user.role === ROLES.ADMIN) {
    if (conflictResult.isSpecial) {
      visitorData.status = 'need_head_nurse_approval';
      visitorData.isSpecial = true;
    }
  }

  const newVisitor = {
    id: uuidv4(),
    ...visitorData,
    name: req.body.name || req.body.visitorName || '',
    createdBy: req.user.id,
    createdAt: new Date().toISOString(),
    isSpecial: conflictResult.isSpecial
  };

  visitors.push(newVisitor);
  writeData(DATA_FILES.visitors, visitors);

  const result = {
    ...newVisitor,
    conflicts: conflictResult.conflicts,
    warnings: conflictResult.warnings
  };

  res.status(201).json(result);
});

router.put('/:id', checkRole([ROLES.ADMIN, ROLES.RECEPTION]), (req, res) => {
  const visitors = readData(DATA_FILES.visitors);
  const idx = visitors.findIndex(v => v.id === req.params.id);
  if (idx === -1) {
    return res.status(404).json({ error: '访客记录不存在' });
  }

  const updated = { ...visitors[idx], ...req.body, id: visitors[idx].id };
  const conflictResult = detectConflicts(updated, visitors[idx].id);

  if (conflictResult.isSpecial && updated.status !== 'rejected' && updated.status !== 'cancelled') {
    updated.status = 'need_head_nurse_approval';
    updated.isSpecial = true;
  }

  visitors[idx] = updated;
  writeData(DATA_FILES.visitors, visitors);

  res.json({
    ...visitors[idx],
    conflicts: conflictResult.conflicts,
    warnings: conflictResult.warnings
  });
});

router.post('/:id/approve-special', checkRole([ROLES.ADMIN, ROLES.HEAD_NURSE]), (req, res) => {
  const visitors = readData(DATA_FILES.visitors);
  const idx = visitors.findIndex(v => v.id === req.params.id);
  if (idx === -1) {
    return res.status(404).json({ error: '访客记录不存在' });
  }

  const { approved, note, affectCarePlan } = req.body;

  if (approved) {
    visitors[idx].status = 'approved';
    visitors[idx].headNurseApproved = true;
    visitors[idx].headNurseApprovedBy = req.user.id;
    visitors[idx].headNurseApprovedAt = new Date().toISOString();
    visitors[idx].headNurseNote = note || '';
    visitors[idx].affectCarePlan = affectCarePlan || false;
  } else {
    visitors[idx].status = 'rejected';
    visitors[idx].headNurseApproved = false;
    visitors[idx].headNurseNote = note || '';
    visitors[idx].rejectReason = note || '护士长未批准此次特殊探视';
  }

  visitors[idx].updatedAt = new Date().toISOString();
  writeData(DATA_FILES.visitors, visitors);
  res.json(visitors[idx]);
});

router.post('/:id/checkin', checkRole([ROLES.ADMIN, ROLES.RECEPTION]), (req, res) => {
  const visitors = readData(DATA_FILES.visitors);
  const idx = visitors.findIndex(v => v.id === req.params.id);
  if (idx === -1) {
    return res.status(404).json({ error: '访客记录不存在' });
  }

  const visitor = visitors[idx];

  if (visitor.status === 'need_head_nurse_approval') {
    return res.status(400).json({ error: '该特殊探视需护士长审批后方可入场' });
  }

  if (visitor.status !== 'approved') {
    return res.status(400).json({ error: '该预约状态不允许入场' });
  }

  const authorized = isVisitorAuthorized(visitor.motherId, visitor.idCard, visitor.name);
  if (!authorized && !visitor.headNurseApproved) {
    return res.status(400).json({ error: '该访客不在授权名单中，且未经护士长特殊审批，不得入场' });
  }

  visitor.status = 'checked_in';
  visitor.actualCheckIn = new Date().toISOString();
  visitor.checkedInBy = req.user.id;
  visitor.disinfectionDone = req.body.disinfectionDone || true;
  writeData(DATA_FILES.visitors, visitors);
  res.json(visitor);
});

router.post('/:id/checkout', checkRole([ROLES.ADMIN, ROLES.RECEPTION]), (req, res) => {
  const visitors = readData(DATA_FILES.visitors);
  const idx = visitors.findIndex(v => v.id === req.params.id);
  if (idx === -1) {
    return res.status(404).json({ error: '访客记录不存在' });
  }

  const { affectCarePlan, carePlanNote } = req.body;

  visitors[idx].status = 'checked_out';
  visitors[idx].actualCheckOut = new Date().toISOString();
  visitors[idx].checkedOutBy = req.user.id;
  visitors[idx].affectCarePlan = affectCarePlan || false;
  visitors[idx].carePlanNote = carePlanNote || '';
  writeData(DATA_FILES.visitors, visitors);
  res.json(visitors[idx]);
});

router.delete('/:id', checkRole([ROLES.ADMIN, ROLES.RECEPTION]), (req, res) => {
  let visitors = readData(DATA_FILES.visitors);
  visitors = visitors.filter(v => v.id !== req.params.id);
  writeData(DATA_FILES.visitors, visitors);
  res.json({ message: '删除成功' });
});

module.exports = router;
