<template>
  <div class="visitors">
    <el-card shadow="never">
      <template #header>
        <div class="card-header">
          <span class="header-title">访客核验管理</span>
          <div class="header-actions">
            <el-button type="primary" @click="openAddDialog">
              <el-icon><Plus /></el-icon>
              新增预约
            </el-button>
            <el-button @click="authListVisible = true">
              <el-icon><UserFilled /></el-icon>
              授权名单
            </el-button>
          </div>
        </div>
      </template>

      <el-table
        :data="visitors"
        stripe
        style="width: 100%"
        v-loading="loading"
        empty-text="暂无访客记录"
      >
        <el-table-column label="特殊探视" width="100" align="center">
          <template #default="{ row }">
            <el-tag v-if="row.isSpecial" type="danger" effect="light" size="small">特殊</el-tag>
            <span v-else class="normal-tag">常规</span>
          </template>
        </el-table-column>
        <el-table-column label="访客姓名" width="110" prop="name" />
        <el-table-column label="身份证号" width="190" prop="idCard">
          <template #default="{ row }">
            <span v-if="row.idCard">{{ row._idCardMasked || maskIdCard(row.idCard) }}</span>
            <span v-else>-</span>
          </template>
        </el-table-column>
        <el-table-column label="关系" width="90" prop="relation">
          <template #default="{ row }">
            <el-tag size="small" effect="light">{{ row.relation || '-' }}</el-tag>
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
        <el-table-column label="状态" width="130">
          <template #default="{ row }">
            <el-tag :type="statusTagType(row.status)">{{ statusText(row.status) }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="是否影响护理" width="110" align="center">
          <template #default="{ row }">
            <el-tag v-if="row.affectCarePlan" type="danger" size="small">是</el-tag>
            <span v-else-if="row.status === 'checked_out'">否</span>
            <span v-else>-</span>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="320" fixed="right">
          <template #default="{ row }">
            <template v-if="row.status === 'pending'">
              <el-button type="success" size="small" link @click="handleApprove(row)">批准</el-button>
              <el-button type="danger" size="small" link @click="handleReject(row)">拒绝</el-button>
            </template>
            <template v-if="row.status === 'need_head_nurse_approval'">
              <el-tag type="warning" size="small">待护士长审批</el-tag>
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
      <el-alert
        v-if="conflictWarnings.length > 0 || conflictErrors.length > 0"
        :title="conflictErrors.length > 0 ? '存在冲突，无法安排' : '存在需要注意的事项'"
        :type="conflictErrors.length > 0 ? 'error' : 'warning'"
        :closable="false"
        show-icon
        style="margin-bottom: 16px;"
      >
        <div v-for="(item, idx) in conflictErrors" :key="'e'+idx" class="conflict-item">{{ item.message }}</div>
        <div v-for="(item, idx) in conflictWarnings" :key="'w'+idx" class="conflict-item">{{ item.message }}</div>
      </el-alert>

      <el-form ref="formRef" :model="form" :rules="formRules" label-width="100px">
        <el-row :gutter="16">
          <el-col :span="12">
            <el-form-item label="访客姓名" prop="name">
              <el-input v-model="form.name" placeholder="请输入访客姓名" @blur="checkConflicts" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="联系电话" prop="phone">
              <el-input v-model="form.phone" placeholder="请输入联系电话" />
            </el-form-item>
          </el-col>
        </el-row>
        <el-form-item label="身份证号" prop="idCard">
          <el-input v-model="form.idCard" placeholder="请输入身份证号" @blur="checkConflicts" />
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
              <el-input-number v-model="form.visitorCount" :min="1" :max="10" style="width: 100%" @change="checkConflicts" />
            </el-form-item>
          </el-col>
        </el-row>
        <el-form-item label="探视产妇" prop="motherId">
          <el-select v-model="form.motherId" placeholder="请选择产妇" filterable style="width: 100%" @change="checkConflicts">
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
            @change="checkConflicts"
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
                @change="checkConflicts"
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
                @change="checkConflicts"
              />
            </el-form-item>
          </el-col>
        </el-row>
        <el-form-item label="预约状态" prop="status" v-if="isEdit">
          <el-select v-model="form.status" placeholder="请选择状态" style="width: 100%">
            <el-option label="待审批" value="pending" />
            <el-option label="已批准" value="approved" />
            <el-option label="待护士长审批" value="need_head_nurse_approval" />
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
        <el-button type="primary" @click="submitForm" :disabled="conflictErrors.length > 0 && !isEdit">
          保存
        </el-button>
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
        <el-form-item label="特殊探视">
          <el-tag v-if="currentVisitor?.isSpecial" type="danger" size="small">是</el-tag>
          <span v-else>否</span>
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

    <el-dialog v-model="checkOutDialogVisible" title="访客签退离场" width="480px" @close="resetCheckOutForm">
      <el-form ref="checkOutFormRef" :model="checkOutForm" :rules="checkOutRules" label-width="110px">
        <el-form-item label="访客姓名">
          <span>{{ currentVisitor?.name || '-' }}</span>
        </el-form-item>
        <el-form-item label="入场时间">
          <span>{{ formatDateTime(currentVisitor?.actualCheckIn) }}</span>
        </el-form-item>
        <el-form-item label="是否影响护理计划" prop="affectCarePlan">
          <el-radio-group v-model="checkOutForm.affectCarePlan">
            <el-radio :value="false">不影响</el-radio>
            <el-radio :value="true">有影响</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="护理影响说明" v-if="checkOutForm.affectCarePlan" prop="carePlanNote">
          <el-input v-model="checkOutForm.carePlanNote" type="textarea" :rows="3" placeholder="请说明对护理计划的影响" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="checkOutDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="confirmCheckOut">确认签退</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="authListVisible" title="探视授权名单管理" width="720px">
      <div class="auth-list-header">
        <el-select v-model="authListMotherId" placeholder="选择产妇" style="width: 200px" @change="fetchAuthList">
          <el-option v-for="m in mothers" :key="m.id" :label="m.name" :value="m.id" />
        </el-select>
        <el-button type="primary" :disabled="!authListMotherId" @click="openAddAuthDialog">
          <el-icon><Plus /></el-icon>
          添加授权
        </el-button>
      </div>

      <el-table :data="authList" stripe style="width: 100%; margin-top: 16px;" v-loading="authListLoading" empty-text="暂无授权访客">
        <el-table-column label="姓名" width="120" prop="name" />
        <el-table-column label="关系" width="100" prop="relation" />
        <el-table-column label="身份证号" width="200">
          <template #default="{ row }">{{ row.idCardMasked || '-' }}</template>
        </el-table-column>
        <el-table-column label="联系电话" width="140">
          <template #default="{ row }">{{ row.phoneMasked || '-' }}</template>
        </el-table-column>
        <el-table-column label="状态" width="100">
          <template #default="{ row }">
            <el-tag :type="row.status === 'authorized' ? 'success' : 'info'" size="small">
              {{ row.status === 'authorized' ? '已授权' : '已取消' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="120" fixed="right">
          <template #default="{ row }">
            <el-popconfirm title="确定删除该授权吗？" @confirm="deleteAuth(row)">
              <template #reference>
                <el-button type="danger" size="small" link>删除</el-button>
              </template>
            </el-popconfirm>
          </template>
        </el-table-column>
      </el-table>

      <el-dialog v-model="addAuthDialogVisible" title="添加授权访客" width="480px" @close="resetAuthForm">
        <el-form ref="authFormRef" :model="authForm" :rules="authFormRules" label-width="100px">
          <el-form-item label="访客姓名" prop="name">
            <el-input v-model="authForm.name" placeholder="请输入访客姓名" />
          </el-form-item>
          <el-form-item label="与产妇关系" prop="relation">
            <el-select v-model="authForm.relation" placeholder="请选择关系" style="width: 100%" filterable allow-create>
              <el-option label="丈夫" value="丈夫" />
              <el-option label="母亲" value="母亲" />
              <el-option label="父亲" value="父亲" />
              <el-option label="姐妹" value="姐妹" />
              <el-option label="兄弟" value="兄弟" />
              <el-option label="朋友" value="朋友" />
              <el-option label="其他亲属" value="其他亲属" />
            </el-select>
          </el-form-item>
          <el-form-item label="身份证号" prop="idCard">
            <el-input v-model="authForm.idCard" placeholder="请输入身份证号" />
          </el-form-item>
          <el-form-item label="联系电话" prop="phone">
            <el-input v-model="authForm.phone" placeholder="请输入联系电话" />
          </el-form-item>
        </el-form>
        <template #footer>
          <el-button @click="addAuthDialogVisible = false">取消</el-button>
          <el-button type="primary" @click="submitAuth">添加</el-button>
        </template>
      </el-dialog>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, watch } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Plus, UserFilled } from '@element-plus/icons-vue'
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
const checkOutDialogVisible = ref(false)
const currentVisitor = ref(null)
const disinfectionDone = ref(false)
const checkOutFormRef = ref(null)

const conflictErrors = ref([])
const conflictWarnings = ref([])

const authListVisible = ref(false)
const authListLoading = ref(false)
const authListMotherId = ref('')
const authList = ref([])
const addAuthDialogVisible = ref(false)
const authFormRef = ref(null)

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

const checkOutForm = reactive({
  affectCarePlan: false,
  carePlanNote: ''
})

const checkOutRules = {
  affectCarePlan: [{ required: true, message: '请选择是否影响护理计划', trigger: 'change' }]
}

const authForm = reactive({
  name: '',
  relation: '',
  idCard: '',
  phone: ''
})

const authFormRules = {
  name: [{ required: true, message: '请输入访客姓名', trigger: 'blur' }],
  relation: [{ required: true, message: '请选择关系', trigger: 'change' }]
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

const formatDateTime = (d) => {
  if (!d) return '-'
  return dayjs(d).format('YYYY-MM-DD HH:mm')
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
    rejected: 'danger',
    need_head_nurse_approval: 'danger'
  }
  return map[s] || 'info'
}

const statusText = (s) => {
  const map = {
    pending: '待审批',
    approved: '已批准',
    checked_in: '已入场',
    checked_out: '已离场',
    rejected: '已拒绝',
    need_head_nurse_approval: '待护士长审批'
  }
  return map[s] || s
}

const checkConflicts = async () => {
  if (!form.motherId || !form.visitDate || !form.startTime || !form.endTime) {
    conflictErrors.value = []
    conflictWarnings.value = []
    return
  }

  try {
    const res = await visitorApi.checkConflicts({
      motherId: form.motherId,
      visitDate: form.visitDate,
      startTime: form.startTime,
      endTime: form.endTime,
      idCard: form.idCard,
      name: form.name,
      visitorCount: form.visitorCount,
      status: 'approved'
    })
    const data = res.data?.data || res.data || {}
    conflictErrors.value = data.conflicts || []
    conflictWarnings.value = data.warnings || []
  } catch (e) {
    console.error('检查冲突失败', e)
    conflictErrors.value = []
    conflictWarnings.value = []
  }
}

const openAddDialog = () => {
  isEdit.value = false
  editId.value = null
  resetForm()
  conflictErrors.value = []
  conflictWarnings.value = []
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
  conflictErrors.value = []
  conflictWarnings.value = []
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
      const res = await visitorApi.create({ ...form })
      const data = res.data?.data || res.data || {}
      if (data.isSpecial) {
        ElMessage.warning('本次为特殊探视，已提交护士长审批')
      } else {
        ElMessage.success('预约创建成功')
      }
    }
    dialogVisible.value = false
    await fetchData()
  } catch (e) {
    console.error(e)
    ElMessage.error('操作失败')
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
    const { value: reason } = await ElMessageBox.prompt('请输入拒绝原因', '拒绝预约', {
      confirmButtonText: '确定拒绝',
      cancelButtonText: '取消',
      inputType: 'textarea',
      inputPlaceholder: '请输入拒绝原因'
    })
    await visitorApi.update(row.id, { status: 'rejected', rejectReason: reason })
    ElMessage.success('已拒绝')
    await fetchData()
  } catch (e) {
    if (e !== 'cancel') console.error(e)
  }
}

const handleCheckIn = (row) => {
  if (row.status === 'need_head_nurse_approval') {
    ElMessage.warning('该特殊探视需护士长审批后方可入场')
    return
  }
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
    ElMessage.error(e?.response?.data?.error || '签到失败')
  }
}

const handleCheckOut = (row) => {
  currentVisitor.value = row
  resetCheckOutForm()
  checkOutDialogVisible.value = true
}

const resetCheckOutForm = () => {
  checkOutForm.affectCarePlan = false
  checkOutForm.carePlanNote = ''
  if (checkOutFormRef.value) checkOutFormRef.value.clearValidate()
}

const confirmCheckOut = async () => {
  try {
    await visitorApi.checkOut(currentVisitor.value.id, {
      affectCarePlan: checkOutForm.affectCarePlan,
      carePlanNote: checkOutForm.carePlanNote
    })
    ElMessage.success('签退成功')
    checkOutDialogVisible.value = false
    await fetchData()
  } catch (e) {
    console.error(e)
    ElMessage.error('签退失败')
  }
}

const handleDelete = async (row) => {
  try {
    await visitorApi.remove(row.id)
    ElMessage.success('删除成功')
    await fetchData()
  } catch (e) {
    console.error(e)
    ElMessage.error('删除失败')
  }
}

const fetchAuthList = async () => {
  if (!authListMotherId.value) {
    authList.value = []
    return
  }
  authListLoading.value = true
  try {
    const res = await visitorApi.getAuthList({ motherId: authListMotherId.value })
    authList.value = res.data?.data || res.data || []
  } finally {
    authListLoading.value = false
  }
}

const openAddAuthDialog = () => {
  resetAuthForm()
  addAuthDialogVisible.value = true
}

const resetAuthForm = () => {
  authForm.name = ''
  authForm.relation = ''
  authForm.idCard = ''
  authForm.phone = ''
  if (authFormRef.value) authFormRef.value.clearValidate()
}

const submitAuth = async () => {
  try {
    await authFormRef.value.validate()
  } catch { return }

  try {
    await visitorApi.addAuth({
      motherId: authListMotherId.value,
      ...authForm
    })
    ElMessage.success('添加授权成功')
    addAuthDialogVisible.value = false
    await fetchAuthList()
  } catch (e) {
    console.error(e)
    ElMessage.error('添加失败')
  }
}

const deleteAuth = async (row) => {
  try {
    await visitorApi.removeAuth(row.id)
    ElMessage.success('删除成功')
    await fetchAuthList()
  } catch (e) {
    console.error(e)
    ElMessage.error('删除失败')
  }
}

watch(authListVisible, (val) => {
  if (val && mothers.value.length > 0 && !authListMotherId.value) {
    authListMotherId.value = mothers.value[0]?.id || ''
    fetchAuthList()
  }
})

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

    .header-actions {
      display: flex;
      gap: 10px;
    }
  }

  .normal-tag {
    color: #67c23a;
    font-size: 13px;
  }

  .conflict-item {
    font-size: 13px;
    line-height: 1.8;
  }

  .auth-list-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
  }

  .empty-text {
    color: #c0c4cc;
  }
}
</style>
