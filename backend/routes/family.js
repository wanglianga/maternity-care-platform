const express = require('express');
const router = express.Router();
const { readData, DATA_FILES } = require('../data/initData');
const { checkRole, ROLES } = require('../middleware/auth');

router.use(checkRole([ROLES.FAMILY, ROLES.ADMIN, ROLES.HEAD_NURSE]));

router.get('/dashboard', (req, res) => {
  const users = readData(DATA_FILES.users);
  const user = users.find(u => u.id === req.user.id);
  const motherIds = user?.motherIds || [];
  
  const mothers = readData(DATA_FILES.mothers).filter(m => motherIds.includes(m.id));
  const babies = readData(DATA_FILES.babies).filter(b => motherIds.includes(b.motherId));
  const observations = readData(DATA_FILES.observations).filter(o => motherIds.includes(o.motherId));
  const meals = readData(DATA_FILES.meals).filter(m => motherIds.includes(m.motherId));
  const visitors = readData(DATA_FILES.visitors).filter(v => motherIds.includes(v.motherId));
  const tasks = readData(DATA_FILES.tasks).filter(t => motherIds.includes(t.motherId));
  const fees = readData(DATA_FILES.fees).filter(f => motherIds.includes(f.motherId));
  const contracts = readData(DATA_FILES.contracts).filter(c => motherIds.includes(c.motherId));
  
  const today = new Date().toISOString().split('T')[0];
  
  const babyRecords = babies.map(baby => {
    const babyObs = observations.filter(o => o.babyId === baby.id);
    const todayObs = babyObs.filter(o => (o.createdAt || '').split('T')[0] === today);
    
    const sleepRecords = babyObs.filter(o => o.type === 'sleep');
    const weightRecords = babyObs.filter(o => o.type === 'weight');
    const feedingRecords = babyObs.filter(o => o.type === 'feeding');
    const excretionRecords = babyObs.filter(o => o.type === 'excretion');
    const jaundiceRecords = babyObs.filter(o => o.type === 'jaundice');
    
    return {
      ...baby,
      todayObservations: todayObs.length,
      latestWeight: weightRecords.length > 0 ? weightRecords[weightRecords.length - 1] : null,
      sleepSummary: {
        todayCount: sleepRecords.filter(s => (s.createdAt || '').split('T')[0] === today).length,
        todayDuration: sleepRecords
          .filter(s => (s.createdAt || '').split('T')[0] === today)
          .reduce((sum, s) => sum + (parseInt(s.data?.duration) || 0), 0)
      },
      feedingSummary: {
        todayCount: feedingRecords.filter(f => (f.createdAt || '').split('T')[0] === today).length,
        lastFeeding: feedingRecords.length > 0 ? feedingRecords[feedingRecords.length - 1] : null
      },
      excretionSummary: {
        todayCount: excretionRecords.filter(e => (e.createdAt || '').split('T')[0] === today).length
      },
      latestJaundice: jaundiceRecords.length > 0 ? jaundiceRecords[jaundiceRecords.length - 1] : null
    };
  });
  
  res.json({
    mothers: mothers.map(m => ({
      id: m.id,
      name: m.name,
      status: m.status,
      checkInDate: m.checkInDate,
      expectedCheckOut: m.expectedCheckOut,
      healthStatus: m.healthStatus || '良好',
      notes: m.notes
    })),
    babies: babyRecords.map(b => ({
      id: b.id,
      name: b.name,
      gender: b.gender,
      birthDate: b.birthDate,
      latestWeight: b.latestWeight,
      sleepSummary: b.sleepSummary,
      feedingSummary: b.feedingSummary,
      excretionSummary: b.excretionSummary,
      latestJaundice: b.latestJaundice
    })),
    todayMeals: meals.filter(m => m.date === today),
    recentObservations: observations.slice(-20).reverse(),
    pendingVisits: visitors.filter(v => v.status === 'pending' || v.status === 'approved'),
    todayTasks: tasks.filter(t => t.status === 'scheduled' || t.status === 'in_progress'),
    feeSummary: {
      total: fees.reduce((sum, f) => sum + (parseFloat(f.amount) || 0), 0),
      paid: fees.filter(f => f.status === 'paid').reduce((sum, f) => sum + (parseFloat(f.amount) || 0), 0),
      pending: fees.filter(f => f.status !== 'paid').reduce((sum, f) => sum + (parseFloat(f.amount) || 0), 0),
      items: fees
    },
    contracts: contracts,
    messages: [
      { id: 1, type: 'info', content: '您可以在"宝宝护理"页面查看详细的宝宝日常记录', time: new Date().toISOString() },
      { id: 2, type: 'warning', content: '探视请提前1小时预约，并配合前台完成消毒登记', time: new Date().toISOString() }
    ]
  });
});

router.get('/mothers/:motherId/summary', (req, res) => {
  const { motherId } = req.params;
  const users = readData(DATA_FILES.users);
  const user = users.find(u => u.id === req.user.id);
  const motherIds = user?.motherIds || [];
  
  if (!motherIds.includes(motherId)) {
    return res.status(403).json({ error: '无权查看此信息' });
  }
  
  const mothers = readData(DATA_FILES.mothers);
  const mother = mothers.find(m => m.id === motherId);
  if (!mother) {
    return res.status(404).json({ error: '产妇档案不存在' });
  }
  
  const babies = readData(DATA_FILES.babies).filter(b => b.motherId === motherId);
  const observations = readData(DATA_FILES.observations).filter(o => o.motherId === motherId);
  const meals = readData(DATA_FILES.meals).filter(m => m.motherId === motherId);
  
  res.json({
    mother: {
      id: mother.id,
      name: mother.name,
      status: mother.status,
      checkInDate: mother.checkInDate,
      expectedCheckOut: mother.expectedCheckOut,
      healthStatus: mother.healthStatus,
      recoveryNotes: mother.recoveryNotes,
      doctorVisits: mother.doctorVisits || []
    },
    babies: babies.map(b => ({
      id: b.id,
      name: b.name,
      gender: b.gender,
      birthDate: b.birthDate,
      birthWeight: b.birthWeight,
      observations: observations.filter(o => o.babyId === b.id).slice(-30)
    })),
    recentMeals: meals.slice(-14),
    recoveryTimeline: [
      { date: mother.checkInDate, event: '入住', type: 'checkin' },
      ...(mother.milestones || []).map(m => ({ ...m })),
      { date: mother.expectedCheckOut, event: '预计出院', type: 'checkout' }
    ]
  });
});

module.exports = router;
