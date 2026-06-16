<template>
  <div class="visitors">
    <el-card shadow="never">
      <template #header>
        <div class="card-header">
          <span class="header-title">访客核验</span>
          <el-button type="primary" @click="openAddDialog">
            <el-icon><Plus /></el-icon>
            新增预约
          </el-button>
        </div>
      </template>

      <el-table
        :data="visitors"
        stripe
        style="width: 100%"
        v-loading="loading"
        empty-text="暂无访客记录"
      >
        <el-table-column label="访客姓名" width="110" prop="name" />
        <el-table-column label="身份证号" width="190" prop="idCard">
          <template #default="{ row }">
            <span v-if="row.idCard">{{ maskIdCard(row.idCard) }}</span>
            <span v-else>-</span>
          </template>
        </el-table-column>
        <el-table-column label="关系" width="90" prop="relation">
          <template #default="{ row }">
            <el-tag size="small" effect="light">{{ row.relation || '-' }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="联系电话" width="130" prop="phone">
          <template #default="{ row }">
            <span v-if="row.phone">{{ maskPhone(row.phone) }}</span>
            <span v-else>-</span>
          </template>
        </el-table-column>
        <el-table-column label="探视产妇" width="110">
          <template #default="{ row }">{{ getMotherName(row.motherId) }}</template>
        </el-table-column>
        <el-table-column label="预约日期" width="120">
          <template #default="{ row }">{{ formatDate(row.visitDate) }}</template>
        </el-table-column>
        <el-table-column label="预约时段" width="140">
          <template #default="{ row }">
            <span v-if="row.startTime && row.endTime">
              {{ row.startTime?.slice(0, 5) }} - {{ row.endTime?.slice(0, 5) }}
            </span>
            <span v-else>-</span>
          </template>
        </el-table-column>
        <el-table-column label="人数" width="70" prop="visitorCount">
          <template #default="{ row }">
            <span v-if="row.visitorCount">{{ row.visitorCount }}人</span>
            <span v-else>-</span>
          </template>
        </el-table-column>
        <el-table-column label="状态" width="100">
          <template #default="{ row }">
            <el-tag :type="statusTagType(row.status)">{{ statusText(row.status) }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="备注" min-width="120" show-overflow-tooltip prop="notes">
          <template #default="{ row }">
            <span v-if="row.notes">{{ row.notes }}</span>
            <span v-else class="empty-text">-</span>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="300" fixed="right">
          <template #default="{ row }">
            <template v-if="row.status === 'pending'">
              <el-button type="success" size="small" link @click="handleApprove(row)">批准</el-button>
              <el-button type="danger" size="small" link @click="handleReject(row)">拒绝</el-button>
            </template>
            <template v-if="row.status === 'approved'">
              <el-button type="primary" size="small" link @click="handleCheckIn(row)">签到入场</el-button>
            </template>
            <template v-if="row.status === 'checked_in'">
              <el-button type="warning" size="small" link @click="handleCheckOut(row)">签退离场</el-button>
            </template>
            <el-button type="primary" size="small" link @click="handleEdit(row)">编辑</el-button>
            <el-popconfirm title="确定删除该预约吗？" @confirm="handleDelete(row)">
              <template #reference>
                <el-button type="danger" size="small" link>删除</el-button>
              </template>
            </el-popconfirm>
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <el-dialog v-model="dialogVisible" :title="isEdit ? '编辑预约' : '新增预约'" width="560px" @close="resetForm">
      <el-form ref="formRef" :model="form" :rules="formRules" label-width="100px">
        <el-row :gutter="16">
          <el-col :span="12">
            <el-form-item label="访客姓名" prop="name">
              <el-input v-model="form.name" placeholder="请输入访客姓名" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="联系电话" prop="phone">
              <el-input v-model="form.phone" placeholder="请输入联系电话" />
            </el-form-item>
          </el-col>
        </el-row>
        <el-form-item label="身份证号" prop="idCard">
          <el-input v-model="form.idCard" placeholder="请输入身份证号" />
        </el-form-item>
        <el-row :gutter="16">
          <el-col :span="12">
            <el-form-item label="与产妇关系" prop="relation">
              <el-select v-model="form.relation" placeholder="请选择关系" style="width: 100%" filterable allow-create>
                <el-option label="丈夫" value="丈夫" />
                <el-option label="母亲" value="母亲" />
                <el-option label="父亲" value="父亲" />
                <el-option label="姐妹" value="姐妹" />
                <el-option label="兄弟" value="兄弟" />
                <el-option label="朋友" value="朋友" />
                <el-option label="同事" value="同事" />
                <el-option label="其他亲属" value="其他亲属" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="探视人数" prop="visitorCount">
              <el-input-number v-model="form.visitorCount" :min="1" :max="10" style="width: 100%" />
            </el-form-item>
          </el-col>
        </el-row>
        <el-form-item label="探视产妇" prop="motherId">
          <el-select v-model="form.motherId" placeholder="请选择产妇" filterable style="width: 100%">
            <el-option v-for="m in mothers" :key="m.id" :label="m.name" :value="m.id" />
          </el-select>
        </el-form-item>
        <el-form-item label="预约日期" prop="visitDate">
          <el-date-picker
            v-model="form.visitDate"
            type="date"
            placeholder="选择探视日期"
            style="width: 100%"
            value-format="YYYY-MM-DD"
          />
        </el-form-item>
        <el-row :gutter="16">
          <el-col :span="12">
            <el-form-item label="开始时间" prop="startTime">
              <el-time-picker
                v-model="form.startTime"
                placeholder="选择开始时间"
                style="width: 100%"
                value-format="HH:mm:ss"
              />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="结束时间" prop="endTime">
              <el-time-picker
                v-model="form.endTime"
                placeholder="选择结束时间"
                style="width: 100%"
                value-format="HH:mm:ss"
              />
            </el-form-item>
          </el-col>
        </el-row>
        <el-form-item label="预约状态" prop="status" v-if="isEdit">
          <el-select v-model="form.status" placeholder="请选择状态" style="width: 100%">
            <el-option label="待审批" value="pending" />
            <el-option label="已批准" value="approved" />
            <el-option label="已入场" value="checked_in" />
            <el-option label="已离场" value="checked_out" />
            <el-option label="已拒绝" value="rejected" />
          </el-select>
        </el-form-item>
        <el-form-item label="备注">
          <el-input v-model="form.notes" type="textarea" :rows="2" placeholder="备注信息，可选" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="submitForm">保存</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="checkInDialogVisible" title="访客签到入场" width="440px">
      <el-alert
        title="请确认访客已完成消毒"
        type="warning"
        :closable="false"
        show-icon
        style="margin-bottom: 16px;"
      />
      <el-form label-width="110px">
        <el-form-item label="访客姓名">
          <span>{{ currentVisitor?.name || '-' }}</span>
        </el-form-item>
        <el-form-item label="探视产妇">
          <span>{{ getMotherName(currentVisitor?.motherId) }}</span>
        </el-form-item>
        <el-form-item label="消毒完成">
          <el-checkbox v-model="disinfectionDone">已确认完成消毒</el-checkbox>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="checkInDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="confirmCheckIn">确认签到</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Plus } from '@element-plus/icons-vue'
import { visitorApi, motherApi } from '@/api'
import dayjs from 'dayjs'

const loading = ref(false)
const visitors = ref([])
const mothers = ref([])
const dialogVisible = ref(false)
const isEdit = ref(false)
const editId = ref(null)
const formRef = ref(null)

const checkInDialogVisible = ref(false)
const currentVisitor = ref(null)
const disinfectionDone = ref(false)

const defaultForm = {
  name: '',
  idCard: '',
  phone: '',
  relation: '',
  motherId: '',
  visitDate: dayjs().format('YYYY-MM-DD'),
  startTime: '10:00:00',
  endTime: '11:00:00',
  visitorCount: 1,
  notes: '',
  status: 'pending'
}

const form = reactive({ ...defaultForm })

const formRules = {
  name: [{ required: true, message: '请输入访客姓名', trigger: 'blur' }],
  idCard: [{ required: true, message: '请输入身份证号', trigger: 'blur' }],
  phone: [{ required: true, message: '请输入联系电话', trigger: 'blur' }],
  relation: [{ required: true, message: '请选择与产妇关系', trigger: 'change' }],
  motherId: [{ required: true, message: '请选择探视产妇', trigger: 'change' }],
  visitDate: [{ required: true, message: '请选择探视日期', trigger: 'change' }],
  startTime: [{ required: true, message: '请选择开始时间', trigger: 'change' }],
  endTime: [{ required: true, message: '请选择结束时间', trigger: 'change' }]
}

const fetchData = async () => {
  loading.value = true
  try {
    const [visitorsRes, mothersRes] = await Promise.all([
      visitorApi.list(),
      motherApi.list()
    ])
    visitors.value = visitorsRes.data?.data || visitorsRes.data || []
    mothers.value = mothersRes.data?.data || mothersRes.data || []
  } finally {
    loading.value = false
  }
}

const getMotherName = (id) => {
  if (!id) return '-'
  const m = mothers.value.find(x => x.id === id)
  return m?.name || '-'
}

const formatDate = (d) => {
  if (!d) return '-'
  return dayjs(d).format('YYYY-MM-DD')
}

const maskIdCard = (id) => {
  if (!id || id.length < 8) return id
  return id.slice(0, 4) + '********' + id.slice(-4)
}

const maskPhone = (p) => {
  if (!p || p.length < 7) return p
  return p.slice(0, 3) + '****' + p.slice(-4)
}

const statusTagType = (s) => {
  const map = {
    pending: 'warning',
    approved: 'primary',
    checked_in: 'success',
    checked_out: 'info',
    rejected: 'danger'
  }
  return map[s] || 'info'
}

const statusText = (s) => {
  const map = {
    pending: '待审批',
    approved: '已批准',
    checked_in: '已入场',
    checked_out: '已离场',
    rejected: '已拒绝'
  }
  return map[s] || s
}

const openAddDialog = () => {
  isEdit.value = false
  editId.value = null
  resetForm()
  dialogVisible.value = true
}

const handleEdit = (row) => {
  isEdit.value = true
  editId.value = row.id
  Object.assign(form, {
    name: row.name || '',
    idCard: row.idCard || '',
    phone: row.phone || '',
    relation: row.relation || '',
    motherId: row.motherId || '',
    visitDate: row.visitDate || dayjs().format('YYYY-MM-DD'),
    startTime: row.startTime || '10:00:00',
    endTime: row.endTime || '11:00:00',
    visitorCount: row.visitorCount || 1,
    notes: row.notes || '',
    status: row.status || 'pending'
  })
  dialogVisible.value = true
}

const resetForm = () => {
  Object.assign(form, defaultForm)
  if (formRef.value) formRef.value.clearValidate()
}

const submitForm = async () => {
  try {
    await formRef.value.validate()
  } catch { return }

  try {
    if (isEdit.value) {
      await visitorApi.update(editId.value, { ...form })
      ElMessage.success('预约更新成功')
    } else {
      await visitorApi.create({ ...form })
      ElMessage.success('预约创建成功')
    }
    dialogVisible.value = false
    await fetchData()
  } catch (e) {
    console.error(e)
  }
}

const handleApprove = async (row) => {
  try {
    await ElMessageBox.confirm('确定批准该访客预约吗？', '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'success'
    })
    await visitorApi.update(row.id, { status: 'approved' })
    ElMessage.success('已批准')
    await fetchData()
  } catch (e) {
    if (e !== 'cancel') console.error(e)
  }
}

const handleReject = async (row) => {
  try {
    await ElMessageBox.confirm('确定拒绝该访客预约吗？', '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    })
    await visitorApi.update(row.id, { status: 'rejected' })
    ElMessage.success('已拒绝')
    await fetchData()
  } catch (e) {
    if (e !== 'cancel') console.error(e)
  }
}

const handleCheckIn = (row) => {
  currentVisitor.value = row
  disinfectionDone.value = false
  checkInDialogVisible.value = true
}

const confirmCheckIn = async () => {
  if (!disinfectionDone.value) {
    ElMessage.warning('请先确认消毒已完成')
    return
  }
  try {
    await visitorApi.checkIn(currentVisitor.value.id, { disinfectionDone: true })
    ElMessage.success('签到成功')
    checkInDialogVisible.value = false
    await fetchData()
  } catch (e) {
    console.error(e)
  }
}

const handleCheckOut = async (row) => {
  try {
    await ElMessageBox.confirm('确认访客签退离场？', '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'info'
    })
    await visitorApi.checkOut(row.id)
    ElMessage.success('签退成功')
    await fetchData()
  } catch (e) {
    if (e !== 'cancel') console.error(e)
  }
}

const handleDelete = async (row) => {
  try {
    await visitorApi.remove(row.id)
    ElMessage.success('删除成功')
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
.visitors {
  padding: 20px;

  .card-header {
    display: flex;
    justify-content: space-between;
    align-items: center;

    .header-title {
      font-weight: 600;
      font-size: 16px;
    }
  }

  .empty-text {
    color: #c0c4cc;
  }
}
</style>
