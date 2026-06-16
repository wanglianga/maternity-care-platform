<template>
  <div class="contracts-page">
    <el-card shadow="never">
      <div class="toolbar">
        <div class="filters">
          <el-select v-model="searchForm.status" placeholder="合同状态" clearable style="width: 160px" @change="fetchData">
            <el-option label="有效" value="active" />
            <el-option label="已取消" value="cancelled" />
            <el-option label="已完成" value="completed" />
          </el-select>
          <el-input v-model="searchForm.motherName" placeholder="输入产妇姓名搜索" clearable style="width: 220px" @keyup.enter="fetchData" />
          <el-button type="primary" @click="fetchData">
            <el-icon><Search /></el-icon>
            搜索
          </el-button>
          <el-button @click="resetSearch">重置</el-button>
        </div>
        <div class="actions">
          <el-button type="primary" @click="handleAdd">
            <el-icon><Plus /></el-icon>
            新增合同
          </el-button>
        </div>
      </div>

      <el-table :data="filteredContracts" stripe style="width: 100%" v-loading="loading">
        <el-table-column prop="contractNo" label="合同号" width="160" />
        <el-table-column label="产妇姓名" width="120">
          <template #default="{ row }">
            {{ getMotherName(row.motherId) }}
          </template>
        </el-table-column>
        <el-table-column label="套餐名称" min-width="160">
          <template #default="{ row }">
            {{ getPackageName(row.packageId) }}
          </template>
        </el-table-column>
        <el-table-column label="签订日期" width="120">
          <template #default="{ row }">
            {{ formatDate(row.signDate) }}
          </template>
        </el-table-column>
        <el-table-column label="入住日期" width="120">
          <template #default="{ row }">
            {{ formatDate(row.checkInDate) }}
          </template>
        </el-table-column>
        <el-table-column label="总价" width="120">
          <template #default="{ row }">
            ¥{{ Number(row.totalPrice || 0).toLocaleString() }}
          </template>
        </el-table-column>
        <el-table-column label="已付押金" width="120">
          <template #default="{ row }">
            ¥{{ Number(row.deposit || 0).toLocaleString() }}
          </template>
        </el-table-column>
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
      :title="isEdit ? '编辑合同' : '新增合同'"
      width="720px"
      :close-on-click-modal="false"
    >
      <el-form ref="formRef" :model="form" :rules="rules" label-width="100px">
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="合同号" prop="contractNo">
              <el-input v-model="form.contractNo" disabled placeholder="保存后自动生成" />
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
            <el-form-item label="套餐" prop="packageId">
              <el-select v-model="form.packageId" placeholder="请选择套餐" style="width: 100%" @change="onPackageChange">
                <el-option v-for="p in packages" :key="p.id" :label="p.name" :value="p.id" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="签订日期" prop="signDate">
              <el-date-picker v-model="form.signDate" type="date" placeholder="选择日期" value-format="YYYY-MM-DD" style="width: 100%" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="入住日期" prop="checkInDate">
              <el-date-picker v-model="form.checkInDate" type="date" placeholder="选择日期" value-format="YYYY-MM-DD" style="width: 100%" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="出院日期" prop="checkOutDate">
              <el-date-picker v-model="form.checkOutDate" type="date" placeholder="选择日期" value-format="YYYY-MM-DD" style="width: 100%" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="总价" prop="totalPrice">
              <el-input-number v-model="form.totalPrice" :min="0" :precision="2" style="width: 100%" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="押金" prop="deposit">
              <el-input-number v-model="form.deposit" :min="0" :precision="2" style="width: 100%" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="销售员" prop="salespersonId">
              <el-select v-model="form.salespersonId" placeholder="请选择销售员" filterable style="width: 100%">
                <el-option v-for="u in salesUsers" :key="u.id" :label="u.name" :value="u.id" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="状态" prop="status">
              <el-select v-model="form.status" placeholder="请选择状态" style="width: 100%">
                <el-option label="有效" value="active" />
                <el-option label="已取消" value="cancelled" />
                <el-option label="已完成" value="completed" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="24">
            <el-form-item label="增购服务" prop="extraServices">
              <el-input v-model="form.extraServices" type="textarea" :rows="3" placeholder="请输入增购服务明细" />
            </el-form-item>
          </el-col>
          <el-col :span="24">
            <el-form-item label="备注" prop="remarks">
              <el-input v-model="form.remarks" type="textarea" :rows="2" placeholder="请输入备注" />
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
import { ref, reactive, computed, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Search, Plus } from '@element-plus/icons-vue'
import { contractApi, motherApi, packageApi, userApi } from '@/api'
import dayjs from 'dayjs'

const loading = ref(false)
const submitting = ref(false)
const dialogVisible = ref(false)
const isEdit = ref(false)
const formRef = ref(null)
const contracts = ref([])
const mothers = ref([])
const packages = ref([])
const users = ref([])

const searchForm = reactive({
  status: '',
  motherName: ''
})

const form = reactive({
  id: '',
  contractNo: '',
  motherId: '',
  packageId: '',
  signDate: '',
  checkInDate: '',
  checkOutDate: '',
  totalPrice: 0,
  deposit: 0,
  extraServices: '',
  salespersonId: '',
  status: 'active',
  remarks: ''
})

const rules = {
  motherId: [{ required: true, message: '请选择产妇', trigger: 'change' }],
  packageId: [{ required: true, message: '请选择套餐', trigger: 'change' }],
  signDate: [{ required: true, message: '请选择签订日期', trigger: 'change' }],
  totalPrice: [{ required: true, message: '请输入总价', trigger: 'blur' }]
}

const filteredContracts = computed(() => {
  let list = contracts.value
  if (searchForm.status) {
    list = list.filter(c => c.status === searchForm.status)
  }
  if (searchForm.motherName) {
    list = list.filter(c => {
      const name = getMotherName(c.motherId)
      return name && name.includes(searchForm.motherName)
    })
  }
  return list
})

const salesUsers = computed(() => users.value.filter(u => u.role === 'sales' || u.role === 'admin'))

const fetchData = async () => {
  loading.value = true
  try {
    const res = await contractApi.list()
    contracts.value = res.data?.data || res.data || []
  } finally {
    loading.value = false
  }
}

const fetchMothers = async () => {
  const res = await motherApi.list()
  mothers.value = res.data?.data || res.data || []
}

const fetchPackages = async () => {
  const res = await packageApi.list()
  packages.value = res.data?.data || res.data || []
}

const fetchUsers = async () => {
  const res = await userApi.list()
  users.value = res.data?.data || res.data || []
}

const getMotherName = (id) => {
  const m = mothers.value.find(x => x.id === id)
  return m?.name || '-'
}

const getPackageName = (id) => {
  const p = packages.value.find(x => x.id === id)
  return p?.name || '-'
}

const formatDate = (d) => {
  if (!d) return '-'
  return dayjs(d).format('YYYY-MM-DD')
}

const statusTagType = (s) => {
  const map = { active: 'success', cancelled: 'danger', completed: 'info' }
  return map[s] || 'info'
}

const statusText = (s) => {
  const map = { active: '有效', cancelled: '已取消', completed: '已完成' }
  return map[s] || s
}

const onPackageChange = (val) => {
  const p = packages.value.find(x => x.id === val)
  if (p && !isEdit.value) {
    form.totalPrice = p.basePrice || 0
  }
}

const resetSearch = () => {
  searchForm.status = ''
  searchForm.motherName = ''
  fetchData()
}

const resetForm = () => {
  Object.assign(form, {
    id: '',
    contractNo: '',
    motherId: '',
    packageId: '',
    signDate: dayjs().format('YYYY-MM-DD'),
    checkInDate: '',
    checkOutDate: '',
    totalPrice: 0,
    deposit: 0,
    extraServices: '',
    salespersonId: '',
    status: 'active',
    remarks: ''
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
    await ElMessageBox.confirm('确定要删除该合同吗？', '提示', { type: 'warning' })
    await contractApi.remove(row.id)
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
    const payload = { ...form }
    if (!payload.contractNo) delete payload.contractNo
    if (isEdit.value) {
      await contractApi.update(form.id, payload)
      ElMessage.success('更新成功')
    } else {
      await contractApi.create(payload)
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
  fetchPackages()
  fetchUsers()
})
</script>

<style lang="scss" scoped>
.contracts-page {
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
