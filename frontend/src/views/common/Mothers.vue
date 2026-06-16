<template>
  <div class="mothers-page">
    <el-card shadow="never">
      <div class="toolbar">
        <div class="toolbar-left">
          <el-select v-model="filterStatus" placeholder="按状态筛选" clearable style="width: 160px; margin-right: 12px;" @change="fetchList">
            <el-option label="在住" value="active" />
            <el-option label="已出院" value="discharged" />
            <el-option label="已预约" value="booking" />
          </el-select>
          <el-select v-model="filterRoomId" placeholder="按房间筛选" clearable style="width: 180px; margin-right: 12px;" @change="fetchList">
            <el-option v-for="r in roomOptions" :key="r.id" :label="r.roomNo + ' - ' + r.type" :value="r.id" />
          </el-select>
          <el-input v-model="searchKey" placeholder="搜索姓名/手机" clearable style="width: 220px;" @clear="fetchList" @keyup.enter="fetchList">
            <template #prefix>
              <el-icon><Search /></el-icon>
            </template>
          </el-input>
        </div>
        <div class="toolbar-right">
          <el-button type="primary" :icon="Plus" @click="handleAdd">新增产妇</el-button>
        </div>
      </div>

      <el-table :data="tableData" stripe style="width: 100%; margin-top: 16px;" v-loading="loading">
        <el-table-column prop="name" label="姓名" width="120" />
        <el-table-column prop="age" label="年龄" width="80" />
        <el-table-column prop="gestationalWeek" label="孕周" width="100">
          <template #default="{ row }">
            {{ row.gestationalWeek ? row.gestationalWeek + '周' : '-' }}
          </template>
        </el-table-column>
        <el-table-column label="预产期" width="120">
          <template #default="{ row }">
            {{ formatDate(row.dueDate) }}
          </template>
        </el-table-column>
        <el-table-column label="入住日期" width="120">
          <template #default="{ row }">
            {{ formatDate(row.checkInDate) }}
          </template>
        </el-table-column>
        <el-table-column label="预计出院" width="120">
          <template #default="{ row }">
            {{ formatDate(row.expectedCheckOut) }}
          </template>
        </el-table-column>
        <el-table-column label="房间号" width="120">
          <template #default="{ row }">
            {{ getRoomNo(row.roomId) }}
          </template>
        </el-table-column>
        <el-table-column label="状态" width="100">
          <template #default="{ row }">
            <el-tag :type="statusTagType(row.status)">{{ statusText(row.status) }}</el-tag>
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

    <el-dialog v-model="dialogVisible" :title="isEdit ? '编辑产妇' : '新增产妇'" width="680px" destroy-on-close>
      <el-form ref="formRef" :model="form" :rules="rules" label-width="100px">
        <el-row :gutter="16">
          <el-col :span="12">
            <el-form-item label="姓名" prop="name">
              <el-input v-model="form.name" placeholder="请输入姓名" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="年龄" prop="age">
              <el-input-number v-model="form.age" :min="18" :max="60" style="width: 100%;" />
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="16">
          <el-col :span="12">
            <el-form-item label="孕周" prop="gestationalWeek">
              <el-input-number v-model="form.gestationalWeek" :min="0" :max="42" style="width: 100%;" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="预产期" prop="dueDate">
              <el-date-picker v-model="form.dueDate" type="date" placeholder="选择预产期" style="width: 100%;" />
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="16">
          <el-col :span="12">
            <el-form-item label="入住日期" prop="checkInDate">
              <el-date-picker v-model="form.checkInDate" type="date" placeholder="选择入住日期" style="width: 100%;" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="预计出院" prop="expectedCheckOut">
              <el-date-picker v-model="form.expectedCheckOut" type="date" placeholder="选择预计出院日期" style="width: 100%;" />
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="16">
          <el-col :span="12">
            <el-form-item label="房间号" prop="roomId">
              <el-select v-model="form.roomId" placeholder="请选择房间" filterable style="width: 100%;">
                <el-option v-for="r in roomOptions" :key="r.id" :label="r.roomNo + ' - ' + r.type + ' (¥' + r.pricePerDay + '/天)'" :value="r.id" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="套餐" prop="packageId">
              <el-select v-model="form.packageId" placeholder="请选择套餐" filterable style="width: 100%;">
                <el-option v-for="p in packageOptions" :key="p.id" :label="p.name + ' (' + p.days + '天/¥' + p.basePrice + ')'" :value="p.id" />
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="16">
          <el-col :span="12">
            <el-form-item label="手机" prop="phone">
              <el-input v-model="form.phone" placeholder="请输入手机号" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="身份证" prop="idCard">
              <el-input v-model="form.idCard" placeholder="请输入身份证号" />
            </el-form-item>
          </el-col>
        </el-row>
        <el-form-item label="紧急联系人" prop="emergencyContact">
          <el-input v-model="form.emergencyContact" placeholder="请输入紧急联系人及电话" />
        </el-form-item>
        <el-form-item label="健康状况" prop="healthStatus">
          <el-input v-model="form.healthStatus" type="textarea" :rows="2" placeholder="请描述健康状况" />
        </el-form-item>
        <el-form-item label="备注" prop="notes">
          <el-input v-model="form.notes" type="textarea" :rows="2" placeholder="请输入备注" />
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
import { ref, reactive, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Plus, Search } from '@element-plus/icons-vue'
import { motherApi, roomApi, packageApi } from '@/api'
import dayjs from 'dayjs'

const loading = ref(false)
const submitting = ref(false)
const dialogVisible = ref(false)
const isEdit = ref(false)
const editId = ref(null)
const filterStatus = ref('')
const filterRoomId = ref('')
const searchKey = ref('')
const tableData = ref([])
const roomOptions = ref([])
const packageOptions = ref([])
const formRef = ref(null)

const form = reactive({
  name: '',
  age: 30,
  gestationalWeek: 40,
  dueDate: '',
  checkInDate: '',
  expectedCheckOut: '',
  roomId: '',
  packageId: '',
  phone: '',
  idCard: '',
  emergencyContact: '',
  healthStatus: '',
  notes: ''
})

const rules = {
  name: [{ required: true, message: '请输入姓名', trigger: 'blur' }],
  phone: [
    { required: true, message: '请输入手机号', trigger: 'blur' },
    { pattern: /^1[3-9]\d{9}$/, message: '手机号格式不正确', trigger: 'blur' }
  ]
}

const statusTagType = (s) => {
  const map = { active: 'success', discharged: 'info', booking: 'warning' }
  return map[s] || 'info'
}

const statusText = (s) => {
  const map = { active: '在住', discharged: '已出院', booking: '已预约' }
  return map[s] || s
}

const getRoomNo = (id) => {
  const r = roomOptions.value.find(x => x.id === id)
  return r?.roomNo || '-'
}

const fetchRooms = async () => {
  try {
    const res = await roomApi.list()
    roomOptions.value = res.data?.data || res.data || []
  } catch {}
}

const fetchPackages = async () => {
  try {
    const res = await packageApi.list()
    packageOptions.value = res.data?.data || res.data || []
  } catch {}
}

const fetchList = async () => {
  loading.value = true
  try {
    const params = {}
    if (filterStatus.value) params.status = filterStatus.value
    if (filterRoomId.value) params.roomId = filterRoomId.value
    const res = await motherApi.list(params)
    let list = res.data?.data || res.data || []
    if (searchKey.value) {
      const kw = searchKey.value.toLowerCase()
      list = list.filter(m =>
        m.name?.toLowerCase().includes(kw) ||
        m.phone?.includes(kw)
      )
    }
    tableData.value = list
  } finally {
    loading.value = false
  }
}

const resetForm = () => {
  form.name = ''
  form.age = 30
  form.gestationalWeek = 40
  form.dueDate = ''
  form.checkInDate = ''
  form.expectedCheckOut = ''
  form.roomId = ''
  form.packageId = ''
  form.phone = ''
  form.idCard = ''
  form.emergencyContact = ''
  form.healthStatus = ''
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
  form.age = row.age || 30
  form.gestationalWeek = row.gestationalWeek || 40
  form.dueDate = row.dueDate ? dayjs(row.dueDate).toDate() : ''
  form.checkInDate = row.checkInDate ? dayjs(row.checkInDate).toDate() : ''
  form.expectedCheckOut = row.expectedCheckOut ? dayjs(row.expectedCheckOut).toDate() : ''
  form.roomId = row.roomId || ''
  form.packageId = row.packageId || ''
  form.phone = row.phone || ''
  form.idCard = row.idCard || ''
  form.emergencyContact = row.emergencyContact || ''
  form.healthStatus = row.healthStatus || ''
  form.notes = row.notes || ''
  dialogVisible.value = true
}

const handleDelete = async (row) => {
  try {
    await ElMessageBox.confirm(`确定删除产妇「${row.name}」吗？`, '提示', { type: 'warning' })
    await motherApi.remove(row.id)
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
    if (payload.dueDate) payload.dueDate = dayjs(payload.dueDate).format('YYYY-MM-DD')
    if (payload.checkInDate) payload.checkInDate = dayjs(payload.checkInDate).format('YYYY-MM-DD')
    if (payload.expectedCheckOut) payload.expectedCheckOut = dayjs(payload.expectedCheckOut).format('YYYY-MM-DD')
    if (isEdit.value) {
      await motherApi.update(editId.value, payload)
      ElMessage.success('修改成功')
    } else {
      await motherApi.create(payload)
      ElMessage.success('新增成功')
    }
    dialogVisible.value = false
    fetchList()
  } finally {
    submitting.value = false
  }
}

const formatDate = (d) => {
  if (!d) return '-'
  return dayjs(d).format('YYYY-MM-DD')
}

onMounted(() => {
  fetchRooms()
  fetchPackages()
  fetchList()
})
</script>

<style lang="scss" scoped>
.mothers-page {
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
}
</style>
