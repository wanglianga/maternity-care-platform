const fs = require('fs');
const path = require('path');
const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');

const DATA_DIR = path.join(__dirname, '..', 'data', 'db');
const DATA_FILES = {
  users: 'users.json',
  mothers: 'mothers.json',
  babies: 'babies.json',
  rooms: 'rooms.json',
  packages: 'packages.json',
  schedules: 'schedules.json',
  visitors: 'visitors.json',
  meals: 'meals.json',
  disinfection: 'disinfection.json',
  fees: 'fees.json',
  handovers: 'handovers.json',
  contracts: 'contracts.json',
  tasks: 'tasks.json',
  observations: 'observations.json',
  babyAbnormal: 'baby_abnormal.json',
  visitorAuthList: 'visitor_auth_list.json'
};

const ensureDataDir = () => {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
};

const readData = (filename) => {
  ensureDataDir();
  const filePath = path.join(DATA_DIR, filename);
  if (!fs.existsSync(filePath)) {
    return [];
  }
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    return JSON.parse(content || '[]');
  } catch (e) {
    return [];
  }
};

const writeData = (filename, data) => {
  ensureDataDir();
  const filePath = path.join(DATA_DIR, filename);
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf8');
};

const initData = () => {
  ensureDataDir();
  
  const users = readData(DATA_FILES.users);
  if (users.length === 0) {
    const initialUsers = [
      { id: uuidv4(), username: 'admin', password: bcrypt.hashSync('123456', 10), name: '系统管理员', role: 'admin', phone: '13800000000', createdAt: new Date().toISOString() },
      { id: uuidv4(), username: 'sales01', password: bcrypt.hashSync('123456', 10), name: '张销售', role: 'sales', phone: '13800000001', createdAt: new Date().toISOString() },
      { id: uuidv4(), username: 'headnurse', password: bcrypt.hashSync('123456', 10), name: '李护士长', role: 'head_nurse', phone: '13800000002', createdAt: new Date().toISOString() },
      { id: uuidv4(), username: 'nurse01', password: bcrypt.hashSync('123456', 10), name: '王月嫂', role: 'nurse', phone: '13800000003', createdAt: new Date().toISOString() },
      { id: uuidv4(), username: 'nurse02', password: bcrypt.hashSync('123456', 10), name: '赵月嫂', role: 'nurse', phone: '13800000004', createdAt: new Date().toISOString() },
      { id: uuidv4(), username: 'nutrition', password: bcrypt.hashSync('123456', 10), name: '刘营养师', role: 'nutritionist', phone: '13800000005', createdAt: new Date().toISOString() },
      { id: uuidv4(), username: 'reception', password: bcrypt.hashSync('123456', 10), name: '陈前台', role: 'reception', phone: '13800000006', createdAt: new Date().toISOString() },
      { id: uuidv4(), username: 'family01', password: bcrypt.hashSync('123456', 10), name: '家属-周先生', role: 'family', phone: '13800000007', createdAt: new Date().toISOString(), motherIds: [] }
    ];
    writeData(DATA_FILES.users, initialUsers);
  }

  const rooms = readData(DATA_FILES.rooms);
  if (rooms.length === 0) {
    const initialRooms = [
      { id: uuidv4(), roomNo: 'A101', type: '标准单人间', floor: '1楼', pricePerDay: 680, capacity: 1, facilities: ['独立卫浴', '空调', '电视', 'WiFi'], status: 'empty', createdAt: new Date().toISOString() },
      { id: uuidv4(), roomNo: 'A102', type: '标准单人间', floor: '1楼', pricePerDay: 680, capacity: 1, facilities: ['独立卫浴', '空调', '电视', 'WiFi'], status: 'occupied', motherId: null, createdAt: new Date().toISOString() },
      { id: uuidv4(), roomNo: 'B201', type: '豪华VIP套房', floor: '2楼', pricePerDay: 1880, capacity: 2, facilities: ['独立客厅', '独立卫浴', '空调', '电视', 'WiFi', '婴儿看护区', '家属陪护床'], status: 'occupied', motherId: null, createdAt: new Date().toISOString() },
      { id: uuidv4(), roomNo: 'B202', type: '豪华VIP套房', floor: '2楼', pricePerDay: 1880, capacity: 2, facilities: ['独立客厅', '独立卫浴', '空调', '电视', 'WiFi', '婴儿看护区', '家属陪护床'], status: 'maintenance', createdAt: new Date().toISOString() },
      { id: uuidv4(), roomNo: 'C301', type: '尊享总统套房', floor: '3楼', pricePerDay: 3880, capacity: 3, facilities: ['独立客厅', '餐厅', '双卫浴', '中央空调', '智能电视', '高速WiFi', '专业婴儿看护区', '家属陪护间', '专属阳台'], status: 'empty', createdAt: new Date().toISOString() }
    ];
    writeData(DATA_FILES.rooms, initialRooms);
  }

  const packages = readData(DATA_FILES.packages);
  if (packages.length === 0) {
    const initialPackages = [
      { id: uuidv4(), name: '标准护理套餐', type: 'standard', days: 28, basePrice: 19800, description: '基础月子护理服务，包含每日6餐月子餐、基础母婴护理、每周医生巡诊', services: ['每日6餐月子餐', '基础母婴护理', '每周医生巡诊', '基础产后康复项目3次', '宝宝游泳洗澡5次', '催乳服务2次'], status: 'active', createdAt: new Date().toISOString() },
      { id: uuidv4(), name: '豪华护理套餐', type: 'deluxe', days: 28, basePrice: 38800, description: '升级版月子护理，VIP套房，专属月嫂一对一，丰富的产后康复项目', services: ['每日6餐定制月子餐', '专属月嫂一对一24h服务', '每日医生巡诊', '专业产后康复项目10次', '宝宝游泳洗澡15次', '催乳服务5次', '中医调理3次', '新生儿摄影1套'], status: 'active', createdAt: new Date().toISOString() },
      { id: uuidv4(), name: '尊享月子套餐', type: 'premium', days: 42, basePrice: 98800, description: '顶级尊享服务，总统套房，专家团队，全方位产后恢复计划', services: ['每日6餐私人定制月子餐', '双月嫂轮班24h服务', '专家团队每日巡诊', '全套产后康复项目不限次', '宝宝SPA不限次', '专业催乳不限次', '中医专家调理', '专业孕产瑜伽', '满月宴策划', '新生儿摄影2套', '亲子早教课程'], status: 'active', createdAt: new Date().toISOString() }
    ];
    writeData(DATA_FILES.packages, initialPackages);
  }

  Object.values(DATA_FILES).forEach(filename => {
    const filePath = path.join(DATA_DIR, filename);
    if (!fs.existsSync(filePath)) {
      fs.writeFileSync(filePath, '[]', 'utf8');
    }
  });
};

module.exports = {
  DATA_DIR,
  DATA_FILES,
  readData,
  writeData,
  initData
};
