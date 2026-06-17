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

const sanitizeFeeForFamily = (fee) => {
  const feeTypeName = {
    deposit: '押金',
    package: '套餐费',
    extra: '增购服务费',
    refund: '退款',
    other: '其他费用'
  };
  const statusName = {
    pending: '待支付',
    paid: '已支付',
    cancelled: '已取消'
  };
  return {
    id: fee.id,
    motherId: fee.motherId,
    type: fee.type,
    typeName: feeTypeName[fee.type] || '费用',
    amount: Number(fee.amount) || 0,
    currency: 'CNY',
    status: fee.status,
    statusName: statusName[fee.status] || fee.status,
    summary: fee.type === 'package'
      ? `月子护理套餐${fee.status === 'paid' ? '已结清' : '待支付'}`
      : (fee.description || '相关费用'),
    createdAt: fee.createdAt,
    paidAt: fee.paidAt || null,
    paidDate: fee.paidAt ? fee.paidAt.split('T')[0] : null,
    notice: '费用明细与变动详情可咨询您的专属销售顾问，内部调价与审批流程不对外展示。'
  };
};

router.get('/', (req, res) => {
  const fees = readData(DATA_FILES.fees);
  const { motherId, type, status } = req.query;
  let filtered = fees;
  if (motherId) filtered = filtered.filter(f => f.motherId === motherId);
  if (type) filtered = filtered.filter(f => f.type === type);
  if (status) filtered = filtered.filter(f => f.status === status);
  
  if (req.user.role === ROLES.FAMILY) {
    const motherIds = getFamilyMotherIds(req.user.id);
    filtered = filtered.filter(f => motherIds.includes(f.motherId));
    filtered = filtered.map(sanitizeFeeForFamily);
  }
  
  res.json(filtered);
});

router.get('/:id', (req, res) => {
  const fees = readData(DATA_FILES.fees);
  const fee = fees.find(f => f.id === req.params.id);
  if (!fee) {
    return res.status(404).json({ error: '费用记录不存在' });
  }
  
  if (req.user.role === ROLES.FAMILY) {
    const motherIds = getFamilyMotherIds(req.user.id);
    if (!motherIds.includes(fee.motherId)) {
      return res.status(403).json({ error: '权限不足，您无权查看此费用记录。如需查询请联系销售顾问。' });
    }
    return res.json(sanitizeFeeForFamily(fee));
  }
  
  res.json(fee);
});

router.post('/', checkRole([ROLES.ADMIN, ROLES.SALES]), (req, res) => {
  const fees = readData(DATA_FILES.fees);
  const newFee = {
    id: uuidv4(),
    ...req.body,
    status: req.body.status || 'pending',
    createdBy: req.user.id,
    createdAt: new Date().toISOString()
  };
  fees.push(newFee);
  writeData(DATA_FILES.fees, fees);
  res.status(201).json(newFee);
});

router.put('/:id', checkRole([ROLES.ADMIN, ROLES.SALES]), (req, res) => {
  const fees = readData(DATA_FILES.fees);
  const idx = fees.findIndex(f => f.id === req.params.id);
  if (idx === -1) {
    return res.status(404).json({ error: '费用记录不存在' });
  }
  fees[idx] = { ...fees[idx], ...req.body, id: fees[idx].id, updatedAt: new Date().toISOString() };
  writeData(DATA_FILES.fees, fees);
  res.json(fees[idx]);
});

router.post('/:id/pay', checkRole([ROLES.ADMIN, ROLES.SALES]), (req, res) => {
  const fees = readData(DATA_FILES.fees);
  const idx = fees.findIndex(f => f.id === req.params.id);
  if (idx === -1) {
    return res.status(404).json({ error: '费用记录不存在' });
  }
  fees[idx].status = 'paid';
  fees[idx].paidAt = new Date().toISOString();
  fees[idx].paidBy = req.user.id;
  fees[idx].paymentMethod = req.body.paymentMethod || 'cash';
  writeData(DATA_FILES.fees, fees);
  res.json(fees[idx]);
});

router.delete('/:id', checkRole([ROLES.ADMIN]), (req, res) => {
  let fees = readData(DATA_FILES.fees);
  fees = fees.filter(f => f.id !== req.params.id);
  writeData(DATA_FILES.fees, fees);
  res.json({ message: '删除成功' });
});

module.exports = router;
