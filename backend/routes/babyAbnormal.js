const express = require('express');
const { v4: uuidv4 } = require('uuid');
const router = express.Router();
const { readData, writeData, DATA_FILES } = require('../data/initData');
const { checkRole, ROLES } = require('../middleware/auth');

const ABNORMAL_TYPES = {
  jaundice_rise: '黄疸值升高',
  weight_drop: '体重下降',
  vomiting_frequent: '吐奶频繁',
  feeding_difficulty: '喂养不顺'
};

const STATUS_MAP = {
  pending: '待护士长处理',
  reviewing: '护士长评估中',
  recheck_scheduled: '已安排复测',
  hospital_advice: '建议就医',
  resolved: '已处理完成',
  observing: '持续观察中'
};

const getFamilyMotherIds = (userId) => {
  const users = readData(DATA_FILES.users);
  const user = users.find(u => u.id === userId);
  return user?.motherIds || [];
};

const getBabyInfo = (babyId) => {
  if (!babyId) return { name: '宝宝', motherId: null };
  const babies = readData(DATA_FILES.babies);
  const baby = babies.find(b => b.id === babyId);
  return {
    name: baby?.name || '宝宝',
    motherId: baby?.motherId || null,
    gender: baby?.gender || ''
  };
};

const getUserName = (userId) => {
  if (!userId) return '';
  const users = readData(DATA_FILES.users);
  const user = users.find(u => u.id === userId);
  return user?.name || '';
};

const sanitizeForFamily = (record) => {
  const babyInfo = getBabyInfo(record.babyId);
  const indicator = record.status === 'hospital_advice' ? 'warning'
    : (record.status === 'recheck_scheduled' || record.status === 'observing') ? 'attention'
    : 'normal';

  let conclusionText = '医护团队已关注并持续观察宝宝状态';
  if (record.status === 'hospital_advice') {
    conclusionText = record.familyConclusion || '医护团队评估后建议就医检查，已联系家属';
  } else if (record.status === 'recheck_scheduled') {
    conclusionText = record.familyConclusion || '已安排复测，请耐心等待结果';
  } else if (record.status === 'resolved') {
    conclusionText = record.familyConclusion || '宝宝状态已恢复稳定，护理团队持续关注中';
  } else if (record.status === 'observing') {
    conclusionText = record.familyConclusion || '宝宝状态需要关注，护理团队已加强观察频率';
  }

  return {
    id: record.id,
    babyId: record.babyId,
    babyName: babyInfo.name,
    abnormalType: record.abnormalType,
    abnormalTypeName: ABNORMAL_TYPES[record.abnormalType] || '异常观察',
    status: record.status,
    statusName: STATUS_MAP[record.status] || record.status,
    indicator,
    conclusion: conclusionText,
    observationFrequency: record.observationFrequency || '每日常规观察',
    nextRecheckTime: record.nextRecheckTime || null,
    reportedDate: record.reportedAt?.split('T')[0] || record.createdAt?.split('T')[0] || '',
    tips: [
      '宝宝健康时刻被关注，如有任何异常护理团队会第一时间处理',
      '详细的护理评估数据由医护团队内部保存，家属端展示结论性信息',
      '如需了解更多细节，请联系护士长或专属月嫂'
    ]
  };
};

router.get('/', (req, res) => {
  const records = readData(DATA_FILES.babyAbnormal);
  const { babyId, motherId, status, abnormalType } = req.query;
  let filtered = [...records];

  if (babyId) filtered = filtered.filter(r => r.babyId === babyId);
  if (status) filtered = filtered.filter(r => r.status === status);
  if (abnormalType) filtered = filtered.filter(r => r.abnormalType === abnormalType);

  if (motherId) {
    const babies = readData(DATA_FILES.babies);
    const babyIds = babies.filter(b => b.motherId === motherId).map(b => b.id);
    filtered = filtered.filter(r => babyIds.includes(r.babyId));
  }

  if (req.user.role === ROLES.FAMILY) {
    const motherIds = getFamilyMotherIds(req.user.id);
    const babies = readData(DATA_FILES.babies);
    const authorizedBabyIds = babies.filter(b => motherIds.includes(b.motherId)).map(b => b.id);
    filtered = filtered.filter(r => authorizedBabyIds.includes(r.babyId));
    filtered = filtered.map(sanitizeForFamily);
    filtered.sort((a, b) => new Date(b.reportedDate) - new Date(a.reportedDate));
    return res.json(filtered);
  }

  filtered = filtered.map(r => ({
    ...r,
    babyName: getBabyInfo(r.babyId).name,
    reporterName: getUserName(r.reportedBy),
    handlerName: getUserName(r.handledBy),
    abnormalTypeName: ABNORMAL_TYPES[r.abnormalType] || r.abnormalType,
    statusName: STATUS_MAP[r.status] || r.status
  }));

  filtered.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  res.json(filtered);
});

router.get('/:id', (req, res) => {
  const records = readData(DATA_FILES.babyAbnormal);
  const record = records.find(r => r.id === req.params.id);
  if (!record) {
    return res.status(404).json({ error: '异常观察记录不存在' });
  }

  if (req.user.role === ROLES.FAMILY) {
    const motherIds = getFamilyMotherIds(req.user.id);
    const babyInfo = getBabyInfo(record.babyId);
    if (!motherIds.includes(babyInfo.motherId)) {
      return res.status(403).json({ error: '权限不足，您无权查看此记录' });
    }
    return res.json(sanitizeForFamily(record));
  }

  res.json({
    ...record,
    babyName: getBabyInfo(record.babyId).name,
    reporterName: getUserName(record.reportedBy),
    handlerName: getUserName(record.handledBy),
    abnormalTypeName: ABNORMAL_TYPES[record.abnormalType] || record.abnormalType,
    statusName: STATUS_MAP[record.status] || record.status
  });
});

router.post('/', checkRole([ROLES.ADMIN, ROLES.HEAD_NURSE, ROLES.NURSE]), (req, res) => {
  const records = readData(DATA_FILES.babyAbnormal);
  const { babyId, abnormalType, description, feedingAmount, mentalState, photos, occurTime } = req.body;

  if (!babyId || !abnormalType) {
    return res.status(400).json({ error: '宝宝ID和异常类型为必填项' });
  }

  const newRecord = {
    id: uuidv4(),
    babyId,
    abnormalType,
    occurTime: occurTime || new Date().toISOString(),
    feedingAmount: feedingAmount || null,
    mentalState: mentalState || '',
    photos: photos || [],
    description: description || '',
    status: 'pending',
    reportedBy: req.user.id,
    createdAt: new Date().toISOString(),
    reportedAt: new Date().toISOString(),
    internalNotes: [],
    recheckRecords: []
  };

  records.push(newRecord);
  writeData(DATA_FILES.babyAbnormal, records);

  const result = {
    ...newRecord,
    babyName: getBabyInfo(babyId).name,
    reporterName: getUserName(req.user.id),
    abnormalTypeName: ABNORMAL_TYPES[abnormalType] || abnormalType,
    statusName: STATUS_MAP.pending
  };

  res.status(201).json(result);
});

router.put('/:id', checkRole([ROLES.ADMIN, ROLES.HEAD_NURSE, ROLES.NURSE]), (req, res) => {
  const records = readData(DATA_FILES.babyAbnormal);
  const idx = records.findIndex(r => r.id === req.params.id);
  if (idx === -1) {
    return res.status(404).json({ error: '异常观察记录不存在' });
  }

  const record = records[idx];

  if (req.user.role === ROLES.NURSE && record.reportedBy !== req.user.id) {
    return res.status(403).json({ error: '只能编辑自己提交的记录' });
  }

  const editableFields = ['description', 'feedingAmount', 'mentalState', 'photos', 'occurTime', 'abnormalType'];
  const updates = {};
  editableFields.forEach(field => {
    if (req.body[field] !== undefined) {
      updates[field] = req.body[field];
    }
  });

  records[idx] = {
    ...record,
    ...updates,
    updatedAt: new Date().toISOString()
  };

  writeData(DATA_FILES.babyAbnormal, records);
  res.json(records[idx]);
});

router.post('/:id/handle', checkRole([ROLES.ADMIN, ROLES.HEAD_NURSE]), (req, res) => {
  const records = readData(DATA_FILES.babyAbnormal);
  const idx = records.findIndex(r => r.id === req.params.id);
  if (idx === -1) {
    return res.status(404).json({ error: '异常观察记录不存在' });
  }

  const { status, familyConclusion, observationFrequency, nextRecheckTime, internalNote, needHospital } = req.body;

  const record = records[idx];
  record.status = status || record.status;
  record.handledBy = req.user.id;
  record.handledAt = new Date().toISOString();
  record.familyConclusion = familyConclusion || record.familyConclusion;
  record.observationFrequency = observationFrequency || record.observationFrequency;
  record.nextRecheckTime = nextRecheckTime || record.nextRecheckTime;
  record.needHospital = needHospital || false;

  if (internalNote) {
    record.internalNotes = record.internalNotes || [];
    record.internalNotes.push({
      id: uuidv4(),
      content: internalNote,
      createdBy: req.user.id,
      createdAt: new Date().toISOString()
    });
  }

  records[idx] = { ...record, updatedAt: new Date().toISOString() };
  writeData(DATA_FILES.babyAbnormal, records);

  res.json({
    ...records[idx],
    babyName: getBabyInfo(record.babyId).name,
    reporterName: getUserName(record.reportedBy),
    handlerName: getUserName(req.user.id),
    abnormalTypeName: ABNORMAL_TYPES[record.abnormalType] || record.abnormalType,
    statusName: STATUS_MAP[record.status] || record.status
  });
});

router.post('/:id/recheck', checkRole([ROLES.ADMIN, ROLES.HEAD_NURSE, ROLES.NURSE]), (req, res) => {
  const records = readData(DATA_FILES.babyAbnormal);
  const idx = records.findIndex(r => r.id === req.params.id);
  if (idx === -1) {
    return res.status(404).json({ error: '异常观察记录不存在' });
  }

  const { result, notes, photos, level, weight } = req.body;

  const record = records[idx];
  record.recheckRecords = record.recheckRecords || [];
  record.recheckRecords.push({
    id: uuidv4(),
    result: result || '',
    notes: notes || '',
    photos: photos || [],
    level: level || null,
    weight: weight || null,
    checkedBy: req.user.id,
    checkedAt: new Date().toISOString()
  });

  records[idx] = { ...record, updatedAt: new Date().toISOString() };
  writeData(DATA_FILES.babyAbnormal, records);

  res.json(records[idx]);
});

router.post('/:id/resolve', checkRole([ROLES.ADMIN, ROLES.HEAD_NURSE]), (req, res) => {
  const records = readData(DATA_FILES.babyAbnormal);
  const idx = records.findIndex(r => r.id === req.params.id);
  if (idx === -1) {
    return res.status(404).json({ error: '异常观察记录不存在' });
  }

  const { familyConclusion, internalNote } = req.body;

  const record = records[idx];
  record.status = 'resolved';
  record.resolvedBy = req.user.id;
  record.resolvedAt = new Date().toISOString();
  record.familyConclusion = familyConclusion || record.familyConclusion || '宝宝状态已恢复稳定';

  if (internalNote) {
    record.internalNotes = record.internalNotes || [];
    record.internalNotes.push({
      id: uuidv4(),
      content: internalNote,
      createdBy: req.user.id,
      createdAt: new Date().toISOString()
    });
  }

  records[idx] = { ...record, updatedAt: new Date().toISOString() };
  writeData(DATA_FILES.babyAbnormal, records);

  res.json(records[idx]);
});

router.delete('/:id', checkRole([ROLES.ADMIN]), (req, res) => {
  let records = readData(DATA_FILES.babyAbnormal);
  records = records.filter(r => r.id !== req.params.id);
  writeData(DATA_FILES.babyAbnormal, records);
  res.json({ message: '删除成功' });
});

module.exports = router;
module.exports.ABNORMAL_TYPES = ABNORMAL_TYPES;
module.exports.STATUS_MAP = STATUS_MAP;
