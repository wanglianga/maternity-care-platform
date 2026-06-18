import { createRouter, createWebHashHistory } from 'vue-router'
import { useAuthStore } from '@/store/auth'
import MainLayout from '@/layouts/MainLayout.vue'

const ROLE_ROUTES = {
  admin: [
    { path: '/dashboard', name: 'Dashboard', component: () => import('@/views/Dashboard.vue'), meta: { title: '数据概览', icon: 'DataBoard' } },
    { path: '/users', name: 'Users', component: () => import('@/views/admin/Users.vue'), meta: { title: '用户管理', icon: 'User' } },
    { path: '/mothers', name: 'Mothers', component: () => import('@/views/common/Mothers.vue'), meta: { title: '产妇档案', icon: 'Female' } },
    { path: '/babies', name: 'Babies', component: () => import('@/views/common/Babies.vue'), meta: { title: '宝宝信息', icon: 'Avatar' } },
    { path: '/rooms', name: 'Rooms', component: () => import('@/views/common/Rooms.vue'), meta: { title: '房型管理', icon: 'OfficeBuilding' } },
    { path: '/packages', name: 'Packages', component: () => import('@/views/common/Packages.vue'), meta: { title: '护理套餐', icon: 'Present' } },
    { path: '/contracts', name: 'Contracts', component: () => import('@/views/sales/Contracts.vue'), meta: { title: '合同管理', icon: 'Document' } },
    { path: '/fees', name: 'Fees', component: () => import('@/views/sales/Fees.vue'), meta: { title: '费用管理', icon: 'Money' } },
    { path: '/schedules', name: 'Schedules', component: () => import('@/views/headnurse/Schedules.vue'), meta: { title: '月嫂排班', icon: 'Calendar' } },
    { path: '/tasks', name: 'Tasks', component: () => import('@/views/headnurse/Tasks.vue'), meta: { title: '护理任务', icon: 'List' } },
    { path: '/visitors', name: 'Visitors', component: () => import('@/views/reception/Visitors.vue'), meta: { title: '访客管理', icon: 'UserFilled' } },
    { path: '/meals', name: 'Meals', component: () => import('@/views/nutritionist/Meals.vue'), meta: { title: '餐食管理', icon: 'KnifeFork' } },
    { path: '/disinfection', name: 'Disinfection', component: () => import('@/views/reception/Disinfection.vue'), meta: { title: '消毒记录', icon: 'MagicStick' } },
    { path: '/observations', name: 'Observations', component: () => import('@/views/common/Observations.vue'), meta: { title: '观察记录', icon: 'Document' } },
    { path: '/baby-abnormal', name: 'BabyAbnormal', component: () => import('@/views/headnurse/BabyAbnormalManage.vue'), meta: { title: '异常观察管理', icon: 'Warning' } },
    { path: '/handovers', name: 'Handovers', component: () => import('@/views/headnurse/Handovers.vue'), meta: { title: '出院交接', icon: 'SwitchButton' } }
  ],
  sales: [
    { path: '/dashboard', name: 'Dashboard', component: () => import('@/views/Dashboard.vue'), meta: { title: '工作台', icon: 'DataBoard' } },
    { path: '/mothers', name: 'Mothers', component: () => import('@/views/common/Mothers.vue'), meta: { title: '产妇档案', icon: 'Female' } },
    { path: '/contracts', name: 'Contracts', component: () => import('@/views/sales/Contracts.vue'), meta: { title: '合同管理', icon: 'Document' } },
    { path: '/packages', name: 'Packages', component: () => import('@/views/common/Packages.vue'), meta: { title: '护理套餐', icon: 'Present' } },
    { path: '/rooms', name: 'Rooms', component: () => import('@/views/common/Rooms.vue'), meta: { title: '房型管理', icon: 'OfficeBuilding' } },
    { path: '/fees', name: 'Fees', component: () => import('@/views/sales/Fees.vue'), meta: { title: '费用管理', icon: 'Money' } }
  ],
  head_nurse: [
    { path: '/dashboard', name: 'Dashboard', component: () => import('@/views/Dashboard.vue'), meta: { title: '护士长工作台', icon: 'DataBoard' } },
    { path: '/mothers', name: 'Mothers', component: () => import('@/views/common/Mothers.vue'), meta: { title: '产妇档案', icon: 'Female' } },
    { path: '/babies', name: 'Babies', component: () => import('@/views/common/Babies.vue'), meta: { title: '宝宝信息', icon: 'Avatar' } },
    { path: '/schedules', name: 'Schedules', component: () => import('@/views/headnurse/Schedules.vue'), meta: { title: '月嫂排班', icon: 'Calendar' } },
    { path: '/tasks', name: 'Tasks', component: () => import('@/views/headnurse/Tasks.vue'), meta: { title: '护理任务安排', icon: 'List' } },
    { path: '/observations', name: 'Observations', component: () => import('@/views/common/Observations.vue'), meta: { title: '观察记录', icon: 'Document' } },
    { path: '/baby-abnormal', name: 'BabyAbnormal', component: () => import('@/views/headnurse/BabyAbnormalManage.vue'), meta: { title: '异常观察管理', icon: 'Warning' } },
    { path: '/visitors', name: 'Visitors', component: () => import('@/views/headnurse/Visitors.vue'), meta: { title: '特殊探视审批', icon: 'UserFilled' } },
    { path: '/handovers', name: 'Handovers', component: () => import('@/views/headnurse/Handovers.vue'), meta: { title: '交班与出院', icon: 'SwitchButton' } },
    { path: '/disinfection', name: 'Disinfection', component: () => import('@/views/reception/Disinfection.vue'), meta: { title: '消毒管理', icon: 'MagicStick' } }
  ],
  nurse: [
    { path: '/dashboard', name: 'Dashboard', component: () => import('@/views/nurse/NurseDashboard.vue'), meta: { title: '月嫂工作台', icon: 'DataBoard' } },
    { path: '/tasks', name: 'Tasks', component: () => import('@/views/nurse/NurseTasks.vue'), meta: { title: '我的任务', icon: 'List' } },
    { path: '/observations', name: 'Observations', component: () => import('@/views/nurse/ObservationRecord.vue'), meta: { title: '宝宝护理记录', icon: 'Document' } },
    { path: '/baby-abnormal', name: 'BabyAbnormal', component: () => import('@/views/nurse/BabyAbnormalRecord.vue'), meta: { title: '异常观察记录', icon: 'Warning' } }
  ],
  nutritionist: [
    { path: '/dashboard', name: 'Dashboard', component: () => import('@/views/Dashboard.vue'), meta: { title: '营养师工作台', icon: 'DataBoard' } },
    { path: '/meals', name: 'Meals', component: () => import('@/views/nutritionist/Meals.vue'), meta: { title: '月子餐管理', icon: 'KnifeFork' } },
    { path: '/mothers', name: 'Mothers', component: () => import('@/views/common/Mothers.vue'), meta: { title: '产妇档案', icon: 'Female' } }
  ],
  reception: [
    { path: '/dashboard', name: 'Dashboard', component: () => import('@/views/Dashboard.vue'), meta: { title: '前台工作台', icon: 'DataBoard' } },
    { path: '/visitors', name: 'Visitors', component: () => import('@/views/reception/Visitors.vue'), meta: { title: '访客核验', icon: 'UserFilled' } },
    { path: '/rooms', name: 'Rooms', component: () => import('@/views/common/Rooms.vue'), meta: { title: '房态管理', icon: 'OfficeBuilding' } },
    { path: '/disinfection', name: 'Disinfection', component: () => import('@/views/reception/Disinfection.vue'), meta: { title: '消毒登记', icon: 'MagicStick' } },
    { path: '/mothers', name: 'Mothers', component: () => import('@/views/common/Mothers.vue'), meta: { title: '产妇信息', icon: 'Female' } }
  ],
  family: [
    { path: '/dashboard', name: 'Dashboard', component: () => import('@/views/family/FamilyDashboard.vue'), meta: { title: '家属首页', icon: 'HomeFilled' } },
    { path: '/mother-detail', name: 'MotherDetail', component: () => import('@/views/family/MotherDetail.vue'), meta: { title: '妈妈恢复', icon: 'Female' } },
    { path: '/baby-care', name: 'BabyCare', component: () => import('@/views/family/BabyCare.vue'), meta: { title: '宝宝护理', icon: 'Avatar' } },
    { path: '/meals', name: 'Meals', component: () => import('@/views/family/FamilyMeals.vue'), meta: { title: '月子餐', icon: 'KnifeFork' } },
    { path: '/visitors', name: 'Visitors', component: () => import('@/views/family/FamilyVisitors.vue'), meta: { title: '探视预约', icon: 'UserFilled' } },
    { path: '/fees', name: 'Fees', component: () => import('@/views/family/FamilyFees.vue'), meta: { title: '费用明细', icon: 'Money' } }
  ]
}

export const ROLE_NAME_MAP = {
  admin: '系统管理员',
  sales: '销售',
  head_nurse: '护士长',
  nurse: '月嫂',
  nutritionist: '营养师',
  reception: '前台',
  family: '家属'
}

const routes = [
  {
    path: '/login',
    name: 'Login',
    component: () => import('@/views/Login.vue'),
    meta: { requiresAuth: false }
  },
  {
    path: '/',
    component: MainLayout,
    children: [
      { path: '', redirect: '/dashboard' },
      {
        path: '/dashboard',
        name: 'Dashboard',
        component: () => import('@/views/Dashboard.vue'),
        meta: { title: '数据概览' }
      },
      {
        path: '/users',
        name: 'Users',
        component: () => import('@/views/admin/Users.vue'),
        meta: { title: '用户管理' }
      },
      {
        path: '/mothers',
        name: 'Mothers',
        component: () => import('@/views/common/Mothers.vue'),
        meta: { title: '产妇档案' }
      },
      {
        path: '/babies',
        name: 'Babies',
        component: () => import('@/views/common/Babies.vue'),
        meta: { title: '宝宝信息' }
      },
      {
        path: '/rooms',
        name: 'Rooms',
        component: () => import('@/views/common/Rooms.vue'),
        meta: { title: '房型管理' }
      },
      {
        path: '/packages',
        name: 'Packages',
        component: () => import('@/views/common/Packages.vue'),
        meta: { title: '护理套餐' }
      },
      {
        path: '/contracts',
        name: 'Contracts',
        component: () => import('@/views/sales/Contracts.vue'),
        meta: { title: '合同管理' }
      },
      {
        path: '/fees',
        name: 'Fees',
        component: () => import('@/views/sales/Fees.vue'),
        meta: { title: '费用管理' }
      },
      {
        path: '/schedules',
        name: 'Schedules',
        component: () => import('@/views/headnurse/Schedules.vue'),
        meta: { title: '月嫂排班' }
      },
      {
        path: '/tasks',
        name: 'Tasks',
        component: () => import('@/views/headnurse/Tasks.vue'),
        meta: { title: '护理任务' }
      },
      {
        path: '/visitors',
        name: 'Visitors',
        component: () => import('@/views/reception/Visitors.vue'),
        meta: { title: '访客管理' }
      },
      {
        path: '/meals',
        name: 'Meals',
        component: () => import('@/views/nutritionist/Meals.vue'),
        meta: { title: '餐食管理' }
      },
      {
        path: '/disinfection',
        name: 'Disinfection',
        component: () => import('@/views/reception/Disinfection.vue'),
        meta: { title: '消毒记录' }
      },
      {
        path: '/observations',
        name: 'Observations',
        component: () => import('@/views/common/Observations.vue'),
        meta: { title: '观察记录' }
      },
      {
        path: '/baby-abnormal',
        name: 'BabyAbnormal',
        component: () => import('@/views/common/Observations.vue'),
        meta: { title: '异常观察' }
      },
      {
        path: '/handovers',
        name: 'Handovers',
        component: () => import('@/views/headnurse/Handovers.vue'),
        meta: { title: '出院交接' }
      },
      {
        path: '/mother-detail',
        name: 'MotherDetail',
        component: () => import('@/views/family/MotherDetail.vue'),
        meta: { title: '妈妈恢复' }
      },
      {
        path: '/baby-care',
        name: 'BabyCare',
        component: () => import('@/views/family/BabyCare.vue'),
        meta: { title: '宝宝护理' }
      }
    ]
  },
  {
    path: '/:pathMatch(.*)*',
    name: 'NotFound',
    component: () => import('@/views/NotFound.vue')
  }
]

// 护士和家属有单独的Dashboard和其他视图组件
// 动态为family role覆盖路由
const overrideRoutes = (role, routesConfig) => {
  const children = routes[1].children
  routesConfig.forEach(route => {
    const idx = children.findIndex(c => c.path === route.path)
    if (idx !== -1) {
      children[idx].component = route.component
    }
  })
}
// 在 beforeEach 中动态覆盖
export const applyRoleOverrides = (role) => {
  const children = routes[1].children
  const roleRoutes = ROLE_ROUTES[role] || []
  roleRoutes.forEach(route => {
    const idx = children.findIndex(c => c.path === route.path)
    if (idx !== -1) {
      children[idx].component = route.component
    }
  })
}

const router = createRouter({
  history: createWebHashHistory(),
  routes
})

export const getRoleRoutes = (role) => ROLE_ROUTES[role] || []

router.beforeEach((to, from, next) => {
  const authStore = useAuthStore()
  
  if (to.path === '/login') {
    if (authStore.isLoggedIn) {
      applyRoleOverrides(authStore.role)
      return next('/dashboard')
    }
    return next()
  }
  
  if (!authStore.isLoggedIn) {
    return next('/login')
  }
  
  applyRoleOverrides(authStore.role)
  
  const roleRoutes = getRoleRoutes(authStore.role)
  const availablePaths = roleRoutes.map(r => r.path)
  
  if (to.path === '/dashboard' || availablePaths.includes(to.path) || to.path.startsWith('/mother-detail')) {
    next()
  } else if (availablePaths.length > 0) {
    next(availablePaths[0])
  } else {
    next('/login')
  }
})

export default router
export { ROLE_ROUTES }
