<template>
  <div class="babies-page">
    <el-card shadow="never">
      <div class="toolbar">
        <div class="toolbar-left">
          <el-select v-model="filterMotherId" placeholder="按母亲筛选" clearable filterable style="width: 220px; margin-right: 12px;" @change="fetchList">
            <el-option v-for="m in motherOptions" :key="m.id" :label="m.name" :value="m.id" />
          </el-select>
          <el-select v-model="filterGender" placeholder="按性别筛选" clearable style="width: 140px; margin-right: 12px;" @change="fetchList">
            <el-option label="男宝" value="male" />
            <el-option label="女宝" value="female" />
          </el-select>
          <el-input v-model="searchKey" placeholder="搜索宝宝姓名/医院" clearable style="width: 220px;" @clear="fetchList" @keyup.enter="fetchList">
            <template #prefix>
              <el-icon><Search /></el-icon>
            </template>
          </el-input>
        </div>
        <div class="toolbar-right">
          <el-button type="primary" :icon="Plus" @click="handleAdd">新增宝宝</el-button>
        </div>
      </div>

      <el-table :data="filteredList" stripe style="width: 100%; margin-top: 16px;" v-loading="loading">
        <el-table-column label="宝宝姓名" width="140">
          <template #default="{ row }">
            <div class="baby-cell">
              <el-avatar :size="36" :style="{ background: genderBg(row.gender) }">
                {{ row.name?.charAt(0) || '宝' }}
              </el-avatar>
              <span style="margin-left: 10px; font-weight: 500;">{{ row.name }}</span>
            </div>
          </template>
        </el-table-column>
        <el-table-column label="性别" width="100">
          <template #default="{ row }">
            <el-tag :type="row.gender === 'male' ? 'primary' : 'danger'" effect="light">
              {{ row.gender === 'male' ? '男宝' : '女宝' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="出生日期" width="170">
          <template #default="{ row }">
            {{ formatDateTime(row.birthDate) }}
          </template>
        </el-table-column>
        <el-table-column label="出生体重" width="120">
          <template #default="{ row }">
            <span v-if="row.birthWeight">{{ (row.birthWeight / 1000).toFixed(2) }} kg</span>
            <span v-else>-</span>
          </template>
        </el-table-column>
        <el-table-column label="母亲姓名" width="140">
          <template #default="{ row }">
            {{ getMotherName(row.motherId) }}
          </template>
        </el-table-column>
        <el-table-column prop="hospital" label="出生医院" min-width="180" show-overflow-tooltip />
        <el-table-column prop="apgarScore" label="Apgar评分" width="120">
          <template #default="{ row }">
            <el-tag v-if="row.apgarScore" :type="apgarTagType(row.apgarScore)">
              {{ row.apgarScore }}分
            </el-tag>
            <span v-else>-</span>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="200" fixed="right">
          <template #default="{ row }">
            <el-button link type="primary" @click="handleEdit(row)">编辑</el-button>
            <el-button link type="danger" @click="handleDelete(row)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <el-dialog v-model="dialogVisible" :title="isEdit ? '编辑宝宝' : '新增宝宝'" width="600px" destroy-on-close>
      <el-form ref="formRef" :model="form" :rules="rules" label-width="100px">
        <el-row :gutter="16">
          <el-col :span="12">
            <el-form-item label="宝宝姓名" prop="name">
              <el-input v-model="form.name" placeholder="请输入宝宝姓名" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="性别" prop="gender">
              <el-radio-group v-model="form.gender">
                <el-radio value="male">男宝</el-radio>
                <el-radio value="female">女宝</el-radio>
              </el-radio-group>
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="16">
          <el-col :span="12">
            <el-form-item label="出生日期" prop="birthDate">
              <el-date-picker
                v-model="form.birthDate"
                type="datetime"
                placeholder="选择出生日期时间"
                style="width: 100%;"
              />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="出生体重(g)" prop="birthWeight">
              <el-input-number v-model="form.birthWeight" :min="500" :max="8000" :step="50" style="width: 100%;" />
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="16">
          <el-col :span="12">
            <el-form-item label="母亲" prop="motherId">
              <el-select v-model="form.motherId" placeholder="请选择母亲" filterable style="width: 100%;">
                <el-option v-for="m in motherOptions" :key="m.id" :label="m.name + (m.phone ? ' (' + m.phone + ')' : '')" :value="m.id" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="Apgar评分" prop="apgarScore">
              <el-input-number v-model="form.apgarScore" :min="0" :max="10" style="width: 100%;" />
            </el-form-item>
          </el-col>
        </el-row>
        <el-form-item label="出生医院" prop="hospital">
          <el-input v-model="form.hospital" placeholder="请输入出生医院" />
        </el-form-item>
        <el-form-item label="备注" prop="notes">
          <el-input v-model="form.notes" type="textarea" :rows="3" placeholder="请输入备注信息" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="submitting" @click="handleSubmit">确定</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Plus, Search } from '@element-plus/icons-vue'
import { babyApi, motherApi } from '@/api'
import dayjs from 'dayjs'

const loading = ref(false)
const submitting = ref(false)
const dialogVisible = ref(false)
const isEdit = ref(false)
const editId = ref(null)
const filterMotherId = ref('')
const filterGender = ref('')
const searchKey = ref('')
const tableData = ref([])
const motherOptions = ref([])
const formRef = ref(null)

const form = reactive({
  name: '',
  gender: 'male',
  birthDate: '',
  birthWeight: 3200,
  motherId: '',
  hospital: '',
  apgarScore: 10,
  notes: ''
})

const rules = {
  name: [{ required: true, message: '请输入宝宝姓名', trigger: 'blur' }],
  gender: [{ required: true, message: '请选择性别', trigger: 'change' }],
  birthDate: [{ required: true, message: '请选择出生日期', trigger: 'change' }],
  motherId: [{ required: true, message: '请选择母亲', trigger: 'change' }]
}

const filteredList = computed(() => {
  let list = tableData.value
  if (filterMotherId.value) {
    list = list.filter(b => b.motherId === filterMotherId.value)
  }
  if (filterGender.value) {
    list = list.filter(b => b.gender === filterGender.value)
  }
  if (searchKey.value) {
    const kw = searchKey.value.toLowerCase()
    list = list.filter(b =>
      b.name?.toLowerCase().includes(kw) ||
      b.hospital?.toLowerCase().includes(kw)
    )
  }
  return list
})

const genderBg = (g) => {
  return g === 'male' ? 'linear-gradient(135deg, #66b1ff 0%, #409eff 100%)' : 'linear-gradient(135deg, #f78989 0%, #f56c6c 100%)'
}

const apgarTagType = (score) => {
  if (score >= 8) return 'success'
  if (score >= 5) return 'warning'
  return 'danger'
}

const getMotherName = (id) => {
  const m = motherOptions.value.find(x => x.id === id)
  return m?.name || '-'
}

const formatDateTime = (d) => {
  if (!d) return '-'
  return dayjs(d).format('YYYY-MM-DD HH:mm')
}

const fetchMothers = async () => {
  try {
    const res = await motherApi.list()
    motherOptions.value = res.data?.data || res.data || []
  } catch {}
}

const fetchList = async () => {
  loading.value = true
  try {
    const params = {}
    if (filterMotherId.value) params.motherId = filterMotherId.value
    const res = await babyApi.list(params)
    tableData.value = res.data?.data || res.data || []
  } finally {
    loading.value = false
  }
}

const resetForm = () => {
  form.name = ''
  form.gender = 'male'
  form.birthDate = ''
  form.birthWeight = 3200
  form.motherId = ''
  form.hospital = ''
  form.apgarScore = 10
  form.notes = ''
  isEdit.value = false
  editId.value = null
}

const handleAdd = () => {
  resetForm()
  dialogVisible.value = true
}

const handleEdit = (row) => {
  isEdit.value = true
  editId.value = row.id
  form.name = row.name || ''
  form.gender = row.gender || 'male'
  form.birthDate = row.birthDate ? dayjs(row.birthDate).toDate() : ''
  form.birthWeight = row.birthWeight || 3200
  form.motherId = row.motherId || ''
  form.hospital = row.hospital || ''
  form.apgarScore = row.apgarScore ?? 10
  form.notes = row.notes || ''
  dialogVisible.value = true
}

const handleDelete = async (row) => {
  try {
    await ElMessageBox.confirm(`确定删除宝宝「${row.name}」吗？`, '提示', { type: 'warning' })
    await babyApi.remove(row.id)
    ElMessage.success('删除成功')
    fetchList()
  } catch {}
}

const handleSubmit = async () => {
  try {
    await formRef.value.validate()
  } catch { return }
  submitting.value = true
  try {
    const payload = { ...form }
    if (payload.birthDate) {
      payload.birthDate = dayjs(payload.birthDate).format('YYYY-MM-DD HH:mm:ss')
    }
    if (isEdit.value) {
      await babyApi.update(editId.value, payload)
      ElMessage.success('修改成功')
    } else {
      await babyApi.create(payload)
      ElMessage.success('新增成功')
    }
    dialogVisible.value = false
    fetchList()
  } finally {
    submitting.value = false
  }
}

onMounted(() => {
  fetchMothers()
  fetchList()
})
</script>

<style lang="scss" scoped>
.babies-page {
  padding: 20px;

  .toolbar {
    display: flex;
    justify-content: space-between;
    align-items: center;
    flex-wrap: wrap;
    gap: 12px;

    .toolbar-left,
    .toolbar-right {
      display: flex;
      align-items: center;
      flex-wrap: wrap;
      gap: 12px;
    }
  }

  .baby-cell {
    display: flex;
    align-items: center;
  }
}
</style>
