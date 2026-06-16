<template>
  <div class="observations-page">
    <el-card shadow="never">
      <div class="toolbar">
        <div class="filters">
          <el-select v-model="searchForm.type" placeholder="记录类型" clearable style="width: 160px" @change="fetchData">
            <el-option label="睡眠" value="sleep" />
            <el-option label="体重" value="weight" />
            <el-option label="排便" value="excretion" />
            <el-option label="喂奶" value="feeding" />
            <el-option label="黄疸" value="jaundice" />
            <el-option label="体温" value="temperature" />
            <el-option label="产妇体征" value="mother_vital" />
          </el-select>
          <el-select v-model="searchForm.motherId" placeholder="选择产妇" clearable filterable style="width: 180px" @change="fetchData">
            <el-option v-for="m in mothers" :key="m.id" :label="m.name" :value="m.id" />
          </el-select>
          <el-button @click="resetSearch">重置</el-button>
        </div>
        <div class="actions">
          <el-button type="primary" @click="handleAdd">
            <el-icon><Plus /></el-icon>
            新增记录
          </el-button>
        </div>
      </div>

      <el-table :data="observations" stripe style="width: 100%" v-loading="loading">
        <el-table-column label="类型" width="110">
          <template #default="{ row }">
            <el-tag :type="typeTagType(row.type)">{{ typeText(row.type) }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="产妇/宝宝" width="160">
          <template #default="{ row }">
            <div>
              <div v-if="row.motherId">产妇：{{ getMotherName(row.motherId) }}</div>
              <div v-if="row.babyId">宝宝：{{ getBabyName(row.babyId) }}</div>
              <div v-if="!row.motherId && !row.babyId">-</div>
            </div>
          </template>
        </el-table-column>
        <el-table-column label="记录时间" width="160">
          <template #default="{ row }">
            {{ formatDateTime(row.recordedTime || row.createdAt) }}
          </template>
        </el-table-column>
        <el-table-column label="记录人" width="100">
          <template #default="{ row }">
            {{ getUserName(row.recordedBy) }}
          </template>
        </el-table-column>
        <el-table-column label="详情摘要" min-width="200" show-overflow-tooltip>
          <template #default="{ row }">
            {{ formatDataSummary(row.data) }}
          </template>
        </el-table-column>
        <el-table-column label="操作" width="200" fixed="right">
          <template #default="{ row }">
            <el-button link type="primary" size="small" @click="handleView(row)">查看详情</el-button>
            <el-button link type="primary" size="small" @click="handleEdit(row)">编辑</el-button>
            <el-button link type="danger" size="small" @click="handleDelete(row)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <el-dialog
      v-model="dialogVisible"
      :title="isEdit ? '编辑观察记录' : '新增观察记录'"
      width="680px"
      :close-on-click-modal="false"
    >
      <el-form ref="formRef" :model="form" :rules="rules" label-width="100px">
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="类型" prop="type">
              <el-select v-model="form.type" placeholder="请选择类型" style="width: 100%" @change="onTypeChange">
                <el-option label="睡眠" value="sleep" />
                <el-option label="体重" value="weight" />
                <el-option label="排便" value="excretion" />
                <el-option label="喂奶" value="feeding" />
                <el-option label="黄疸" value="jaundice" />
                <el-option label="体温" value="temperature" />
                <el-option label="产妇体征" value="mother_vital" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="记录时间" prop="recordedTime">
              <el-date-picker
                v-model="form.recordedTime"
                type="datetime"
                placeholder="选择时间"
                value-format="YYYY-MM-DD HH:mm:ss"
                style="width: 100%"
              />
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
          <el-col :span="24">
            <el-form-item label="data数据" prop="data">
              <el-input
                v-model="form.data"
                type="textarea"
                :rows="5"
                :placeholder="getDataPlaceholder()"
              />
              <div class="form-hint">支持JSON格式，如：{"值": "36.5℃", "备注": "正常"}，也可输入自由文本</div>
            </el-form-item>
          </el-col>
          <el-col :span="24">
            <el-form-item label="备注" prop="notes">
              <el-input v-model="form.notes" type="textarea" :rows="2" placeholder="请输入备注" />
            </el-form-item>
          </el-col>
        </el-row>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="submitting" @click="handleSubmit">确定</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="detailVisible" title="观察记录详情" width="560px">
      <el-descriptions :column="1" border v-if="currentDetail">
        <el-descriptions-item label="类型">
          <el-tag :type="typeTagType(currentDetail.type)">{{ typeText(currentDetail.type) }}</el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="产妇">{{ getMotherName(currentDetail.motherId) || '-' }}</el-descriptions-item>
        <el-descriptions-item label="宝宝">{{ getBabyName(currentDetail.babyId) || '-' }}</el-descriptions-item>
        <el-descriptions-item label="记录时间">{{ formatDateTime(currentDetail.recordedTime || currentDetail.createdAt) }}</el-descriptions-item>
        <el-descriptions-item label="记录人">{{ getUserName(currentDetail.recordedBy) }}</el-descriptions-item>
        <el-descriptions-item label="详细数据">
          <div v-if="currentDetail.data">
            <pre v-if="isJsonData(currentDetail.data)" class="json-data">{{ formatJsonData(currentDetail.data) }}</pre>
            <div v-else>{{ currentDetail.data }}</div>
          </div>
          <div v-else>-</div>
        </el-descriptions-item>
        <el-descriptions-item label="备注">{{ currentDetail.notes || '-' }}</el-descriptions-item>
      </el-descriptions>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Plus } from '@element-plus/icons-vue'
import { observationApi, motherApi, babyApi, userApi, observationTypeMap } from '@/api'
import dayjs from 'dayjs'

const loading = ref(false)
const submitting = ref(false)
const dialogVisible = ref(false)
const detailVisible = ref(false)
const isEdit = ref(false)
const formRef = ref(null)
const observations = ref([])
const mothers = ref([])
const babies = ref([])
const users = ref([])
const currentDetail = ref(null)

const searchForm = reactive({
  type: '',
  motherId: ''
})

const form = reactive({
  id: '',
  type: '',
  motherId: '',
  babyId: '',
  recordedTime: '',
  data: '',
  notes: ''
})

const rules = {
  type: [{ required: true, message: '请选择类型', trigger: 'change' }],
  recordedTime: [{ required: true, message: '请选择记录时间', trigger: 'change' }],
  data: [{ required: true, message: '请输入数据内容', trigger: 'blur' }]
}

const fetchData = async () => {
  loading.value = true
  try {
    const params = {}
    if (searchForm.type) params.type = searchForm.type
    if (searchForm.motherId) params.motherId = searchForm.motherId
    const res = await observationApi.list(params)
    observations.value = res.data?.data || res.data || []
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

const parseData = (data) => {
  if (!data) return null
  if (typeof data === 'object') return data
  try {
    return JSON.parse(data)
  } catch {
    return null
  }
}

const isJsonData = (data) => {
  return parseData(data) !== null
}

const formatJsonData = (data) => {
  const obj = parseData(data)
  if (!obj) return data || ''
  return JSON.stringify(obj, null, 2)
}

const formatDataSummary = (data) => {
  if (!data) return '-'
  const obj = parseData(data)
  if (obj && typeof obj === 'object') {
    const entries = Object.entries(obj).slice(0, 3)
    return entries.map(([k, v]) => `${k}: ${v}`).join('，')
  }
  if (typeof data === 'string') {
    return data.length > 60 ? data.slice(0, 60) + '...' : data
  }
  return '-'
}

const getDataPlaceholder = () => {
  const map = {
    sleep: '如：{"时长": "3小时", "质量": "良好", "时段": "13:00-16:00"}',
    weight: '如：{"体重": "3.5kg", "测量方式": "电子秤"}',
    excretion: '如：{"类型": "大便", "颜色": "金黄", "性状": "糊状", "量": "正常"}',
    feeding: '如：{"方式": "母乳", "奶量": "60ml", "时长": "20分钟"}',
    jaundice: '如：{"部位": "面部", "数值": "8.5mg/dL", "趋势": "下降"}',
    temperature: '如：{"部位": "腋下", "数值": "36.5℃", "状态": "正常"}',
    mother_vital: '如：{"血压": "120/80mmHg", "体温": "36.8℃", "脉搏": "78次/分", "血糖": "5.2mmol/L"}'
  }
  return map[form.type] || '请输入JSON格式数据或自由文本'
}

const typeTagType = (t) => {
  const map = {
    sleep: 'primary',
    weight: 'success',
    excretion: 'warning',
    feeding: '',
    jaundice: 'danger',
    temperature: 'info',
    mother_vital: 'primary'
  }
  return map[t] || 'info'
}

const typeText = (t) => {
  return observationTypeMap[t] || t
}

const onTypeChange = () => {
  if (!isEdit.value && !form.data) {
    form.data = ''
  }
}

const resetSearch = () => {
  searchForm.type = ''
  searchForm.motherId = ''
  fetchData()
}

const resetForm = () => {
  Object.assign(form, {
    id: '',
    type: '',
    motherId: '',
    babyId: '',
    recordedTime: dayjs().format('YYYY-MM-DD HH:mm:ss'),
    data: '',
    notes: ''
  })
}

const handleAdd = () => {
  isEdit.value = false
  resetForm()
  dialogVisible.value = true
}

const handleEdit = (row) => {
  isEdit.value = true
  Object.assign(form, {
    id: row.id,
    type: row.type,
    motherId: row.motherId || '',
    babyId: row.babyId || '',
    recordedTime: row.recordedTime || dayjs(row.createdAt).format('YYYY-MM-DD HH:mm:ss'),
    data: typeof row.data === 'object' ? JSON.stringify(row.data, null, 2) : (row.data || ''),
    notes: row.notes || ''
  })
  dialogVisible.value = true
}

const handleView = (row) => {
  currentDetail.value = row
  detailVisible.value = true
}

const handleDelete = async (row) => {
  try {
    await ElMessageBox.confirm('确定要删除该观察记录吗？', '提示', { type: 'warning' })
    await observationApi.remove(row.id)
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
    let dataVal = form.data
    try {
      const parsed = JSON.parse(form.data)
      if (typeof parsed === 'object') {
        dataVal = JSON.stringify(parsed)
      }
    } catch {}
    const payload = { ...form, data: dataVal }
    if (isEdit.value) {
      await observationApi.update(form.id, payload)
      ElMessage.success('更新成功')
    } else {
      await observationApi.create(payload)
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
.observations-page {
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

  .form-hint {
    font-size: 12px;
    color: #909399;
    margin-top: 4px;
  }

  .json-data {
    background: #f5f7fa;
    padding: 12px;
    border-radius: 6px;
    font-family: 'Monaco', 'Menlo', monospace;
    font-size: 13px;
    white-space: pre-wrap;
    word-break: break-all;
    margin: 0;
  }
}
</style>
