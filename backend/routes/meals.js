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

const sanitizeMealForFamily = (meal) => {
  const mealTypeName = {
    breakfast: '早餐',
    lunch: '午餐',
    dinner: '晚餐',
    snack1: '上午加餐',
    snack2: '下午加餐',
    supper: '夜宵'
  };
  const statusName = {
    scheduled: '已排餐',
    preparing: '制作中',
    delivered: '已送达',
    eaten: '已用餐'
  };
  const mealType = meal.mealType || meal.type || 'lunch';
  const dishes = meal.dishes || meal.items || [];
  const dishesText = Array.isArray(dishes) ? dishes.join('、') : (typeof dishes === 'string' ? dishes : '');
  const dishesForTags = dishesText + (meal.name || '');
  const nutritionRaw = meal.nutritionInfo;
  const nutritionText = typeof nutritionRaw === 'object' && nutritionRaw
    ? Object.entries(nutritionRaw).map(([k,v]) => `${k}:${v}`).join(' ')
    : String(nutritionRaw || '');
  const nutritionLower = (nutritionText + ' ' + dishesForTags).toLowerCase();
  const autoTags = [];
  if (nutritionLower.includes('蛋白') || /protein|egg|fish|chicken|肉|蛋|鱼/.test(dishesForTags)) autoTags.push('高蛋白');
  if (/红枣|红糖|枸杞|黄芪|中药|汤/.test(dishesForTags)) autoTags.push('调养气血');
  if (/清淡|蒸|煮|少油|低脂/.test(dishesForTags) || nutritionLower.includes('低脂')) autoTags.push('低脂清淡');
  if (/蔬菜|纤维|维生|green|veg/.test(dishesForTags) || nutritionLower.includes('纤维')) autoTags.push('富含膳食纤维');
  if (/催乳|下奶|花生|猪蹄|鲫鱼|木瓜|汤/.test(dishesForTags)) autoTags.push('利于泌乳');
  if (autoTags.length === 0) autoTags.push('营养均衡');
  const commentMap = {
    breakfast: '晨起温养，温和补充元气',
    lunch: '主餐丰富，提供全日能量',
    dinner: '清淡易消化，助力夜间恢复',
    snack1: '间食补充，避免血糖波动',
    snack2: '下午补养，助力泌乳恢复',
    supper: '夜间滋养，少量易消化'
  };
  return {
    id: meal.id,
    motherId: meal.motherId,
    date: meal.date,
    mealType,
    mealTypeName: mealTypeName[mealType] || '月子餐',
    mealName: meal.name || `${mealTypeName[mealType] || '月子餐'}`,
    items: dishesText,
    itemList: Array.isArray(dishes) ? dishes : (typeof dishes === 'string' ? dishes.split(/[,，、]/).filter(Boolean) : []),
    nutritionistComment: meal.comment || meal.nutritionComment || commentMap[mealType] || '营养师定制，适合产后恢复',
    nutritionTags: autoTags,
    status: meal.status,
    statusName: statusName[meal.status] || '已排餐',
    scheduledAt: meal.createdAt,
    allergens: meal.allergens || [],
    notice: '月子餐由营养师根据妈妈恢复阶段与体质定制，如有饮食禁忌或过敏史请及时告知前台或营养师。内部配餐工艺流程、食材采购单价等不对外展示。'
  };
};

router.get('/', (req, res) => {
  const meals = readData(DATA_FILES.meals);
  const { motherId, date, mealType } = req.query;
  let filtered = meals;
  if (motherId) filtered = filtered.filter(m => m.motherId === motherId);
  if (date) filtered = filtered.filter(m => m.date === date);
  if (mealType) filtered = filtered.filter(m => m.mealType === mealType);
  
  if (req.user.role === ROLES.FAMILY) {
    const motherIds = getFamilyMotherIds(req.user.id);
    filtered = filtered.filter(m => motherIds.includes(m.motherId));
    filtered = filtered.map(sanitizeMealForFamily);
  }
  
  res.json(filtered);
});

router.get('/:id', (req, res) => {
  const meals = readData(DATA_FILES.meals);
  const meal = meals.find(m => m.id === req.params.id);
  if (!meal) {
    return res.status(404).json({ error: '餐食记录不存在' });
  }
  
  if (req.user.role === ROLES.FAMILY) {
    const motherIds = getFamilyMotherIds(req.user.id);
    if (!motherIds.includes(meal.motherId)) {
      return res.status(403).json({ error: '权限不足，您无权查看此餐食记录。月子餐涉及产妇个人体质定制，请咨询营养师。' });
    }
    return res.json(sanitizeMealForFamily(meal));
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
