<template>
  <div class="tasks-page">
    <el-card shadow="never">
      <div class="toolbar">
        <div class="filters">
          <el-select v-model="searchForm.type" placeholder="任务类型" clearable style="width: 160px" @change="fetchData">
            <el-option label="喂奶" value="feeding" />
            <el-option label="黄疸检测" value="jaundice" />
            <el-option label="洗澡" value="bath" />
            <el-option label="产康项目" value="postnatal_care" />
            <el-option label="医生巡诊" value="doctor_visit" />
            <el-option label="催乳服务" value="lactation" />
          </el-select>
          <el-select v-model="searchForm.status" placeholder="状态" clearable style="width: 160px" @change="fetchData">
            <el-option label="待执行" value="pending" />
            <el-option label="已安排" value="scheduled" />
            <el-option label="进行中" value="in_progress" />
            <el-option label="已完成" value="completed" />
            <el-option label="已取消" value="cancelled" />
          </el-select>
          <el-select v-model="searchForm.assignedTo" placeholder="负责人" clearable filterable style="width: 180px" @change="fetchData">
            <el-option v-for="n in nurses" :key="n.id" :label="n.name" :value="n.id" />
          </el-select>
          <el-button @click="resetSearch">重置</el-button>
        </div>
        <div class="actions">
          <el-button type="primary" @click="handleAdd">
            <el-icon><Plus /></el-icon>
            新增任务
          </el-button>
        </div>
      </div>

      <el-table :data="tasks" stripe style="width: 100%" v-loading="loading">
        <el-table-column label="任务类型" width="120">
          <template #default="{ row }">
            <el-tag :type="typeTagType(row.type)">{{ typeText(row.type) }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="产妇/宝宝" width="180">
          <template #default="{ row }">
            <div>
              <div v-if="row.motherId">产妇：{{ getMotherName(row.motherId) }}</div>
              <div v-if="row.babyId">宝宝：{{ getBabyName(row.babyId) }}</div>
              <div v-if="!row.motherId && !row.babyId">-</div>
            </div>
          </template>
        </el-table-column>
        <el-table-column label="负责人" width="100">
          <template #default="{ row }">
            {{ getUserName(row.assignedTo) }}
          </template>
        </el-table-column>
        <el-table-column label="计划时间" width="160">
          <template #default="{ row }">
            {{ formatDateTime(row.scheduledTime) }}
          </template>
        </el-table-column>
        <el-table-column label="优先级" width="90">
          <template #default="{ row }">
            <el-tag :type="priorityTagType(row.priority)">{{ priorityText(row.priority) }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="状态" width="100">
          <template #default="{ row }">
            <el-tag :type="statusTagType(row.status)">{{ statusText(row.status) }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="description" label="备注" min-width="180" show-overflow-tooltip />
        <el-table-column label="操作" width="200" fixed="right">
          <template #default="{ row }">
            <el-button v-if="row.status !== 'completed' && row.status !== 'cancelled'" link type="success" size="small" @click="handleComplete(row)">完成</el-button>
            <el-button link type="primary" size="small" @click="handleEdit(row)">编辑</el-button>
            <el-button link type="danger" size="small" @click="handleDelete(row)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <el-dialog
      v-model="dialogVisible"
      :title="isEdit ? '编辑任务' : '新增任务'"
      width="720px"
      :close-on-click-modal="false"
    >
      <el-form ref="formRef" :model="form" :rules="rules" label-width="100px">
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="任务类型" prop="type">
              <el-select v-model="form.type" placeholder="请选择类型" style="width: 100%">
                <el-option label="喂奶" value="feeding" />
                <el-option label="黄疸检测" value="jaundice" />
                <el-option label="洗澡" value="bath" />
                <el-option label="产康项目" value="postnatal_care" />
                <el-option label="医生巡诊" value="doctor_visit" />
                <el-option label="催乳服务" value="lactation" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="优先级" prop="priority">
              <el-select v-model="form.priority" placeholder="请选择优先级" style="width: 100%">
                <el-option label="高" value="high" />
                <el-option label="中" value="medium" />
                <el-option label="低" value="low" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="产妇" prop="motherId">
              <el-select v-model="form.motherId" placeholder="请选择产妇" filterable clearable style="width: 100%">
                <el-option v-for="m in mothers" :key="m.id" :label="m.name" :value="m.id" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="宝宝" prop="babyId">
              <el-select v-model="form.babyId" placeholder="请选择宝宝" filterable clearable style="width: 100%">
                <el-option v-for="b in babies" :key="b.id" :label="b.name || ('宝宝-' + (b.id || '').slice(0, 4))" :value="b.id" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="负责人" prop="assignedTo">
              <el-select v-model="form.assignedTo" placeholder="请选择负责人" filterable style="width: 100%">
                <el-option v-for="n in nurses" :key="n.id" :label="n.name" :value="n.id" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="计划时间" prop="scheduledTime">
              <el-date-picker
                v-model="form.scheduledTime"
                type="datetime"
                placeholder="选择时间"
                value-format="YYYY-MM-DD HH:mm:ss"
                style="width: 100%"
              />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="状态" prop="status">
              <el-select v-model="form.status" placeholder="请选择状态" style="width: 100%">
                <el-option label="待执行" value="pending" />
                <el-option label="已安排" value="scheduled" />
                <el-option label="进行中" value="in_progress" />
                <el-option label="已完成" value="completed" />
                <el-option label="已取消" value="cancelled" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="24">
            <el-form-item label="任务描述" prop="description">
              <el-input v-model="form.description" type="textarea" :rows="3" placeholder="请输入任务描述" />
            </el-form-item>
          </el-col>
        </el-row>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="submitting" @click="handleSubmit">确定</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Plus } from '@element-plus/icons-vue'
import { taskApi, motherApi, babyApi, userApi } from '@/api'
import dayjs from 'dayjs'

const loading = ref(false)
const submitting = ref(false)
const dialogVisible = ref(false)
const isEdit = ref(false)
const formRef = ref(null)
const tasks = ref([])
const mothers = ref([])
const babies = ref([])
const users = ref([])
const nurses = ref([])

const searchForm = reactive({
  type: '',
  status: '',
  assignedTo: ''
})

const form = reactive({
  id: '',
  type: '',
  motherId: '',
  babyId: '',
  assignedTo: '',
  scheduledTime: '',
  description: '',
  priority: 'medium',
  status: 'pending'
})

const rules = {
  type: [{ required: true, message: '请选择任务类型', trigger: 'change' }],
  assignedTo: [{ required: true, message: '请选择负责人', trigger: 'change' }],
  scheduledTime: [{ required: true, message: '请选择计划时间', trigger: 'change' }],
  priority: [{ required: true, message: '请选择优先级', trigger: 'change' }]
}

const fetchData = async () => {
  loading.value = true
  try {
    const params = {}
    if (searchForm.type) params.type = searchForm.type
    if (searchForm.status) params.status = searchForm.status
    if (searchForm.assignedTo) params.assignedTo = searchForm.assignedTo
    const res = await taskApi.list(params)
    tasks.value = res.data?.data || res.data || []
  } finally {
    loading.value = false
  }
}

const fetchMothers = async () => {
  const res = await motherApi.list()
  mothers.value = res.data?.data || res.data || []
}

const fetchBabies = async () => {
  const res = await babyApi.list()
  babies.value = res.data?.data || res.data || []
}

const fetchUsers = async () => {
  const res = await userApi.list()
  users.value = res.data?.data || res.data || []
  nurses.value = users.value.filter(u => u.role === 'nurse' || u.role === 'head_nurse')
}

const getUserName = (id) => {
  const u = users.value.find(x => x.id === id)
  return u?.name || '-'
}

const getMotherName = (id) => {
  if (!id) return ''
  const m = mothers.value.find(x => x.id === id)
  return m?.name || '-'
}

const getBabyName = (id) => {
  if (!id) return ''
  const b = babies.value.find(x => x.id === id)
  return b?.name || ('宝宝-' + (id || '').slice(0, 4))
}

const formatDateTime = (d) => {
  if (!d) return '-'
  return dayjs(d).format('YYYY-MM-DD HH:mm')
}

const typeTagType = (t) => {
  const map = {
    feeding: 'success',
    jaundice: 'warning',
    bath: 'primary',
    postnatal_care: 'danger',
    doctor_visit: 'info',
    lactation: ''
  }
  return map[t] || 'info'
}

const typeText = (t) => {
  const map = {
    feeding: '喂奶',
    jaundice: '黄疸检测',
    bath: '洗澡',
    postnatal_care: '产康项目',
    doctor_visit: '医生巡诊',
    lactation: '催乳服务'
  }
  return map[t] || t
}

const priorityTagType = (p) => {
  const map = { high: 'danger', medium: 'warning', low: 'info' }
  return map[p] || 'info'
}

const priorityText = (p) => {
  const map = { high: '高', medium: '中', low: '低' }
  return map[p] || p
}

const statusTagType = (s) => {
  const map = {
    pending: 'warning',
    scheduled: 'primary',
    in_progress: '',
    completed: 'success',
    cancelled: 'danger'
  }
  return map[s] || 'info'
}

const statusText = (s) => {
  const map = {
    pending: '待执行',
    scheduled: '已安排',
    in_progress: '进行中',
    completed: '已完成',
    cancelled: '已取消'
  }
  return map[s] || s
}

const resetSearch = () => {
  searchForm.type = ''
  searchForm.status = ''
  searchForm.assignedTo = ''
  fetchData()
}

const resetForm = () => {
  Object.assign(form, {
    id: '',
    type: '',
    motherId: '',
    babyId: '',
    assignedTo: '',
    scheduledTime: dayjs().add(1, 'hour').format('YYYY-MM-DD HH:mm:ss'),
    description: '',
    priority: 'medium',
    status: 'pending'
  })
}

const handleAdd = () => {
  isEdit.value = false
  resetForm()
  dialogVisible.value = true
}

const handleEdit = (row) => {
  isEdit.value = true
  Object.assign(form, row)
  dialogVisible.value = true
}

const handleComplete = async (row) => {
  try {
    await ElMessageBox.confirm('确定标记该任务为已完成吗？', '提示', { type: 'warning' })
    await taskApi.complete(row.id, { result: '已完成' })
    ElMessage.success('任务已完成')
    fetchData()
  } catch (e) {
    if (e !== 'cancel') console.error(e)
  }
}

const handleDelete = async (row) => {
  try {
    await ElMessageBox.confirm('确定要删除该任务吗？', '提示', { type: 'warning' })
    await taskApi.remove(row.id)
    ElMessage.success('删除成功')
    fetchData()
  } catch (e) {
    if (e !== 'cancel') console.error(e)
  }
}

const handleSubmit = async () => {
  try {
    await formRef.value.validate()
  } catch { return }

  submitting.value = true
  try {
    if (isEdit.value) {
      await taskApi.update(form.id, { ...form })
      ElMessage.success('更新成功')
    } else {
      await taskApi.create({ ...form })
      ElMessage.success('创建成功')
    }
    dialogVisible.value = false
    fetchData()
  } catch (e) {
    ElMessage.error(e?.response?.data?.error || '操作失败')
  } finally {
    submitting.value = false
  }
}

onMounted(() => {
  fetchData()
  fetchMothers()
  fetchBabies()
  fetchUsers()
})
</script>

<style lang="scss" scoped>
.tasks-page {
  padding: 20px;

  .toolbar {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 20px;
    flex-wrap: wrap;
    gap: 12px;

    .filters {
      display: flex;
      gap: 12px;
      flex-wrap: wrap;
    }
  }
}
</style>
