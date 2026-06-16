const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');

const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/users');
const motherRoutes = require('./routes/mothers');
const babyRoutes = require('./routes/babies');
const roomRoutes = require('./routes/rooms');
const packageRoutes = require('./routes/packages');
const scheduleRoutes = require('./routes/schedules');
const visitorRoutes = require('./routes/visitors');
const mealRoutes = require('./routes/meals');
const disinfectionRoutes = require('./routes/disinfection');
const feeRoutes = require('./routes/fees');
const handoverRoutes = require('./routes/handovers');
const contractRoutes = require('./routes/contracts');
const taskRoutes = require('./routes/tasks');
const observationRoutes = require('./routes/observations');
const familyRoutes = require('./routes/family');

const { authenticateToken, checkRole } = require('./middleware/auth');
const { initData } = require('./data/initData');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

initData();

app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: '月子中心管理平台服务运行正常' });
});

app.use('/api/auth', authRoutes);
app.use('/api/users', authenticateToken, userRoutes);
app.use('/api/mothers', authenticateToken, motherRoutes);
app.use('/api/babies', authenticateToken, babyRoutes);
app.use('/api/rooms', authenticateToken, roomRoutes);
app.use('/api/packages', authenticateToken, packageRoutes);
app.use('/api/schedules', authenticateToken, scheduleRoutes);
app.use('/api/visitors', authenticateToken, visitorRoutes);
app.use('/api/meals', authenticateToken, mealRoutes);
app.use('/api/disinfection', authenticateToken, disinfectionRoutes);
app.use('/api/fees', authenticateToken, feeRoutes);
app.use('/api/handovers', authenticateToken, handoverRoutes);
app.use('/api/contracts', authenticateToken, contractRoutes);
app.use('/api/tasks', authenticateToken, taskRoutes);
app.use('/api/observations', authenticateToken, observationRoutes);
app.use('/api/family', authenticateToken, familyRoutes);

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: '服务器内部错误', message: err.message });
});

app.listen(PORT, () => {
  console.log(`月子中心管理平台后端服务已启动: http://localhost:${PORT}`);
});
