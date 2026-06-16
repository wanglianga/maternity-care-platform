const express = require('express');
const { v4: uuidv4 } = require('uuid');
const router = express.Router();
const { readData, writeData, DATA_FILES } = require('../data/initData');
const { checkRole, ROLES } = require('../middleware/auth');

router.get('/', (req, res) => {
  const meals = readData(DATA_FILES.meals);
  const { motherId, date, mealType } = req.query;
  let filtered = meals;
  if (motherId) filtered = filtered.filter(m => m.motherId === motherId);
  if (date) filtered = filtered.filter(m => m.date === date);
  if (mealType) filtered = filtered.filter(m => m.mealType === mealType);
  
  if (req.user.role === ROLES.FAMILY) {
    const users = readData(DATA_FILES.users);
    const user = users.find(u => u.id === req.user.id);
    const motherIds = user?.motherIds || [];
    filtered = filtered.filter(m => motherIds.includes(m.motherId));
  }
  
  res.json(filtered);
});

router.get('/:id', (req, res) => {
  const meals = readData(DATA_FILES.meals);
  const meal = meals.find(m => m.id === req.params.id);
  if (!meal) {
    return res.status(404).json({ error: '餐食记录不存在' });
  }
  res.json(meal);
});

router.post('/', checkRole([ROLES.ADMIN, ROLES.NUTRITIONIST]), (req, res) => {
  const meals = readData(DATA_FILES.meals);
  const newMeal = {
    id: uuidv4(),
    ...req.body,
    status: req.body.status || 'scheduled',
    createdBy: req.user.id,
    createdAt: new Date().toISOString()
  };
  meals.push(newMeal);
  writeData(DATA_FILES.meals, meals);
  res.status(201).json(newMeal);
});

router.put('/:id', checkRole([ROLES.ADMIN, ROLES.NUTRITIONIST]), (req, res) => {
  const meals = readData(DATA_FILES.meals);
  const idx = meals.findIndex(m => m.id === req.params.id);
  if (idx === -1) {
    return res.status(404).json({ error: '餐食记录不存在' });
  }
  meals[idx] = { ...meals[idx], ...req.body, id: meals[idx].id, updatedAt: new Date().toISOString() };
  writeData(DATA_FILES.meals, meals);
  res.json(meals[idx]);
});

router.delete('/:id', checkRole([ROLES.ADMIN, ROLES.NUTRITIONIST]), (req, res) => {
  let meals = readData(DATA_FILES.meals);
  meals = meals.filter(m => m.id !== req.params.id);
  writeData(DATA_FILES.meals, meals);
  res.json({ message: '删除成功' });
});

module.exports = router;
