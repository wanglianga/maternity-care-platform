<template>
  <div class="fees-page">
    <el-card shadow="never">
      <div class="toolbar">
        <div class="filters">
          <el-select v-model="searchForm.type" placeholder="费用类型" clearable style="width: 160px" @change="fetchData">
            <el-option label="押金" value="deposit" />
            <el-option label="套餐费" value="package" />
            <el-option label="增购" value="extra" />
            <el-option label="退款" value="refund" />
          </el-select>
          <el-select v-model="searchForm.status" placeholder="状态" clearable style="width: 160px" @change="fetchData">
            <el-option label="待付" value="pending" />
            <el-option label="已付" value="paid" />
            <el-option label="已取消" value="cancelled" />
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
            新增费用
          </el-button>
        </div>
      </div>

      <el-table :data="filteredFees" stripe style="width: 100%" v-loading="loading">
        <el-table-column prop="feeNo" label="费用单号" width="180">
          <template #default="{ row }">
            {{ row.feeNo || ('FY' + (row.id || '').slice(0, 8).toUpperCase()) }}
          </template>
        </el-table-column>
        <el-table-column label="产妇" width="120">
          <template #default="{ row }">
            {{ getMotherName(row.motherId) }}
          </template>
        </el-table-column>
        <el-table-column label="类型" width="100">
          <template #default="{ row }">
            <el-tag :type="typeTagType(row.type)">{{ typeText(row.type) }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="金额" width="140">
          <template #default="{ row }">
            <span :class="{ 'refund-amount': row.type === 'refund' }">
              {{ row.type === 'refund' ? '-' : '' }}¥{{ Number(row.amount || 0).toLocaleString() }}
            </span>
          </template>
        </el-table-column>
        <el-table-column label="产生时间" width="160">
          <template #default="{ row }">
            {{ formatDateTime(row.createdAt) }}
          </template>
        </el-table-column>
        <el-table-column label="状态" width="100">
          <template #default="{ row }">
            <el-tag :type="statusTagType(row.status)">{{ statusText(row.status) }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="220" fixed="right">
          <template #default="{ row }">
            <el-button v-if="row.status === 'pending'" link type="success" size="small" @click="handlePay(row)">标记已付</el-button>
            <el-button link type="primary" size="small" @click="handleEdit(row)">编辑</el-button>
            <el-button link type="danger" size="small" @click="handleDelete(row)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <el-dialog
      v-model="dialogVisible"
      :title="isEdit ? '编辑费用' : '新增费用'"
      width="640px"
      :close-on-click-modal="false"
    >
      <el-form ref="formRef" :model="form" :rules="rules" label-width="100px">
        <el-row :gutter="20">
          <el-col :span="24">
            <el-form-item label="产妇" prop="motherId">
              <el-select v-model="form.motherId" placeholder="请选择产妇" filterable style="width: 100%">
                <el-option v-for="m in mothers" :key="m.id" :label="m.name" :value="m.id" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="类型" prop="type">
              <el-select v-model="form.type" placeholder="请选择类型" style="width: 100%">
                <el-option label="押金" value="deposit" />
                <el-option label="套餐费" value="package" />
                <el-option label="增购" value="extra" />
                <el-option label="退款" value="refund" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="金额" prop="amount">
              <el-input-number v-model="form.amount" :min="0" :precision="2" style="width: 100%" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="到期日" prop="dueDate">
              <el-date-picker v-model="form.dueDate" type="date" placeholder="选择日期" value-format="YYYY-MM-DD" style="width: 100%" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="状态" prop="status">
              <el-select v-model="form.status" placeholder="请选择状态" style="width: 100%">
                <el-option label="待付" value="pending" />
                <el-option label="已付" value="paid" />
                <el-option label="已取消" value="cancelled" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="24">
            <el-form-item label="描述" prop="description">
              <el-input v-model="form.description" type="textarea" :rows="3" placeholder="请输入费用描述" />
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
import { feeApi, motherApi } from '@/api'
import dayjs from 'dayjs'

const loading = ref(false)
const submitting = ref(false)
const dialogVisible = ref(false)
const isEdit = ref(false)
const formRef = ref(null)
const fees = ref([])
const mothers = ref([])

const searchForm = reactive({
  type: '',
  status: '',
  motherName: ''
})

const form = reactive({
  id: '',
  motherId: '',
  type: '',
  amount: 0,
  description: '',
  dueDate: '',
  status: 'pending'
})

const rules = {
  motherId: [{ required: true, message: '请选择产妇', trigger: 'change' }],
  type: [{ required: true, message: '请选择类型', trigger: 'change' }],
  amount: [{ required: true, message: '请输入金额', trigger: 'blur' }]
}

const filteredFees = computed(() => {
  let list = fees.value
  if (searchForm.type) {
    list = list.filter(f => f.type === searchForm.type)
  }
  if (searchForm.status) {
    list = list.filter(f => f.status === searchForm.status)
  }
  if (searchForm.motherName) {
    list = list.filter(f => {
      const name = getMotherName(f.motherId)
      return name && name.includes(searchForm.motherName)
    })
  }
  return list
})

const fetchData = async () => {
  loading.value = true
  try {
    const res = await feeApi.list()
    fees.value = res.data?.data || res.data || []
  } finally {
    loading.value = false
  }
}

const fetchMothers = async () => {
  const res = await motherApi.list()
  mothers.value = res.data?.data || res.data || []
}

const getMotherName = (id) => {
  const m = mothers.value.find(x => x.id === id)
  return m?.name || '-'
}

const formatDateTime = (d) => {
  if (!d) return '-'
  return dayjs(d).format('YYYY-MM-DD HH:mm')
}

const typeTagType = (t) => {
  const map = { deposit: 'warning', package: 'primary', extra: 'success', refund: 'danger' }
  return map[t] || 'info'
}

const typeText = (t) => {
  const map = { deposit: '押金', package: '套餐费', extra: '增购', refund: '退款' }
  return map[t] || t
}

const statusTagType = (s) => {
  const map = { pending: 'warning', paid: 'success', cancelled: 'danger' }
  return map[s] || 'info'
}

const statusText = (s) => {
  const map = { pending: '待付', paid: '已付', cancelled: '已取消' }
  return map[s] || s
}

const resetSearch = () => {
  searchForm.type = ''
  searchForm.status = ''
  searchForm.motherName = ''
  fetchData()
}

const resetForm = () => {
  Object.assign(form, {
    id: '',
    motherId: '',
    type: '',
    amount: 0,
    description: '',
    dueDate: '',
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

const handlePay = async (row) => {
  try {
    await ElMessageBox.confirm('确定标记该费用为已付款吗？', '提示', { type: 'warning' })
    await feeApi.pay(row.id, { paymentMethod: 'cash' })
    ElMessage.success('已标记为已付款')
    fetchData()
  } catch (e) {
    if (e !== 'cancel') console.error(e)
  }
}

const handleDelete = async (row) => {
  try {
    await ElMessageBox.confirm('确定要删除该费用记录吗？', '提示', { type: 'warning' })
    await feeApi.remove(row.id)
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
      await feeApi.update(form.id, { ...form })
      ElMessage.success('更新成功')
    } else {
      await feeApi.create({ ...form })
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
})
</script>

<style lang="scss" scoped>
.fees-page {
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

  .refund-amount {
    color: #f56c6c;
  }
}
</style>
