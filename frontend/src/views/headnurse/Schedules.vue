<template>
  <div class="schedules-page">
    <el-card shadow="never">
      <div class="toolbar">
        <div class="filters">
          <el-date-picker
            v-model="searchDate"
            type="date"
            placeholder="选择日期查看排班"
            value-format="YYYY-MM-DD"
            style="width: 200px"
            @change="fetchData"
          />
          <el-select v-model="searchForm.nurseId" placeholder="选择月嫂" clearable filterable style="width: 180px" @change="fetchData">
            <el-option v-for="n in nurses" :key="n.id" :label="n.name" :value="n.id" />
          </el-select>
          <el-button @click="clearDateFilter">查看全部</el-button>
        </div>
        <div class="actions">
          <el-button type="primary" @click="handleAdd">
            <el-icon><Plus /></el-icon>
            新增排班
          </el-button>
        </div>
      </div>

      <el-table :data="schedules" stripe style="width: 100%" v-loading="loading">
        <el-table-column label="日期" width="120" sortable :sort-method="sortByDate">
          <template #default="{ row }">
            {{ row.date }}
          </template>
        </el-table-column>
        <el-table-column label="月嫂姓名" width="120">
          <template #default="{ row }">
            {{ getUserName(row.nurseId) }}
          </template>
        </el-table-column>
        <el-table-column label="负责产妇" width="120">
          <template #default="{ row }">
            {{ getMotherName(row.motherId) }}
          </template>
        </el-table-column>
        <el-table-column label="班次" width="100">
          <template #default="{ row }">
            <el-tag :type="shiftTagType(row.shift)">{{ shiftText(row.shift) }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="tasks" label="工作内容" min-width="200" show-overflow-tooltip />
        <el-table-column label="状态" width="100">
          <template #default="{ row }">
            <el-tag :type="statusTagType(row.status)">{{ statusText(row.status) }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="180" fixed="right">
          <template #default="{ row }">
            <el-button link type="primary" size="small" @click="handleEdit(row)">编辑</el-button>
            <el-button link type="danger" size="small" @click="handleDelete(row)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <el-dialog
      v-model="dialogVisible"
      :title="isEdit ? '编辑排班' : '新增排班'"
      width="640px"
      :close-on-click-modal="false"
    >
      <el-form ref="formRef" :model="form" :rules="rules" label-width="100px">
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="日期" prop="date">
              <el-date-picker v-model="form.date" type="date" placeholder="选择日期" value-format="YYYY-MM-DD" style="width: 100%" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="月嫂" prop="nurseId">
              <el-select v-model="form.nurseId" placeholder="请选择月嫂" filterable style="width: 100%">
                <el-option v-for="n in nurses" :key="n.id" :label="n.name" :value="n.id" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="负责产妇" prop="motherId">
              <el-select v-model="form.motherId" placeholder="请选择产妇" filterable clearable style="width: 100%">
                <el-option v-for="m in mothers" :key="m.id" :label="m.name" :value="m.id" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="班次" prop="shift">
              <el-select v-model="form.shift" placeholder="请选择班次" style="width: 100%">
                <el-option label="早班" value="day" />
                <el-option label="中班" value="mid" />
                <el-option label="晚班" value="night" />
                <el-option label="全天" value="full" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="状态" prop="status">
              <el-select v-model="form.status" placeholder="请选择状态" style="width: 100%">
                <el-option label="已安排" value="scheduled" />
                <el-option label="进行中" value="in_progress" />
                <el-option label="已完成" value="completed" />
                <el-option label="已取消" value="cancelled" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="24">
            <el-form-item label="工作内容" prop="tasks">
              <el-input v-model="form.tasks" type="textarea" :rows="3" placeholder="请输入工作内容描述" />
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
import { scheduleApi, motherApi, userApi } from '@/api'
import dayjs from 'dayjs'

const loading = ref(false)
const submitting = ref(false)
const dialogVisible = ref(false)
const isEdit = ref(false)
const formRef = ref(null)
const schedules = ref([])
const mothers = ref([])
const users = ref([])
const searchDate = ref('')

const searchForm = reactive({
  nurseId: ''
})

const form = reactive({
  id: '',
  date: '',
  nurseId: '',
  motherId: '',
  shift: '',
  tasks: '',
  status: 'scheduled'
})

const rules = {
  date: [{ required: true, message: '请选择日期', trigger: 'change' }],
  nurseId: [{ required: true, message: '请选择月嫂', trigger: 'change' }],
  shift: [{ required: true, message: '请选择班次', trigger: 'change' }]
}

const nurses = ref([])

const fetchData = async () => {
  loading.value = true
  try {
    const params = {}
    if (searchDate.value) params.date = searchDate.value
    if (searchForm.nurseId) params.nurseId = searchForm.nurseId
    const res = await scheduleApi.list(params)
    schedules.value = res.data?.data || res.data || []
  } finally {
    loading.value = false
  }
}

const fetchMothers = async () => {
  const res = await motherApi.list()
  mothers.value = res.data?.data || res.data || []
}

const fetchUsers = async () => {
  const res = await userApi.list()
  users.value = res.data?.data || res.data || []
  nurses.value = users.value.filter(u => u.role === 'nurse')
}

const getUserName = (id) => {
  const u = users.value.find(x => x.id === id)
  return u?.name || '-'
}

const getMotherName = (id) => {
  if (!id) return '-'
  const m = mothers.value.find(x => x.id === id)
  return m?.name || '-'
}

const shiftTagType = (s) => {
  const map = { day: 'success', mid: 'warning', night: 'primary', full: 'danger' }
  return map[s] || 'info'
}

const shiftText = (s) => {
  const map = { day: '早班', mid: '中班', night: '晚班', full: '全天' }
  return map[s] || s
}

const statusTagType = (s) => {
  const map = { scheduled: 'warning', in_progress: 'primary', completed: 'success', cancelled: 'danger' }
  return map[s] || 'info'
}

const statusText = (s) => {
  const map = { scheduled: '已安排', in_progress: '进行中', completed: '已完成', cancelled: '已取消' }
  return map[s] || s
}

const sortByDate = (a, b) => {
  return dayjs(a.date).valueOf() - dayjs(b.date).valueOf()
}

const clearDateFilter = () => {
  searchDate.value = ''
  searchForm.nurseId = ''
  fetchData()
}

const resetForm = () => {
  Object.assign(form, {
    id: '',
    date: dayjs().format('YYYY-MM-DD'),
    nurseId: '',
    motherId: '',
    shift: '',
    tasks: '',
    status: 'scheduled'
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

const handleDelete = async (row) => {
  try {
    await ElMessageBox.confirm('确定要删除该排班吗？', '提示', { type: 'warning' })
    await scheduleApi.remove(row.id)
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
      await scheduleApi.update(form.id, { ...form })
      ElMessage.success('更新成功')
    } else {
      await scheduleApi.create({ ...form })
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
  fetchUsers()
})
</script>

<style lang="scss" scoped>
.schedules-page {
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
