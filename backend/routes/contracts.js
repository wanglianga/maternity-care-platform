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

const getPackageName = (packageId) => {
  const packages = readData(DATA_FILES.packages);
  const pkg = packages.find(p => p.id === packageId);
  return pkg?.name || '护理套餐';
};

const sanitizeContractForFamily = (contract) => {
  const statusName = {
    active: '有效',
    cancelled: '已取消',
    completed: '已完成',
    pending: '待确认'
  };
  return {
    id: contract.id,
    motherId: contract.motherId,
    contractNo: contract.contractNo,
    packageId: contract.packageId,
    packageName: contract.packageName || getPackageName(contract.packageId),
    totalPrice: Number(contract.totalPrice) || 0,
    deposit: Number(contract.deposit) || 0,
    unpaid: Math.max(0, Number(contract.totalPrice || 0) - Number(contract.deposit || 0)),
    status: contract.status,
    statusName: statusName[contract.status] || '已签署',
    signDate: contract.signDate || contract.createdAt,
    checkInDate: contract.checkInDate,
    checkOutDate: contract.checkOutDate,
    durationDays: contract.days || (contract.checkInDate && contract.checkOutDate
      ? Math.ceil((new Date(contract.checkOutDate) - new Date(contract.checkInDate)) / (1000 * 60 * 60 * 24))
      : 28),
    serviceSummary: `含${contract.checkOutDate ? (contract.days || 28) : 28}天专业月子护理，详情请咨询销售顾问。`,
    signedAt: contract.createdAt,
    notice: '合同完整条款、补充协议、费用变更流程由销售部门管理，家属端仅展示核心费用汇总。如需查阅合同原件请联系您的专属销售顾问。'
  };
};

router.get('/', (req, res) => {
  const contracts = readData(DATA_FILES.contracts);
  const { motherId, status } = req.query;
  let filtered = contracts;
  if (motherId) filtered = filtered.filter(c => c.motherId === motherId);
  if (status) filtered = filtered.filter(c => c.status === status);
  
  if (req.user.role === ROLES.FAMILY) {
    const motherIds = getFamilyMotherIds(req.user.id);
    filtered = filtered.filter(c => motherIds.includes(c.motherId));
    filtered = filtered.map(sanitizeContractForFamily);
  }
  
  res.json(filtered);
});

router.get('/:id', (req, res) => {
  const contracts = readData(DATA_FILES.contracts);
  const contract = contracts.find(c => c.id === req.params.id);
  if (!contract) {
    return res.status(404).json({ error: '合同不存在' });
  }
  
  if (req.user.role === ROLES.FAMILY) {
    const motherIds = getFamilyMotherIds(req.user.id);
    if (!motherIds.includes(contract.motherId)) {
      return res.status(403).json({ error: '权限不足，您无权查阅此合同。如需合同详情请联系销售顾问。' });
    }
    return res.json(sanitizeContractForFamily(contract));
  }
  
  res.json(contract);
});

router.post('/', checkRole([ROLES.ADMIN, ROLES.SALES]), (req, res) => {
  const contracts = readData(DATA_FILES.contracts);
  const newContract = {
    id: uuidv4(),
    ...req.body,
    contractNo: 'HT' + Date.now(),
    status: req.body.status || 'active',
    createdBy: req.user.id,
    createdAt: new Date().toISOString()
  };
  contracts.push(newContract);
  writeData(DATA_FILES.contracts, contracts);
  res.status(201).json(newContract);
});

router.put('/:id', checkRole([ROLES.ADMIN, ROLES.SALES]), (req, res) => {
  const contracts = readData(DATA_FILES.contracts);
  const idx = contracts.findIndex(c => c.id === req.params.id);
  if (idx === -1) {
    return res.status(404).json({ error: '合同不存在' });
  }
  contracts[idx] = { ...contracts[idx], ...req.body, id: contracts[idx].id, updatedAt: new Date().toISOString() };
  writeData(DATA_FILES.contracts, contracts);
  res.json(contracts[idx]);
});

router.delete('/:id', checkRole([ROLES.ADMIN]), (req, res) => {
  let contracts = readData(DATA_FILES.contracts);
  contracts = contracts.filter(c => c.id !== req.params.id);
  writeData(DATA_FILES.contracts, contracts);
  res.json({ message: '删除成功' });
});

module.exports = router;
