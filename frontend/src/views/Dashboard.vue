<template>
  <div class="dashboard">
    <el-row :gutter="20">
      <el-col :xs="12" :sm="8" :md="8" :lg="4" v-for="card in statCards" :key="card.title">
        <el-card class="stat-card" :style="{ background: card.gradient }" shadow="hover">
          <div class="stat-card-content">
            <div class="stat-icon" :style="{ background: card.iconBg }">
              <el-icon :size="28" :color="card.iconColor">
                <component :is="card.icon" />
              </el-icon>
            </div>
            <div class="stat-info">
              <div class="stat-value">{{ card.value }}</div>
              <div class="stat-title">{{ card.title }}</div>
            </div>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <el-row :gutter="20" style="margin-top: 24px;">
      <el-col :span="12">
        <el-card shadow="hover">
          <template #header>
            <div class="card-header">
              <span class="header-title">最近合同</span>
            </div>
          </template>
          <el-table :data="recentContracts" stripe style="width: 100%" v-loading="loading.contracts">
            <el-table-column prop="contractNo" label="合同编号" width="160" />
            <el-table-column label="产妇姓名" width="120">
              <template #default="{ row }">
                {{ getMotherName(row.motherId) }}
              </template>
            </el-table-column>
            <el-table-column label="套餐" min-width="140">
              <template #default="{ row }">
                {{ getPackageName(row.packageId) }}
              </template>
            </el-table-column>
            <el-table-column prop="totalAmount" label="金额" width="120">
              <template #default="{ row }">
                ¥{{ row.totalAmount?.toLocaleString() || 0 }}
              </template>
            </el-table-column>
            <el-table-column label="签订日期" width="160">
              <template #default="{ row }">
                {{ formatDate(row.createdAt) }}
              </template>
            </el-table-column>
            <el-table-column label="状态" width="100">
              <template #default="{ row }">
                <el-tag :type="statusTagType(row.status)">{{ statusText(row.status) }}</el-tag>
              </template>
            </el-table-column>
          </el-table>
        </el-card>
      </el-col>

      <el-col :span="12">
        <el-card shadow="hover">
          <template #header>
            <div class="card-header">
              <span class="header-title">最近任务</span>
            </div>
          </template>
          <el-table :data="recentTasks" stripe style="width: 100%" v-loading="loading.tasks">
            <el-table-column label="任务类型" width="120">
              <template #default="{ row }">
                <el-tag>{{ taskTypeMap[row.type] || row.type }}</el-tag>
              </template>
            </el-table-column>
            <el-table-column label="产妇/宝宝" width="120">
              <template #default="{ row }">
                {{ getMotherName(row.motherId) || '-' }}
              </template>
            </el-table-column>
            <el-table-column prop="title" label="任务描述" min-width="160" show-overflow-tooltip />
            <el-table-column label="执行人" width="100">
              <template #default="{ row }">
                {{ getUserName(row.assigneeId) || '-' }}
              </template>
            </el-table-column>
            <el-table-column label="计划时间" width="160">
              <template #default="{ row }">
                {{ formatDate(row.scheduledAt) }}
              </template>
            </el-table-column>
            <el-table-column label="状态" width="100">
              <template #default="{ row }">
                <el-tag :type="taskStatusTagType(row.status)">{{ taskStatusText(row.status) }}</el-tag>
              </template>
            </el-table-column>
          </el-table>
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import {
  User,
  Star,
  House,
  List,
  View,
  Money
} from '@element-plus/icons-vue'
import {
  motherApi,
  babyApi,
  roomApi,
  taskApi,
  visitorApi,
  contractApi,
  taskTypeMap
} from '@/api'
import dayjs from 'dayjs'

const loading = reactive({
  mothers: false,
  babies: false,
  rooms: false,
  tasks: false,
  visitors: false,
  contracts: false
})

const mothers = ref([])
const babies = ref([])
const rooms = ref([])
const tasks = ref([])
const visitors = ref([])
const contracts = ref([])

const stats = reactive({
  activeMothers: 0,
  totalBabies: 0,
  emptyRooms: 0,
  todayTasks: 0,
  todayVisitors: 0,
  monthIncome: 0
})

const statCards = computed(() => [
  {
    title: '在住产妇数',
    value: stats.activeMothers,
    icon: User,
    gradient: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    iconBg: 'rgba(255,255,255,0.2)',
    iconColor: '#ffffff'
  },
  {
    title: '宝宝总数',
    value: stats.totalBabies,
    icon: Star,
    gradient: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
    iconBg: 'rgba(255,255,255,0.2)',
    iconColor: '#ffffff'
  },
  {
    title: '空房数',
    value: stats.emptyRooms,
    icon: House,
    gradient: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
    iconBg: 'rgba(255,255,255,0.2)',
    iconColor: '#ffffff'
  },
  {
    title: '今日待办',
    value: stats.todayTasks,
    icon: List,
    gradient: 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)',
    iconBg: 'rgba(255,255,255,0.2)',
    iconColor: '#ffffff'
  },
  {
    title: '今日访客',
    value: stats.todayVisitors,
    icon: View,
    gradient: 'linear-gradient(135deg, #fa709a 0%, #fee140 100%)',
    iconBg: 'rgba(255,255,255,0.2)',
    iconColor: '#ffffff'
  },
  {
    title: '本月收入',
    value: '¥' + stats.monthIncome.toLocaleString(),
    icon: Money,
    gradient: 'linear-gradient(135deg, #30cfd0 0%, #330867 100%)',
    iconBg: 'rgba(255,255,255,0.2)',
    iconColor: '#ffffff'
  }
])

const recentContracts = computed(() => {
  return [...contracts.value]
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
    .slice(0, 6)
})

const recentTasks = computed(() => {
  return [...tasks.value]
    .sort((a, b) => new Date(b.scheduledAt || b.createdAt) - new Date(a.scheduledAt || a.createdAt))
    .slice(0, 6)
})

const fetchMothers = async () => {
  loading.mothers = true
  try {
    const res = await motherApi.list()
    mothers.value = res.data?.data || res.data || []
    stats.activeMothers = mothers.value.filter(m => m.status === 'active').length
  } finally {
    loading.mothers = false
  }
}

const fetchBabies = async () => {
  loading.babies = true
  try {
    const res = await babyApi.list()
    babies.value = res.data?.data || res.data || []
    stats.totalBabies = babies.value.length
  } finally {
    loading.babies = false
  }
}

const fetchRooms = async () => {
  loading.rooms = true
  try {
    const res = await roomApi.list()
    rooms.value = res.data?.data || res.data || []
    stats.emptyRooms = rooms.value.filter(r => r.status === 'empty').length
  } finally {
    loading.rooms = false
  }
}

const fetchTasks = async () => {
  loading.tasks = true
  try {
    const res = await taskApi.list()
    tasks.value = res.data?.data || res.data || []
    const today = dayjs().format('YYYY-MM-DD')
    stats.todayTasks = tasks.value.filter(t => {
      const d = dayjs(t.scheduledAt || t.createdAt).format('YYYY-MM-DD')
      return d === today && t.status !== 'completed'
    }).length
  } finally {
    loading.tasks = false
  }
}

const fetchVisitors = async () => {
  loading.visitors = true
  try {
    const res = await visitorApi.list()
    visitors.value = res.data?.data || res.data || []
    const today = dayjs().format('YYYY-MM-DD')
    stats.todayVisitors = visitors.value.filter(v => {
      const d = dayjs(v.visitDate || v.createdAt).format('YYYY-MM-DD')
      return d === today
    }).length
  } finally {
    loading.visitors = false
  }
}

const fetchContracts = async () => {
  loading.contracts = true
  try {
    const res = await contractApi.list()
    contracts.value = res.data?.data || res.data || []
    const now = dayjs()
    stats.monthIncome = contracts.value
      .filter(c => {
        const d = dayjs(c.createdAt)
        return d.month() === now.month() && d.year() === now.year() && c.status === 'active'
      })
      .reduce((sum, c) => sum + (Number(c.totalAmount) || 0), 0)
  } finally {
    loading.contracts = false
  }
}

const getMotherName = (id) => {
  const m = mothers.value.find(x => x.id === id)
  return m?.name || ''
}

const getPackageName = (id) => {
  const packages = contracts.value.map(c => c.packageId ? { id: c.packageId, name: c.packageName || '套餐' + id?.slice(0, 4) } : []).flat()
  const p = packages.find(x => x.id === id)
  return p?.name || (id ? '套餐' : '-')
}

const getUserName = (id) => {
  return id ? '工作人员' : ''
}

const formatDate = (d) => {
  if (!d) return '-'
  return dayjs(d).format('YYYY-MM-DD HH:mm')
}

const statusTagType = (s) => {
  const map = { active: 'success', expired: 'danger', pending: 'warning' }
  return map[s] || 'info'
}

const statusText = (s) => {
  const map = { active: '执行中', expired: '已结束', pending: '待确认' }
  return map[s] || s
}

const taskStatusTagType = (s) => {
  const map = { pending: 'warning', in_progress: 'primary', completed: 'success', cancelled: 'danger' }
  return map[s] || 'info'
}

const taskStatusText = (s) => {
  const map = { pending: '待开始', in_progress: '进行中', completed: '已完成', cancelled: '已取消' }
  return map[s] || s
}

onMounted(() => {
  fetchMothers()
  fetchBabies()
  fetchRooms()
  fetchTasks()
  fetchVisitors()
  fetchContracts()
})
</script>

<style lang="scss" scoped>
.dashboard {
  padding: 20px;

  .stat-card {
    border: none;
    color: #fff;
    margin-bottom: 20px;
    border-radius: 12px;

    :deep(.el-card__body) {
      padding: 20px;
    }

    .stat-card-content {
      display: flex;
      align-items: center;
      gap: 16px;
    }

    .stat-icon {
      width: 56px;
      height: 56px;
      border-radius: 12px;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
    }

    .stat-info {
      flex: 1;
      min-width: 0;
    }

    .stat-value {
      font-size: 26px;
      font-weight: 700;
      line-height: 1.2;
      margin-bottom: 4px;
    }

    .stat-title {
      font-size: 13px;
      opacity: 0.9;
    }
  }

  .card-header {
    display: flex;
    justify-content: space-between;
    align-items: center;

    .header-title {
      font-weight: 600;
      font-size: 15px;
    }
  }
}
</style>
