const express = require('express');
const { v4: uuidv4 } = require('uuid');
const router = express.Router();
const { readData, writeData, DATA_FILES } = require('../data/initData');
const { checkRole, ROLES } = require('../middleware/auth');

router.get('/', (req, res) => {
  const packages = readData(DATA_FILES.packages);
  const { status } = req.query;
  let filtered = packages;
  if (status) filtered = packages.filter(p => p.status === status);
  res.json(filtered);
});

router.get('/:id', (req, res) => {
  const packages = readData(DATA_FILES.packages);
  const pkg = packages.find(p => p.id === req.params.id);
  if (!pkg) {
    return res.status(404).json({ error: '套餐不存在' });
  }
  res.json(pkg);
});

router.post('/', checkRole([ROLES.ADMIN, ROLES.SALES]), (req, res) => {
  const packages = readData(DATA_FILES.packages);
  const newPackage = {
    id: uuidv4(),
    ...req.body,
    status: req.body.status || 'active',
    createdAt: new Date().toISOString()
  };
  packages.push(newPackage);
  writeData(DATA_FILES.packages, packages);
  res.status(201).json(newPackage);
});

router.put('/:id', checkRole([ROLES.ADMIN, ROLES.SALES]), (req, res) => {
  const packages = readData(DATA_FILES.packages);
  const idx = packages.findIndex(p => p.id === req.params.id);
  if (idx === -1) {
    return res.status(404).json({ error: '套餐不存在' });
  }
  packages[idx] = { ...packages[idx], ...req.body, id: packages[idx].id };
  writeData(DATA_FILES.packages, packages);
  res.json(packages[idx]);
});

router.delete('/:id', checkRole([ROLES.ADMIN]), (req, res) => {
  let packages = readData(DATA_FILES.packages);
  packages = packages.filter(p => p.id !== req.params.id);
  writeData(DATA_FILES.packages, packages);
  res.json({ message: '删除成功' });
});

module.exports = router;
