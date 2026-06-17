const express = require('express');
const { v4: uuidv4 } = require('uuid');
const router = express.Router();
const { readData, writeData, DATA_FILES } = require('../data/initData');
const { checkRole, ROLES } = require('../middleware/auth');

const getFamilyMotherIds = (userId) => {
  const users = readData(DATA_FILES.users);
  const user = users.find(u => u.id === userId);
  return user?.motherIds || [];
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

const sanitizeVisitorForFamily = (visitor) => {
  const statusName = {
    pending: '待前台审批',
    approved: '已批准，可按预约时间到场',
    rejected: '已拒绝，详情请咨询',
    checked_in: '已入场',
    checked_out: '已离场',
    cancelled: '已取消'
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
    isOwn: visitor.createdBy && visitor.createdBy === getFamilyMotherIds.toString().slice(0, 0) ? true : undefined,
    actualCheckIn: visitor.actualCheckIn || null,
    actualCheckOut: visitor.actualCheckOut || null,
    disinfectionDone: visitor.disinfectionDone || false,
    tips: [
      '请在预约时间前10分钟到达前台，配合核验身份证件',
      '入场前请完成手部消毒、鞋套更换、体温测量',
      '中午12:00-15:00及晚间20:00后为妈妈休息时间，恕不接待访客',
      '每次探视建议不超过30分钟，同行访客不超过2人'
    ]
  };
};

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
  
  if (req.user.role === ROLES.RECEPTION || req.user.role === ROLES.ADMIN) {
    filtered = filtered.map(v => ({
      ...v,
      idCard: v.idCard,
      phone: v.phone,
      _idCardMasked: maskIdCard(v.idCard),
      _phoneMasked: maskPhone(v.phone)
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
    _phoneMasked: maskPhone(visitor.phone)
  });
});

router.post('/', checkRole([ROLES.ADMIN, ROLES.RECEPTION, ROLES.FAMILY]), (req, res) => {
  const visitors = readData(DATA_FILES.visitors);
  const newVisitor = {
    id: uuidv4(),
    ...req.body,
    status: req.body.status || 'pending',
    createdBy: req.user.id,
    createdAt: new Date().toISOString()
  };
  visitors.push(newVisitor);
  writeData(DATA_FILES.visitors, visitors);
  res.status(201).json(newVisitor);
});

router.put('/:id', checkRole([ROLES.ADMIN, ROLES.RECEPTION]), (req, res) => {
  const visitors = readData(DATA_FILES.visitors);
  const idx = visitors.findIndex(v => v.id === req.params.id);
  if (idx === -1) {
    return res.status(404).json({ error: '访客记录不存在' });
  }
  visitors[idx] = { ...visitors[idx], ...req.body, id: visitors[idx].id };
  writeData(DATA_FILES.visitors, visitors);
  res.json(visitors[idx]);
});

router.post('/:id/checkin', checkRole([ROLES.ADMIN, ROLES.RECEPTION]), (req, res) => {
  const visitors = readData(DATA_FILES.visitors);
  const idx = visitors.findIndex(v => v.id === req.params.id);
  if (idx === -1) {
    return res.status(404).json({ error: '访客记录不存在' });
  }
  visitors[idx].status = 'checked_in';
  visitors[idx].actualCheckIn = new Date().toISOString();
  visitors[idx].checkedInBy = req.user.id;
  visitors[idx].disinfectionDone = req.body.disinfectionDone || true;
  writeData(DATA_FILES.visitors, visitors);
  res.json(visitors[idx]);
});

router.post('/:id/checkout', checkRole([ROLES.ADMIN, ROLES.RECEPTION]), (req, res) => {
  const visitors = readData(DATA_FILES.visitors);
  const idx = visitors.findIndex(v => v.id === req.params.id);
  if (idx === -1) {
    return res.status(404).json({ error: '访客记录不存在' });
  }
  visitors[idx].status = 'checked_out';
  visitors[idx].actualCheckOut = new Date().toISOString();
  visitors[idx].checkedOutBy = req.user.id;
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
