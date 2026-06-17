const express = require('express');
const { v4: uuidv4 } = require('uuid');
const router = express.Router();
const { readData, writeData, DATA_FILES } = require('../data/initData');
const { checkRole, ROLES } = require('../middleware/auth');

const getMotherName = (motherId) => {
  if (!motherId) return '';
  const mothers = readData(DATA_FILES.mothers);
  const m = mothers.find(x => x.id === motherId);
  return m?.name || '';
};

const sanitizeBabyForFamily = (baby) => {
  const genderName = {
    male: '男宝', female: '女宝', boy: '男宝', girl: '女宝'
  };
  const birthWeight = Number(baby.birthWeight);
  const birthWeightSummary = (
    birthWeight >= 2500 && birthWeight <= 4000
  ) ? '出生体重正常' : (birthWeight < 2500 ? '低出生体重，护理团队已制定专项护理方案' : '出生体重偏重，护理团队持续关注');
  
  return {
    id: baby.id,
    motherId: baby.motherId,
    motherName: getMotherName(baby.motherId),
    name: baby.name || '宝宝',
    nickname: baby.nickname || baby.name || '小宝贝',
    gender: baby.gender,
    genderName: genderName[baby.gender] || (baby.gender === '男' ? '男宝' : baby.gender === '女' ? '女宝' : '宝宝'),
    birthDate: baby.birthDate,
    birthDays: baby.birthDate
      ? Math.max(0, Math.ceil((Date.now() - new Date(baby.birthDate).getTime()) / (1000 * 60 * 60 * 24)))
      : 0,
    birthWeightSummary,
    healthSummary: baby.apgarScore
      ? (Number(baby.apgarScore) >= 8 ? '出生评估优秀，发育状态良好' : '出生评估正常，护理团队持续关注')
      : '宝宝状态稳定，每日由护士精心照护',
    apgarSummary: baby.apgarScore ? `出生 Apgar 评分 ${baby.apgarScore} 分（满分 10 分）` : null,
    hospital: baby.hospital ? `${baby.hospital}出生` : null,
    careNotice: '宝宝的详细体温记录、每次喂奶毫升数、原始评估量表等由护理团队内部保存用于连续性照护。家属端仅展示日常护理结论摘要。如需了解任何细节请随时联系护士长或您的专属月嫂。',
    privacyNotice: '宝宝的完整出生医学信息及详细护理记录受隐私保护，不对外展示原始数据。'
  };
};

router.get('/', (req, res) => {
  const babies = readData(DATA_FILES.babies);
  const { motherId } = req.query;
  let filtered = babies;
  if (motherId) filtered = babies.filter(b => b.motherId === motherId);
  
  if (req.user.role === ROLES.FAMILY) {
    const users = readData(DATA_FILES.users);
    const user = users.find(u => u.id === req.user.id);
    const motherIds = user?.motherIds || [];
    filtered = filtered.filter(b => motherIds.includes(b.motherId));
    filtered = filtered.map(sanitizeBabyForFamily);
  }
  
  res.json(filtered);
});

router.get('/:id', (req, res) => {
  const babies = readData(DATA_FILES.babies);
  const baby = babies.find(b => b.id === req.params.id);
  if (!baby) {
    return res.status(404).json({ error: '宝宝记录不存在' });
  }
  
  if (req.user.role === ROLES.FAMILY) {
    const users = readData(DATA_FILES.users);
    const user = users.find(u => u.id === req.user.id);
    const motherIds = user?.motherIds || [];
    if (!motherIds.includes(baby.motherId)) {
      return res.status(403).json({ error: '权限不足，您无权查看此宝宝档案。宝宝健康信息受隐私保护，仅授权家属可见。' });
    }
    return res.json(sanitizeBabyForFamily(baby));
  }
  
  res.json(baby);
});

router.post('/', checkRole([ROLES.ADMIN, ROLES.HEAD_NURSE, ROLES.NURSE]), (req, res) => {
  const babies = readData(DATA_FILES.babies);
  const newBaby = {
    id: uuidv4(),
    ...req.body,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
  babies.push(newBaby);
  writeData(DATA_FILES.babies, babies);
  res.status(201).json(newBaby);
});

router.put('/:id', checkRole([ROLES.ADMIN, ROLES.HEAD_NURSE, ROLES.NURSE]), (req, res) => {
  const babies = readData(DATA_FILES.babies);
  const idx = babies.findIndex(b => b.id === req.params.id);
  if (idx === -1) {
    return res.status(404).json({ error: '宝宝记录不存在' });
  }
  babies[idx] = { ...babies[idx], ...req.body, id: babies[idx].id, updatedAt: new Date().toISOString() };
  writeData(DATA_FILES.babies, babies);
  res.json(babies[idx]);
});

router.delete('/:id', checkRole([ROLES.ADMIN]), (req, res) => {
  let babies = readData(DATA_FILES.babies);
  babies = babies.filter(b => b.id !== req.params.id);
  writeData(DATA_FILES.babies, babies);
  res.json({ message: '删除成功' });
});

module.exports = router;
