<template>
  <div class="nurse-tasks">
    <el-card shadow="never">
      <template #header>
        <div class="card-header">
          <span class="header-title">我的任务</span>
        </div>
      </template>

      <div class="filter-bar">
        <el-radio-group v-model="statusFilter" @change="handleFilterChange">
          <el-radio-button value="">全部</el-radio-button>
          <el-radio-button value="pending">待执行</el-radio-button>
          <el-radio-button value="scheduled">已安排</el-radio-button>
          <el-radio-button value="in_progress">进行中</el-radio-button>
          <el-radio-button value="completed">已完成</el-radio-button>
        </el-radio-group>
      </div>

      <el-table
        :data="filteredTasks"
        stripe
        style="width: 100%"
        v-loading="loading"
        empty-text="暂无任务"
      >
        <el-table-column label="类型" width="120">
          <template #default="{ row }">
            <el-tag type="primary" effect="light">{{ taskTypeMap[row.type] || row.type }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="产妇/宝宝" width="140">
          <template #default="{ row }">
            <div class="target-info">
              <span v-if="getMotherName(row.motherId)" class="mother-name">{{ getMotherName(row.motherId) }}</span>
              <span v-if="getBabyName(row.babyId)" class="baby-name">
                <el-icon><Avatar /></el-icon>{{ getBabyName(row.babyId) }}
              </span>
              <span v-if="!row.motherId && !row.babyId" class="empty-target">-</span>
            </div>
          </template>
        </el-table-column>
        <el-table-column prop="title" label="任务描述" min-width="200" show-overflow-tooltip />
        <el-table-column label="计划时间" width="170">
          <template #default="{ row }">
            {{ formatDateTime(row.scheduledAt) }}
          </template>
        </el-table-column>
        <el-table-column label="状态" width="100">
          <template #default="{ row }">
            <el-tag :type="taskStatusTagType(row.status)">{{ taskStatusText(row.status) }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="结果" min-width="160" show-overflow-tooltip>
          <template #default="{ row }">
            <span v-if="row.result" class="result-text">{{ row.result }}</span>
            <span v-else class="no-result">-</span>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="260" fixed="right">
          <template #default="{ row }">
            <el-button
              v-if="row.status === 'pending' || row.status === 'scheduled'"
              type="success"
              size="small"
              @click="handleStart(row)"
            >
              开始执行
            </el-button>
            <el-button
              v-if="row.status === 'in_progress'"
              type="primary"
              size="small"
              @click="handleComplete(row)"
            >
              标记完成
            </el-button>
            <el-button
              v-if="row.status === 'in_progress' || row.status === 'completed'"
              size="small"
              @click="handleFillResult(row)"
            >
              {{ row.result ? '编辑结果' : '填写结果' }}
            </el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <el-dialog v-model="resultDialogVisible" title="填写任务结果" width="560px">
      <el-form :model="resultForm" label-width="90px">
        <el-form-item label="任务类型">
          <el-tag type="primary" effect="light">{{ taskTypeMap[currentTask?.type] || currentTask?.type }}</el-tag>
        </el-form-item>
        <el-form-item label="任务描述">
          <span>{{ currentTask?.title || '-' }}</span>
        </el-form-item>
        <el-form-item label="执行结果" prop="result">
          <el-input
            v-model="resultForm.result"
            type="textarea"
            :rows="5"
            placeholder="请详细描述任务执行结果、情况说明等..."
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="resultDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="submitResult">保存</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Avatar } from '@element-plus/icons-vue'
import {
  taskApi,
  taskTypeMap,
  motherApi,
  babyApi
} from '@/api'
import { useAuthStore } from '@/store/auth'
import dayjs from 'dayjs'

const authStore = useAuthStore()

const loading = ref(false)
const tasks = ref([])
const mothers = ref([])
const babies = ref([])
const statusFilter = ref('')

const resultDialogVisible = ref(false)
const currentTask = ref(null)
const resultForm = reactive({
  result: ''
})

const filteredTasks = computed(() => {
  let list = tasks.value.filter(t => t.assignedTo === authStore.userId || t.assigneeId === authStore.userId)
  if (statusFilter.value) {
    list = list.filter(t => t.status === statusFilter.value)
  }
  return list.sort((a, b) => new Date(b.scheduledAt || b.createdAt) - new Date(a.scheduledAt || a.createdAt))
})

const fetchData = async () => {
  loading.value = true
  try {
    const [tasksRes, mothersRes, babiesRes] = await Promise.all([
      taskApi.list({ assignedTo: authStore.userId }),
      motherApi.list(),
      babyApi.list()
    ])
    tasks.value = tasksRes.data?.data || tasksRes.data || []
    mothers.value = mothersRes.data?.data || mothersRes.data || []
    babies.value = babiesRes.data?.data || babiesRes.data || []
  } finally {
    loading.value = false
  }
}

const handleFilterChange = () => {
}

const getMotherName = (id) => {
  if (!id) return ''
  const m = mothers.value.find(x => x.id === id)
  return m?.name || ''
}

const getBabyName = (id) => {
  if (!id) return ''
  const b = babies.value.find(x => x.id === id)
  return b?.name || (b?.gender === 'male' ? '男宝' : '女宝')
}

const formatDateTime = (d) => {
  if (!d) return '-'
  return dayjs(d).format('YYYY-MM-DD HH:mm')
}

const taskStatusTagType = (s) => {
  const map = { pending: 'warning', scheduled: 'info', in_progress: 'primary', completed: 'success', cancelled: 'danger' }
  return map[s] || 'info'
}

const taskStatusText = (s) => {
  const map = { pending: '待执行', scheduled: '已安排', in_progress: '进行中', completed: '已完成', cancelled: '已取消' }
  return map[s] || s
}

const handleStart = async (row) => {
  try {
    await ElMessageBox.confirm('确定开始执行该任务吗？', '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'info'
    })
    await taskApi.update(row.id, { status: 'in_progress' })
    ElMessage.success('任务已开始执行')
    await fetchData()
  } catch (e) {
    if (e !== 'cancel') console.error(e)
  }
}

const handleComplete = (row) => {
  currentTask.value = row
  resultForm.result = row.result || ''
  resultDialogVisible.value = true
}

const handleFillResult = (row) => {
  currentTask.value = row
  resultForm.result = row.result || ''
  resultDialogVisible.value = true
}

const submitResult = async () => {
  if (!resultForm.result.trim()) {
    ElMessage.warning('请填写任务执行结果')
    return
  }
  try {
    if (currentTask.value.status !== 'completed') {
      await taskApi.complete(currentTask.value.id, { result: resultForm.result })
    } else {
      await taskApi.update(currentTask.value.id, { result: resultForm.result })
    }
    ElMessage.success('结果保存成功')
    resultDialogVisible.value = false
    await fetchData()
  } catch (e) {
    console.error(e)
  }
}

onMounted(() => {
  fetchData()
})
</script>

<style lang="scss" scoped>
.nurse-tasks {
  padding: 20px;

  .card-header {
    .header-title {
      font-weight: 600;
      font-size: 16px;
    }
  }

  .filter-bar {
    margin-bottom: 20px;
  }

  .target-info {
    display: flex;
    flex-direction: column;
    gap: 2px;

    .mother-name {
      font-size: 14px;
      color: #303133;
      font-weight: 500;
    }

    .baby-name {
      display: flex;
      align-items: center;
      gap: 4px;
      font-size: 12px;
      color: #909399;

      .el-icon {
        font-size: 12px;
      }
    }

    .empty-target {
      color: #c0c4cc;
    }
  }

  .result-text {
    color: #606266;
    font-size: 13px;
    line-height: 1.5;
  }

  .no-result {
    color: #c0c4cc;
  }
}
</style>
