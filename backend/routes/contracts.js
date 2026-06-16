const express = require('express');
const { v4: uuidv4 } = require('uuid');
const router = express.Router();
const { readData, writeData, DATA_FILES } = require('../data/initData');
const { checkRole, ROLES } = require('../middleware/auth');

router.get('/', (req, res) => {
  const contracts = readData(DATA_FILES.contracts);
  const { motherId, status } = req.query;
  let filtered = contracts;
  if (motherId) filtered = filtered.filter(c => c.motherId === motherId);
  if (status) filtered = filtered.filter(c => c.status === status);
  
  if (req.user.role === ROLES.FAMILY) {
    const users = readData(DATA_FILES.users);
    const user = users.find(u => u.id === req.user.id);
    const motherIds = user?.motherIds || [];
    filtered = filtered.filter(c => motherIds.includes(c.motherId));
  }
  
  res.json(filtered);
});

router.get('/:id', (req, res) => {
  const contracts = readData(DATA_FILES.contracts);
  const contract = contracts.find(c => c.id === req.params.id);
  if (!contract) {
    return res.status(404).json({ error: '合同不存在' });
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
