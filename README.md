# 月子中心护理套餐与探视管理平台

专业的月子中心一体化管理系统，覆盖销售、护士长、月嫂、营养师、前台和家属六大角色，实现产妇档案管理、宝宝护理记录、护理套餐、月嫂排班、访客授权、月子餐管理、消毒记录、费用管理与出院交接的全流程数字化。

---

## 原始需求

> 请实现月子中心护理套餐与探视管理平台，Vue3 护理台给销售、护士长、月嫂、营养师、前台和家属使用，Express 后端保存产妇档案、宝宝观察、房型、护理套餐、月嫂排班、访客授权、餐食、消毒、费用和出院交接。销售录入合同、押金和增购服务；护士长安排喂养、黄疸、洗澡和产康；月嫂记录宝宝睡眠、体重、排便和喂奶；营养师调整月子餐；前台核验探视人员、消毒要求和休息时段。这个产品要保护产妇隐私和宝宝护理安全，让家属看到该看的结论，内部交班、费用变化和探视授权不能混在一起。

---

## 项目简介

### 核心特色

- **六角色权限分离**：销售 / 护士长 / 月嫂 / 营养师 / 前台 / 家属，每个角色独立菜单和视图
- **隐私分级保护**：家属端仅展示结论性摘要，内部交班记录和费用调整流程对家属不可见
- **完整业务闭环**：从销售签约 → 入住院 → 母婴护理 → 餐饮安排 → 探视管理 → 出院交接
- **数据持久化**：JSON 文件存储，无需额外数据库，开箱即用
- **Docker 一键启动**：前后端编排，健康检查自动拉起

### 角色功能矩阵

| 角色 | 菜单功能 |
|------|---------|
| 👑 管理员 | 数据概览、用户管理、产妇档案、宝宝信息、房型、套餐、合同、费用、排班、任务、访客、餐食、消毒、观察、出院交接 |
| 💼 销售 | 工作台、产妇档案、合同管理、护理套餐、房型管理、费用管理（录入合同/押金/增购） |
| 👩‍⚕️ 护士长 | 护士长工作台、产妇档案、宝宝信息、月嫂排班、护理任务安排（喂养/黄疸/洗澡/产康）、观察记录、交班与出院、消毒管理 |
| 👩‍🍼 月嫂 | 月嫂工作台、我的任务、宝宝护理记录（睡眠/体重/排便/喂奶/黄疸） |
| 🥗 营养师 | 营养师工作台、月子餐管理（调整菜品/营养信息）、产妇档案 |
| 🖥️ 前台 | 前台工作台、访客核验（签入签出）、房态管理、消毒登记、产妇信息 |
| 👨‍👩‍👧 家属 | 家属首页（摘要卡片）、妈妈恢复（时间轴）、宝宝护理（日常结论）、月子餐（餐单+点评）、探视预约、费用明细（大类汇总） |

### 技术栈

**前端**：Vue 3 + Vite 5 + Element Plus 2 + Pinia + Vue Router 4 + Axios + ECharts + Day.js

**后端**：Express 4 + JWT 鉴权 + bcryptjs + Multer + UUID

**部署**：Docker Compose + Nginx + Node 18 Alpine

---

## 启动方式

### 前置要求

| 工具 | 版本要求 | 说明 |
|------|---------|------|
| Node.js | >= 16.x | 本地开发模式需要 |
| npm | >= 8.x | 随 Node.js 自带 |
| Docker | >= 20.10 | Docker 一键启动需要 |
| Docker Compose | >= 2.0 | 随 Docker Desktop 自带 |

---

### 方式一：Docker 一键启动（推荐）

#### 1. 构建并启动

```bash
docker compose up --build
```

后台运行：

```bash
docker compose up --build -d
```

#### 2. 查看服务状态

```bash
docker compose ps
```

查看日志：

```bash
docker compose logs -f
```

#### 3. 停止与清理

```bash
docker compose down
```

清理数据卷（⚠️ 会清空所有数据）：

```bash
docker compose down -v
```

#### 4. 访问地址

- 前端界面：**http://localhost:5173**
- 后端 API：**http://localhost:3000**
- 健康检查：**http://localhost:3000/api/health**

---

### 方式二：本地开发模式

#### 1. 安装依赖

**后端：**

```bash
cd backend
npm install
```

**前端：**

```bash
cd frontend
npm install
```

或在根目录一键安装：

```bash
cd backend && npm install && cd ../frontend && npm install
```

#### 2. 启动后端

```bash
cd backend
npm start
```

后端服务地址：**http://localhost:3000**

启动成功后终端会显示：

```
月子中心管理平台后端服务已启动: http://localhost:3000
```

#### 3. 启动前端

新开启一个终端窗口：

```bash
cd frontend
npm run dev
```

前端开发地址：**http://localhost:5173**

Vite 已配置 `/api` 代理到 `http://localhost:3000`。

#### 4. 生产构建

```bash
cd frontend
npm run build
```

构建产物输出到 `frontend/dist` 目录。

---

## 测试账号

平台预置了 8 个账号，密码均为 `123456`，登录页有快速登录按钮可一键切换：

| 用户名 | 角色 | 说明 |
|-------|------|------|
| `admin` | 系统管理员 | 全部权限，用户管理 |
| `sales01` | 销售 | 合同签约、费用录入 |
| `headnurse` | 护士长 | 排班、任务安排、出院交接 |
| `nurse01` | 月嫂 | 执行任务、记录宝宝护理 |
| `nurse02` | 月嫂 | 二号月嫂，用于排班演示 |
| `nutrition` | 营养师 | 月子餐调整与录入 |
| `reception` | 前台 | 访客核验、消毒登记 |
| `family01` | 家属 | 体验家属端（需先在用户管理中将其 motherIds 绑定到某个产妇档案 ID） |

> 💡 登录页面底部有彩色快速登录按钮，点击即可直接以对应角色登录，免去输入账号密码。

---

## 目录结构

```
wl-339/
├── Dockerfile                           # 根目录：前后端单镜像合并构建入口
├── docker-compose.yml                   # 编排：frontend(5173) + backend(3000)
├── .dockerignore                        # 根目录构建排除项
├── package.json                         # 根目录可选 concurrently 工具
├── README.md                            # 本文档
├── backend/                             # Express 后端
│   ├── Dockerfile
│   ├── .dockerignore
│   ├── app.js                           # 服务入口，注册 16 组路由
│   ├── package.json
│   ├── middleware/
│   │   └── auth.js                      # JWT 鉴权 + 角色校验中间件
│   ├── data/
│   │   ├── initData.js                  # JSON 文件读写工具 + 初始数据注入
│   │   └── db/                          # 运行时 JSON 数据表（自动生成）
│   ├── routes/                          # 16 个路由模块：
│   │   ├── auth.js users.js mothers.js babies.js
│   │   ├── rooms.js packages.js schedules.js tasks.js
│   │   ├── visitors.js meals.js disinfection.js fees.js
│   │   ├── contracts.js observations.js handovers.js family.js
│   └── uploads/                         # 文件上传目录
└── frontend/                            # Vue3 前端
    ├── Dockerfile
    ├── .dockerignore
    ├── nginx.conf                       # Nginx：gzip + /api 反向代理 + SPA fallback
    ├── vite.config.js
    ├── index.html
    ├── package.json
    └── src/
        ├── main.js
        ├── App.vue
        ├── api/index.js                 # 统一 API 封装（17 组接口）
        ├── store/auth.js                # Pinia 用户状态持久化
        ├── utils/request.js             # Axios 拦截器：401 自动登出
        ├── router/index.js              # 7 套角色菜单 + beforeEach 权限守卫
        ├── styles/index.scss            # 全局样式（渐变色卡片、标签等）
        ├── layouts/MainLayout.vue       # 主框架：左侧菜单 + 顶部面包屑
        └── views/
            ├── Login.vue                # 登录页 + 快速登录按钮
            ├── NotFound.vue
            ├── Dashboard.vue             # 通用数据概览
            ├── admin/Users.vue
            ├── common/                   # 共享视图
            │   ├── Mothers.vue Babies.vue Rooms.vue
            │   ├── Packages.vue Observations.vue
            ├── sales/Contracts.vue Fees.vue
            ├── headnurse/               # 护士长视图
            │   ├── Schedules.vue Tasks.vue Handovers.vue
            ├── nurse/                   # 月嫂视图
            │   ├── NurseDashboard.vue NurseTasks.vue ObservationRecord.vue
            ├── nutritionist/Meals.vue
            ├── reception/               # 前台视图
            │   ├── Visitors.vue Disinfection.vue
            └── family/                  # 家属视图（6 个，隐私摘要级）
                ├── FamilyDashboard.vue MotherDetail.vue BabyCare.vue
                ├── FamilyMeals.vue FamilyVisitors.vue FamilyFees.vue
```

---

## API 接口一览

| 模块 | Method | 路径 | 权限 | 说明 |
|------|--------|------|------|------|
| 认证 | POST | `/api/auth/login` | 公开 | 登录获取 Token |
| 认证 | GET | `/api/auth/me` | 已登录 | 获取当前用户信息 |
| 用户 | CRUD | `/api/users/*` | admin | 系统用户管理 |
| 产妇 | CRUD | `/api/mothers/*` | 内部员工+家属(只读关联) | 产妇档案 |
| 宝宝 | CRUD | `/api/babies/*` | 内部员工+家属(只读关联) | 宝宝信息 |
| 房型 | CRUD | `/api/rooms/*` | admin/reception | 房间管理 |
| 套餐 | CRUD | `/api/packages/*` | admin/sales | 护理套餐 |
| 排班 | CRUD | `/api/schedules/*` | admin/head_nurse | 月嫂排班 |
| 任务 | CRUD | `/api/tasks/*` + `/complete` | 护士长安排/月嫂完成 | 护理任务 |
| 访客 | CRUD + checkIn/checkOut | `/api/visitors/*` | 前台+家属 | 探视预约与核验 |
| 餐食 | CRUD | `/api/meals/*` | 营养师+家属(只读) | 月子餐 |
| 消毒 | CRUD | `/api/disinfection/*` | 前台/护士长/月嫂 | 消毒记录 |
| 费用 | CRUD + `/pay` | `/api/fees/*` | 销售+家属(只读汇总) | 费用 |
| 合同 | CRUD | `/api/contracts/*` | 销售+家属(只读关联) | 合同管理 |
| 观察 | CRUD | `/api/observations/*` | 医护+家属(只读结论) | 观察记录 |
| 交接 | CRUD + `/confirm` | `/api/handovers/*` | 护士长 | 内部交班 + 出院 |
| 家属专区 | GET | `/api/family/dashboard` | 家属 | 家属首页聚合数据 |

所有接口均需在 `Authorization` 头携带 `Bearer <token>`（除 `/api/auth/login` 和 `/api/health`）。

---

## 隐私保护设计说明

为了保护产妇隐私和宝宝护理安全，平台在设计上做了严格的分层：

1. **家属端数据隔离**
   - 每个家属账号通过 `motherIds` 数组绑定其有权查看的产妇档案
   - 后端中间件自动过滤，家属只能获取到绑定的产妇及关联宝宝的数据

2. **家属端仅展示结论摘要**
   - 妈妈恢复：显示"恢复良好 / 注意休息"等结论文字，不展示血压、体温等医疗原始数据
   - 宝宝护理：汇总为"今日喂奶 X 次、睡眠 Y 小时、体重稳步增长"，不显示每次喂奶的精确毫升数
   - 费用明细：只列"套餐费、押金、增购服务费"三大类，隐藏内部调价、审批、退款单等流程细节
   - 每个家属页面顶部都有隐私保护提示条

3. **功能模块严格分离**
   - 内部交班（Handovers）模块：仅护士长与管理员可访问
   - 费用变动流程：仅销售与管理员可录入和调整
   - 探视授权审批：仅前台和管理员操作
   - 家属端完全看不到上述三个内部管理流程，仅能通过"已批准 / 待支付"等状态看到最终结果

4. **敏感信息脱敏**
   - 访客身份证号、手机号在列表页默认脱敏显示（中间打 *）
   - 产妇身份证号仅销售和管理员在详情页可见

---

## 常见问题

**Q：家属登录后看不到任何数据怎么办？**
A：先用管理员账号进入【用户管理】，编辑 `family01` 用户，将其 `motherIds` 字段绑定为某个产妇档案的 ID（字符串数组）。或者先在【产妇档案】新增一条档案，再将该 ID 配置给家属账号。

**Q：数据保存在哪里，如何备份？**
A：数据以 JSON 文件形式存储在 `backend/data/db/` 目录下，每个表一个文件。直接复制该整个目录即可完成备份。Docker 模式下已通过 volume 挂载，容器销毁不会丢失数据。

**Q：Docker 启动后前端 502 Bad Gateway？**
A：这是因为后端健康检查还未通过（首次启动需要 10~20 秒）。等待健康检查通过后前端会自动连通。也可以通过 `docker compose logs backend` 查看后端日志。

**Q：如何切换角色体验？**
A：点击右上角头像 → 退出登录 → 在登录页底部点击对应角色的快速登录按钮即可。

---

## 注意事项

1. 本项目使用 JSON 文件存储，适合中小型月子中心或演示场景；大型机构如需接入生产环境，建议将数据层迁移至 PostgreSQL / MySQL
2. 默认 JWT 密钥为演示值，生产部署请修改 `backend/middleware/auth.js` 中的 `SECRET_KEY`
3. 访客签到时系统强制要求确认消毒完成，前台不可跳过
4. 家属预约探视默认需经前台审批后才能入场，不可直接进入
5. 中午 12:00-15:00 与晚间 20:00 后为妈妈休息时段，家属端不可预约该时段的探视
