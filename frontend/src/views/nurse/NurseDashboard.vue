<template>
  <div class="nurse-dashboard">
    <el-row :gutter="20">
      <el-col :xs="24" :sm="8" :md="8" :lg="8">
        <el-card class="stat-card" :style="{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }" shadow="hover">
          <div class="stat-card-content">
            <div class="stat-icon" style="background: rgba(255,255,255,0.2);">
              <el-icon :size="28" color="#ffffff"><List /></el-icon>
            </div>
            <div class="stat-info">
              <div class="stat-value">{{ stats.todayPending }}</div>
              <div class="stat-title">今日待办任务</div>
            </div>
          </div>
        </el-card>
      </el-col>
      <el-col :xs="24" :sm="8" :md="8" :lg="8">
        <el-card class="stat-card" :style="{ background: 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)' }" shadow="hover">
          <div class="stat-card-content">
            <div class="stat-icon" style="background: rgba(255,255,255,0.2);">
              <el-icon :size="28" color="#ffffff"><CircleCheck /></el-icon>
            </div>
            <div class="stat-info">
              <div class="stat-value">{{ stats.todayCompleted }}</div>
              <div class="stat-title">今日已完成</div>
            </div>
          </div>
        </el-card>
      </el-col>
      <el-col :xs="24" :sm="8" :md="8" :lg="8">
        <el-card class="stat-card" :style="{ background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)' }" shadow="hover">
          <div class="stat-card-content">
            <div class="stat-icon" style="background: rgba(255,255,255,0.2);">
              <el-icon :size="28" color="#ffffff"><Avatar /></el-icon>
            </div>
            <div class="stat-info">
              <div class="stat-value">{{ stats.babyCount }}</div>
              <div class="stat-title">负责宝宝数</div>
            </div>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <el-row :gutter="20" style="margin-top: 24px;">
      <el-col :xs="24" :lg="14">
        <el-card shadow="hover">
          <template #header>
            <div class="card-header">
              <span class="header-title">今日任务</span>
              <el-button type="primary" size="small" @click="goToTasks">
                <el-icon><List /></el-icon>
                查看全部
              </el-button>
            </div>
          </template>
          <el-table :data="todayTasks" stripe style="width: 100%" v-loading="loading.tasks" empty-text="暂无今日任务">
            <el-table-column label="类型" width="100">
              <template #default="{ row }">
                <el-tag type="primary" effect="light">{{ taskTypeMap[row.type] || row.type }}</el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="title" label="任务描述" min-width="160" show-overflow-tooltip />
            <el-table-column label="计划时间" width="150">
              <template #default="{ row }">
                {{ formatTime(row.scheduledAt) }}
              </template>
            </el-table-column>
            <el-table-column label="状态" width="100">
              <template #default="{ row }">
                <el-tag :type="taskStatusTagType(row.status)">{{ taskStatusText(row.status) }}</el-tag>
              </template>
            </el-table-column>
            <el-table-column label="操作" width="120" fixed="right">
              <template #default="{ row }">
                <el-button
                  v-if="row.status === 'pending' || row.status === 'scheduled'"
                  type="success"
                  size="small"
                  link
                  @click="handleStartTask(row)"
                >
                  开始执行
                </el-button>
                <el-button
                  v-if="row.status === 'in_progress'"
                  type="primary"
                  size="small"
                  link
                  @click="handleCompleteTask(row)"
                >
                  标记完成
                </el-button>
                <el-tag v-if="row.status === 'completed'" type="success" effect="plain">已完成</el-tag>
              </template>
            </el-table-column>
          </el-table>
        </el-card>
      </el-col>

      <el-col :xs="24" :lg="10">
        <el-card shadow="hover">
          <template #header>
            <div class="card-header">
              <span class="header-title">负责的宝宝</span>
              <el-button type="primary" size="small" @click="goToObservations">
                <el-icon><EditPen /></el-icon>
                快速记录
              </el-button>
            </div>
          </template>
          <div v-loading="loading.babies">
            <div v-if="myBabies.length === 0" class="empty-text">暂无负责的宝宝</div>
            <div v-for="baby in myBabies" :key="baby.id" class="baby-card" @click="quickRecord(baby)">
              <div class="baby-avatar" :style="{ background: getAvatarGradient(baby.id) }">
                <el-icon :size="24" color="#ffffff"><Avatar /></el-icon>
              </div>
              <div class="baby-info">
                <div class="baby-name">{{ baby.name || '宝宝' + (baby.gender === 'male' ? '男' : '女') }}</div>
                <div class="baby-meta">
                  <el-tag size="small" type="info" effect="light">{{ baby.gender === 'male' ? '男宝' : '女宝' }}</el-tag>
                  <span class="baby-age">{{ getBabyAge(baby.birthDate) }}</span>
                </div>
              </div>
              <el-icon class="baby-arrow"><ArrowRight /></el-icon>
            </div>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <el-dialog v-model="resultDialogVisible" title="填写任务结果" width="500px">
      <el-form :model="resultForm" label-width="80px">
        <el-form-item label="任务结果">
          <el-input v-model="resultForm.result" type="textarea" :rows="4" placeholder="请输入任务执行结果..." />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="resultDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="submitTaskResult">提交</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import {
  List,
  CircleCheck,
  Avatar,
  EditPen,
  ArrowRight
} from '@element-plus/icons-vue'
import {
  taskApi,
  babyApi,
  observationApi,
  taskTypeMap,
  motherApi
} from '@/api'
import { useAuthStore } from '@/store/auth'
import dayjs from 'dayjs'

const router = useRouter()
const authStore = useAuthStore()

const loading = reactive({
  tasks: false,
  babies: false
})

const tasks = ref([])
const babies = ref([])
const mothers = ref([])

const stats = reactive({
  todayPending: 0,
  todayCompleted: 0,
  babyCount: 0
})

const myTasks = computed(() => {
  return tasks.value.filter(t => t.assignedTo === authStore.userId || t.assigneeId === authStore.userId)
})

const todayTasks = computed(() => {
  const today = dayjs().format('YYYY-MM-DD')
  return myTasks.value
    .filter(t => {
      const d = dayjs(t.scheduledAt || t.createdAt).format('YYYY-MM-DD')
      return d === today
    })
    .sort((a, b) => new Date(a.scheduledAt || a.createdAt) - new Date(b.scheduledAt || b.createdAt))
})

const myBabies = computed(() => {
  const myMotherIds = new Set()
  myTasks.value.forEach(t => {
    if (t.motherId) myMotherIds.add(t.motherId)
  })
  return babies.value.filter(b => myMotherIds.has(b.motherId) || b.assignedNurseId === authStore.userId)
})

const resultDialogVisible = ref(false)
const currentTaskId = ref(null)
const resultForm = reactive({
  result: ''
})

const fetchTasks = async () => {
  loading.tasks = true
  try {
    const res = await taskApi.list({ assignedTo: authStore.userId })
    tasks.value = res.data?.data || res.data || []
    const today = dayjs().format('YYYY-MM-DD')
    const todayList = tasks.value.filter(t => {
      const d = dayjs(t.scheduledAt || t.createdAt).format('YYYY-MM-DD')
      return d === today && (t.assignedTo === authStore.userId || t.assigneeId === authStore.userId)
    })
    stats.todayPending = todayList.filter(t => t.status !== 'completed').length
    stats.todayCompleted = todayList.filter(t => t.status === 'completed').length
  } finally {
    loading.tasks = false
  }
}

const fetchBabies = async () => {
  loading.babies = true
  try {
    const [babiesRes, mothersRes] = await Promise.all([
      babyApi.list(),
      motherApi.list()
    ])
    babies.value = babiesRes.data?.data || babiesRes.data || []
    mothers.value = mothersRes.data?.data || mothersRes.data || []
    stats.babyCount = myBabies.value.length
  } finally {
    loading.babies = false
  }
}

const goToTasks = () => {
  router.push('/tasks')
}

const goToObservations = () => {
  router.push('/observations')
}

const quickRecord = (baby) => {
  router.push({ path: '/observations', query: { babyId: baby.id } })
}

const handleStartTask = async (row) => {
  try {
    await taskApi.update(row.id, { status: 'in_progress' })
    ElMessage.success('任务已开始执行')
    await fetchTasks()
  } catch (e) {
    console.error(e)
  }
}

const handleCompleteTask = (row) => {
  currentTaskId.value = row.id
  resultForm.result = ''
  resultDialogVisible.value = true
}

const submitTaskResult = async () => {
  if (!resultForm.result.trim()) {
    ElMessage.warning('请填写任务结果')
    return
  }
  try {
    await taskApi.complete(currentTaskId.value, { result: resultForm.result })
    ElMessage.success('任务已完成')
    resultDialogVisible.value = false
    await fetchTasks()
  } catch (e) {
    console.error(e)
  }
}

const formatTime = (d) => {
  if (!d) return '-'
  return dayjs(d).format('HH:mm')
}

const getBabyAge = (birthDate) => {
  if (!birthDate) return '未知天数'
  const days = dayjs().diff(dayjs(birthDate), 'day')
  if (days === 0) return '今天出生'
  return `${days}天`
}

const getAvatarGradient = (id) => {
  const colors = [
    'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
    'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
    'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)',
    'linear-gradient(135deg, #fa709a 0%, #fee140 100%)'
  ]
  let hash = 0
  for (let i = 0; i < (id || '').length; i++) {
    hash = id.charCodeAt(i) + ((hash << 5) - hash)
  }
  return colors[Math.abs(hash) % colors.length]
}

const taskStatusTagType = (s) => {
  const map = { pending: 'warning', scheduled: 'info', in_progress: 'primary', completed: 'success', cancelled: 'danger' }
  return map[s] || 'info'
}

const taskStatusText = (s) => {
  const map = { pending: '待执行', scheduled: '已安排', in_progress: '进行中', completed: '已完成', cancelled: '已取消' }
  return map[s] || s
}

onMounted(() => {
  fetchTasks()
  fetchBabies()
})
</script>

<style lang="scss" scoped>
.nurse-dashboard {
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
      font-size: 28px;
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

  .empty-text {
    text-align: center;
    padding: 40px 0;
    color: #909399;
  }

  .baby-card {
    display: flex;
    align-items: center;
    padding: 14px 12px;
    border-radius: 10px;
    margin-bottom: 10px;
    background: #f8f9fc;
    cursor: pointer;
    transition: all 0.2s;

    &:hover {
      background: #eef1f8;
      transform: translateX(4px);
    }

    &:last-child {
      margin-bottom: 0;
    }

    .baby-avatar {
      width: 48px;
      height: 48px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
    }

    .baby-info {
      flex: 1;
      margin-left: 14px;
      min-width: 0;
    }

    .baby-name {
      font-size: 15px;
      font-weight: 600;
      color: #303133;
      margin-bottom: 4px;
    }

    .baby-meta {
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .baby-age {
      font-size: 12px;
      color: #909399;
    }

    .baby-arrow {
      color: #c0c4cc;
      font-size: 14px;
    }
  }
}
</style>
