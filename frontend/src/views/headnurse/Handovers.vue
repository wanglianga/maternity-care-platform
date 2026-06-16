<template>
  <div class="handovers-page">
    <el-card shadow="never">
      <div class="toolbar">
        <div class="filters">
          <el-select v-model="searchForm.type" placeholder="交接类型" clearable style="width: 160px" @change="fetchData">
            <el-option label="内部班次" value="shift" />
            <el-option label="出院交接" value="discharge" />
          </el-select>
          <el-select v-model="searchForm.status" placeholder="状态" clearable style="width: 160px" @change="fetchData">
            <el-option label="待交接" value="pending" />
            <el-option label="交接中" value="in_progress" />
            <el-option label="已完成" value="completed" />
          </el-select>
          <el-button @click="resetSearch">重置</el-button>
        </div>
        <div class="actions">
          <el-button type="primary" @click="handleAdd">
            <el-icon><Plus /></el-icon>
            新增交接
          </el-button>
        </div>
      </div>

      <el-table :data="handovers" stripe style="width: 100%" v-loading="loading">
        <el-table-column label="类型" width="120">
          <template #default="{ row }">
            <el-tag :type="typeTagType(row.type)">{{ typeText(row.type) }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="产妇" width="120">
          <template #default="{ row }">
            {{ getMotherName(row.motherId) }}
          </template>
        </el-table-column>
        <el-table-column label="交班人" width="100">
          <template #default="{ row }">
            {{ getUserName(row.fromUserId) }}
          </template>
        </el-table-column>
        <el-table-column label="接班人" width="100">
          <template #default="{ row }">
            {{ getUserName(row.toUserId) }}
          </template>
        </el-table-column>
        <el-table-column label="交接时间" width="160">
          <template #default="{ row }">
            {{ formatDateTime(row.handoverTime) }}
          </template>
        </el-table-column>
        <el-table-column label="状态" width="100">
          <template #default="{ row }">
            <el-tag :type="statusTagType(row.status)">{{ statusText(row.status) }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="交接事项摘要" min-width="200" show-overflow-tooltip>
          <template #default="{ row }">
            {{ formatItemsSummary(row.items) }}
          </template>
        </el-table-column>
        <el-table-column label="操作" width="220" fixed="right">
          <template #default="{ row }">
            <el-button v-if="row.status !== 'completed'" link type="success" size="small" @click="handleConfirm(row)">确认交接</el-button>
            <el-button link type="primary" size="small" @click="handleDetail(row)">详情</el-button>
            <el-button link type="danger" size="small" @click="handleDelete(row)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <el-dialog
      v-model="dialogVisible"
      :title="isEdit ? '编辑交接' : '新增交接'"
      width="720px"
      :close-on-click-modal="false"
    >
      <el-form ref="formRef" :model="form" :rules="rules" label-width="100px">
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="类型" prop="type">
              <el-select v-model="form.type" placeholder="请选择类型" style="width: 100%">
                <el-option label="内部班次" value="shift" />
                <el-option label="出院交接" value="discharge" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="产妇" prop="motherId">
              <el-select v-model="form.motherId" placeholder="请选择产妇" filterable style="width: 100%">
                <el-option v-for="m in mothers" :key="m.id" :label="m.name" :value="m.id" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="交班人" prop="fromUserId">
              <el-select v-model="form.fromUserId" placeholder="请选择交班人" filterable style="width: 100%">
                <el-option v-for="u in staffUsers" :key="u.id" :label="u.name" :value="u.id" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="接班人" prop="toUserId">
              <el-select v-model="form.toUserId" placeholder="请选择接班人" filterable style="width: 100%">
                <el-option v-for="u in staffUsers" :key="u.id" :label="u.name" :value="u.id" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="交接时间" prop="handoverTime">
              <el-date-picker
                v-model="form.handoverTime"
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
                <el-option label="待交接" value="pending" />
                <el-option label="交接中" value="in_progress" />
                <el-option label="已完成" value="completed" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="24">
            <el-form-item label="交接事项" prop="items">
              <div class="items-wrapper">
                <div v-for="(item, idx) in form.itemsList" :key="idx" class="item-row">
                  <el-input v-model="item.name" placeholder="事项名称" style="flex: 1; margin-right: 8px;" />
                  <el-select v-model="item.status" placeholder="状态" style="width: 120px; margin-right: 8px;">
                    <el-option label="未完成" value="pending" />
                    <el-option label="进行中" value="in_progress" />
                    <el-option label="已完成" value="done" />
                  </el-select>
                  <el-button type="danger" link @click="removeItem(idx)">移除</el-button>
                </div>
                <el-button type="primary" plain size="small" @click="addItem">
                  <el-icon><Plus /></el-icon>
                  添加事项
                </el-button>
              </div>
            </el-form-item>
          </el-col>
          <el-col :span="24">
            <el-form-item label="备注" prop="notes">
              <el-input v-model="form.notes" type="textarea" :rows="3" placeholder="请输入备注" />
            </el-form-item>
          </el-col>
        </el-row>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="submitting" @click="handleSubmit">确定</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="detailVisible" title="交接详情" width="640px">
      <el-descriptions :column="1" border v-if="currentDetail">
        <el-descriptions-item label="类型">{{ typeText(currentDetail.type) }}</el-descriptions-item>
        <el-descriptions-item label="产妇">{{ getMotherName(currentDetail.motherId) }}</el-descriptions-item>
        <el-descriptions-item label="交班人">{{ getUserName(currentDetail.fromUserId) }}</el-descriptions-item>
        <el-descriptions-item label="接班人">{{ getUserName(currentDetail.toUserId) }}</el-descriptions-item>
        <el-descriptions-item label="交接时间">{{ formatDateTime(currentDetail.handoverTime) }}</el-descriptions-item>
        <el-descriptions-item label="状态">
          <el-tag :type="statusTagType(currentDetail.status)">{{ statusText(currentDetail.status) }}</el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="交接事项">
          <div v-if="currentDetail.items && currentDetail.items.length">
            <div v-for="(item, idx) in currentDetail.items" :key="idx" class="detail-item">
              <span class="item-name">{{ item.name || item }}</span>
              <el-tag size="small" :type="item.status === 'done' ? 'success' : item.status === 'in_progress' ? 'warning' : 'info'">
                {{ itemStatusText(item.status) }}
              </el-tag>
            </div>
          </div>
          <div v-else>-</div>
        </el-descriptions-item>
        <el-descriptions-item label="备注">{{ currentDetail.notes || '-' }}</el-descriptions-item>
      </el-descriptions>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Plus } from '@element-plus/icons-vue'
import { handoverApi, motherApi, userApi } from '@/api'
import dayjs from 'dayjs'

const loading = ref(false)
const submitting = ref(false)
const dialogVisible = ref(false)
const detailVisible = ref(false)
const isEdit = ref(false)
const formRef = ref(null)
const handovers = ref([])
const mothers = ref([])
const users = ref([])
const currentDetail = ref(null)

const searchForm = reactive({
  type: '',
  status: ''
})

const form = reactive({
  id: '',
  type: '',
  motherId: '',
  fromUserId: '',
  toUserId: '',
  handoverTime: '',
  items: '',
  notes: '',
  status: 'pending',
  itemsList: [{ name: '', status: 'pending' }]
})

const rules = {
  type: [{ required: true, message: '请选择类型', trigger: 'change' }],
  motherId: [{ required: true, message: '请选择产妇', trigger: 'change' }],
  fromUserId: [{ required: true, message: '请选择交班人', trigger: 'change' }],
  toUserId: [{ required: true, message: '请选择接班人', trigger: 'change' }],
  handoverTime: [{ required: true, message: '请选择交接时间', trigger: 'change' }]
}

const staffUsers = computed(() => {
  return users.value.filter(u => ['admin', 'head_nurse', 'nurse', 'nutritionist', 'reception', 'sales'].includes(u.role))
})

const fetchData = async () => {
  loading.value = true
  try {
    const params = {}
    if (searchForm.type) params.type = searchForm.type
    if (searchForm.status) params.status = searchForm.status
    const res = await handoverApi.list(params)
    handovers.value = res.data?.data || res.data || []
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
}

const getUserName = (id) => {
  const u = users.value.find(x => x.id === id)
  return u?.name || '-'
}

const getMotherName = (id) => {
  const m = mothers.value.find(x => x.id === id)
  return m?.name || '-'
}

const formatDateTime = (d) => {
  if (!d) return '-'
  return dayjs(d).format('YYYY-MM-DD HH:mm')
}

const formatItemsSummary = (items) => {
  if (!items) return '-'
  let arr = items
  if (typeof items === 'string') {
    try { arr = JSON.parse(items) } catch { arr = [items] }
  }
  if (!Array.isArray(arr)) return '-'
  const names = arr.map(i => i.name || i).filter(Boolean)
  return names.length ? names.join('、') : '-'
}

const typeTagType = (t) => {
  const map = { shift: 'primary', discharge: 'danger' }
  return map[t] || 'info'
}

const typeText = (t) => {
  const map = { shift: '内部班次', discharge: '出院交接' }
  return map[t] || t
}

const statusTagType = (s) => {
  const map = { pending: 'warning', in_progress: 'primary', completed: 'success' }
  return map[s] || 'info'
}

const statusText = (s) => {
  const map = { pending: '待交接', in_progress: '交接中', completed: '已完成' }
  return map[s] || s
}

const itemStatusText = (s) => {
  const map = { pending: '未完成', in_progress: '进行中', done: '已完成' }
  return map[s] || '未完成'
}

const addItem = () => {
  form.itemsList.push({ name: '', status: 'pending' })
}

const removeItem = (idx) => {
  if (form.itemsList.length <= 1) {
    form.itemsList = [{ name: '', status: 'pending' }]
  } else {
    form.itemsList.splice(idx, 1)
  }
}

const resetSearch = () => {
  searchForm.type = ''
  searchForm.status = ''
  fetchData()
}

const resetForm = () => {
  Object.assign(form, {
    id: '',
    type: '',
    motherId: '',
    fromUserId: '',
    toUserId: '',
    handoverTime: dayjs().format('YYYY-MM-DD HH:mm:ss'),
    items: '',
    notes: '',
    status: 'pending',
    itemsList: [{ name: '', status: 'pending' }]
  })
}

const handleAdd = () => {
  isEdit.value = false
  resetForm()
  dialogVisible.value = true
}

const handleDetail = (row) => {
  let detail = { ...row }
  if (detail.items && typeof detail.items === 'string') {
    try { detail.items = JSON.parse(detail.items) } catch {}
  }
  currentDetail.value = detail
  detailVisible.value = true
}

const handleDelete = async (row) => {
  try {
    await ElMessageBox.confirm('确定要删除该交接记录吗？', '提示', { type: 'warning' })
    await handoverApi.remove(row.id)
    ElMessage.success('删除成功')
    fetchData()
  } catch (e) {
    if (e !== 'cancel') console.error(e)
  }
}

const handleConfirm = async (row) => {
  try {
    await ElMessageBox.confirm('确定确认该交接完成吗？', '提示', { type: 'warning' })
    await handoverApi.confirm(row.id)
    ElMessage.success('交接已确认')
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
    const items = form.itemsList.filter(i => i.name).map(i => ({ name: i.name, status: i.status }))
    const payload = {
      ...form,
      items: items.length ? JSON.stringify(items) : ''
    }
    delete payload.itemsList
    if (isEdit.value) {
      await handoverApi.update(form.id, payload)
      ElMessage.success('更新成功')
    } else {
      await handoverApi.create(payload)
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
.handovers-page {
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

  .items-wrapper {
    width: 100%;

    .item-row {
      display: flex;
      align-items: center;
      margin-bottom: 8px;
    }
  }

  .detail-item {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 6px 0;
    border-bottom: 1px dashed #ebeef5;

    &:last-child {
      border-bottom: none;
    }

    .item-name {
      flex: 1;
    }
  }
}
</style>
