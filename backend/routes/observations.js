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

const getBabyName = (babyId) => {
  if (!babyId) return '宝宝';
  const babies = readData(DATA_FILES.babies);
  const baby = babies.find(b => b.id === babyId);
  return baby?.name || '宝宝';
};

const summarizeObservationData = (type, data) => {
  const d = data || {};
  switch (type) {
    case 'sleep':
      return {
        summaryLabel: '睡眠',
        title: `睡眠${d.duration ? `约${d.duration}分钟` : '记录已完成'}`,
        detail: d.quality ? `睡眠质量：${d.quality === 'good' ? '良好' : d.quality === 'medium' ? '一般' : '需要关注'}` : '护士已完成睡眠观察',
        indicator: d.duration ? (Number(d.duration) >= 90 ? 'normal' : Number(d.duration) >= 45 ? 'attention' : 'warning') : 'normal',
        icon: '😴'
      };
    case 'weight':
      const w = Number(d.weight);
      let weightConclusion = '体重记录正常';
      if (w >= 2500 && w <= 4000) weightConclusion = '体重在正常范围';
      else if (w < 2500) weightConclusion = '体重偏轻，护士已关注';
      else if (w > 4000) weightConclusion = '体重偏重，护士已关注';
      return {
        summaryLabel: '体重',
        title: w ? `最新体重 ${(w / 1000).toFixed(2)} kg` : '体重测量已完成',
        detail: weightConclusion,
        indicator: (w >= 2500 && w <= 4000) ? 'normal' : 'attention',
        icon: '⚖️'
      };
    case 'feeding':
      const amount = Number(d.amount);
      return {
        summaryLabel: '喂奶',
        title: d.type ? `${d.type === 'breast' ? '母乳喂养' : d.type === 'formula' ? '配方奶' : '混合喂养'}${amount ? ` ${amount}ml` : ''}` : '喂奶完成',
        detail: d.duration ? `本次喂奶时长约${d.duration}分钟，宝宝进食状态良好。` : '护士已完成本次喂奶护理。',
        indicator: 'normal',
        icon: '🍼'
      };
    case 'excretion':
      return {
        summaryLabel: '排便',
        title: d.type || '排便记录',
        detail: `排便正常，颜色：${d.color || '正常'}，量：${d.amount || '适中'}。护士确认无异常。`,
        indicator: 'normal',
        icon: '💩'
      };
    case 'jaundice':
      const lvl = Number(d.level);
      let jConclusion = '黄疸值正常范围，每日监测中';
      let jIndicator = 'normal';
      if (lvl > 12 && lvl <= 15) { jConclusion = '黄疸值略有偏高，建议多晒太阳，持续观察'; jIndicator = 'attention'; }
      else if (lvl > 15) { jConclusion = '黄疸值偏高，医生已评估并给出处理建议'; jIndicator = 'warning'; }
      return {
        summaryLabel: '黄疸',
        title: lvl ? `黄疸值 ${lvl.toFixed(1)} mg/dL` : '黄疸检测完成',
        detail: jConclusion,
        indicator: jIndicator,
        icon: '🟡'
      };
    case 'temperature':
      const t = Number(d.value);
      let tConc = '体温正常';
      let tInd = 'normal';
      if (t >= 37.5 && t <= 38) { tConc = '体温略有升高，持续观察中'; tInd = 'attention'; }
      else if (t > 38) { tConc = '体温偏高，医生已评估处理'; tInd = 'warning'; }
      else if (t < 36) { tConc = '体温略低，已注意保暖'; tInd = 'attention'; }
      return {
        summaryLabel: '体温',
        title: t ? `体温 ${t.toFixed(1)} ℃` : '体温测量完成',
        detail: tConc,
        indicator: tInd,
        icon: '🌡️'
      };
    case 'mother_vital':
      return {
        summaryLabel: '妈妈体征',
        title: '妈妈体征观察完成',
        detail: '护士已完成妈妈生命体征观察，整体恢复状态良好。如有异常医生会及时联系家属。',
        indicator: 'normal',
        icon: '💗'
      };
    case 'bath':
      return {
        summaryLabel: '洗澡/SPA',
        title: '今日洗澡抚触已完成',
        detail: '宝宝已完成温水洗浴+专业抚触按摩，皮肤状态良好，脐带消毒完成。',
        indicator: 'normal',
        icon: '🛁'
      };
    default:
      return {
        summaryLabel: '护理观察',
        title: '护理记录已完成',
        detail: '护士已完成日常护理观察，母婴状态稳定。',
        indicator: 'normal',
        icon: '✅'
      };
  }
};

const sanitizeObservationForFamily = (obs) => {
  const typeNames = {
    sleep: '睡眠记录', weight: '体重测量', excretion: '排便记录',
    feeding: '喂奶记录', jaundice: '黄疸检测', temperature: '体温测量',
    mother_vital: '妈妈体征', bath: '洗澡抚触', baby_observation: '宝宝日常观察',
    postnatal_check: '产后检查', lactation: '催乳服务'
  };
  const summary = summarizeObservationData(obs.type, obs.data);
  return {
    id: obs.id,
    motherId: obs.motherId,
    babyId: obs.babyId || null,
    babyName: getBabyName(obs.babyId),
    type: obs.type,
    typeName: typeNames[obs.type] || '护理观察',
    recordedAt: obs.recordedAt || obs.createdAt,
    recordedDate: (obs.recordedAt || obs.createdAt || '').split('T')[0],
    summary,
    notice: '详细的原始护理数据由医护团队保存并用于连续评估。家属端展示日常护理结论摘要，如对宝宝状态有任何疑问请随时联系护士长或前台。内部交班讨论内容、精确测量对比图等不对外展示。'
  };
};

router.get('/', (req, res) => {
  const observations = readData(DATA_FILES.observations);
  const { motherId, babyId, type, recordedBy } = req.query;
  let filtered = observations;
  if (motherId) filtered = filtered.filter(o => o.motherId === motherId);
  if (babyId) filtered = filtered.filter(o => o.babyId === babyId);
  if (type) filtered = filtered.filter(o => o.type === type);
  if (recordedBy) filtered = filtered.filter(o => o.recordedBy === recordedBy);
  
  if (req.user.role === ROLES.FAMILY) {
    const motherIds = getFamilyMotherIds(req.user.id);
    filtered = filtered.filter(o => motherIds.includes(o.motherId));
    filtered = filtered.map(sanitizeObservationForFamily);
  }
  
  res.json(filtered);
});

router.get('/:id', (req, res) => {
  const observations = readData(DATA_FILES.observations);
  const observation = observations.find(o => o.id === req.params.id);
  if (!observation) {
    return res.status(404).json({ error: '观察记录不存在' });
  }
  
  if (req.user.role === ROLES.FAMILY) {
    const motherIds = getFamilyMotherIds(req.user.id);
    if (!motherIds.includes(observation.motherId)) {
      return res.status(403).json({ error: '权限不足，您无权查看此护理记录。母婴健康记录涉及隐私，请通过护士长或前台咨询。' });
    }
    return res.json(sanitizeObservationForFamily(observation));
  }
  
  res.json(observation);
});

router.post('/', checkRole([ROLES.ADMIN, ROLES.HEAD_NURSE, ROLES.NURSE, ROLES.NUTRITIONIST]), (req, res) => {
  const observations = readData(DATA_FILES.observations);
  const newObservation = {
    id: uuidv4(),
    ...req.body,
    recordedBy: req.user.id,
    createdAt: new Date().toISOString()
  };
  observations.push(newObservation);
  writeData(DATA_FILES.observations, observations);
  res.status(201).json(newObservation);
});

router.put('/:id', checkRole([ROLES.ADMIN, ROLES.HEAD_NURSE]), (req, res) => {
  const observations = readData(DATA_FILES.observations);
  const idx = observations.findIndex(o => o.id === req.params.id);
  if (idx === -1) {
    return res.status(404).json({ error: '观察记录不存在' });
  }
  observations[idx] = { ...observations[idx], ...req.body, id: observations[idx].id, updatedAt: new Date().toISOString() };
  writeData(DATA_FILES.observations, observations);
  res.json(observations[idx]);
});

router.delete('/:id', checkRole([ROLES.ADMIN]), (req, res) => {
  let observations = readData(DATA_FILES.observations);
  observations = observations.filter(o => o.id !== req.params.id);
  writeData(DATA_FILES.observations, observations);
  res.json({ message: '删除成功' });
});

module.exports = router;
