<template>
  <div class="visitor-approval">
    <el-card shadow="never">
      <template #header>
        <div class="card-header">
          <span class="header-title">特殊探视审批</span>
          <div class="header-actions">
            <el-radio-group v-model="statusFilter" size="default" @change="fetchData">
              <el-radio-button label="all">全部</el-radio-button>
              <el-radio-button label="need_head_nurse_approval">待审批</el-radio-button>
              <el-radio-button label="approved">已批准</el-radio-button>
              <el-radio-button label="rejected">已拒绝</el-radio-button>
            </el-radio-group>
          </div>
        </div>
      </template>

      <el-table
        :data="visitors"
        stripe
        style="width: 100%"
        v-loading="loading"
        empty-text="暂无特殊探视记录"
      >
        <el-table-column label="访客姓名" width="110" prop="name" />
        <el-table-column label="关系" width="100" prop="relation">
          <template #default="{ row }">
            <el-tag size="small" effect="light">{{ row.relation || '-' }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="探视产妇" width="110">
          <template #default="{ row }">{{ getMotherName(row.motherId) }}</template>
        </el-table-column>
        <el-table-column label="探视日期" width="120">
          <template #default="{ row }">{{ formatDate(row.visitDate) }}</template>
        </el-table-column>
        <el-table-column label="时段" width="140">
          <template #default="{ row }">
            <span v-if="row.startTime && row.endTime">
              {{ row.startTime?.slice(0, 5) }} - {{ row.endTime?.slice(0, 5) }}
            </span>
            <span v-else>-</span>
          </template>
        </el-table-column>
        <el-table-column label="人数" width="70" prop="visitorCount">
          <template #default="{ row }">{{ row.visitorCount || 1 }}人</template>
        </el-table-column>
        <el-table-column label="特殊原因" min-width="180">
          <template #default="{ row }">
            <el-tag v-if="row.isSpecial && row.headNurseNote" type="info" size="small">
              {{ row.headNurseNote?.substring?.(0, 20) || '特殊探视' }}
            </el-tag>
            <el-tag v-else-if="row.isSpecial" type="warning" size="small">特殊探视</el-tag>
            <span v-else>-</span>
          </template>
        </el-table-column>
        <el-table-column label="状态" width="130">
          <template #default="{ row }">
            <el-tag :type="statusTagType(row.status)">{{ statusText(row.status) }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="审批人" width="100">
          <template #default="{ row }">
            <span v-if="row.headNurseApprovedBy">{{ getUserName(row.headNurseApprovedBy) }}</span>
            <span v-else>-</span>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="260" fixed="right">
          <template #default="{ row }">
            <el-button type="primary" size="small" link @click="viewDetail(row)">详情</el-button>
            <template v-if="row.status === 'need_head_nurse_approval'">
              <el-button type="success" size="small" link @click="handleApprove(row)">批准</el-button>
              <el-button type="danger" size="small" link @click="handleReject(row)">拒绝</el-button>
            </template>
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <el-dialog v-model="detailVisible" title="探视详情" width="560px">
      <el-descriptions :column="2" border v-if="currentVisitor">
        <el-descriptions-item label="访客姓名">{{ currentVisitor.name }}</el-descriptions-item>
        <el-descriptions-item label="与产妇关系">{{ currentVisitor.relation || '-' }}</el-descriptions-item>
        <el-descriptions-item label="身份证号">{{ currentVisitor._idCardMasked || '-' }}</el-descriptions-item>
        <el-descriptions-item label="联系电话">{{ currentVisitor._phoneMasked || '-' }}</el-descriptions-item>
        <el-descriptions-item label="探视产妇">{{ getMotherName(currentVisitor.motherId) }}</el-descriptions-item>
        <el-descriptions-item label="探视人数">{{ currentVisitor.visitorCount || 1 }}人</el-descriptions-item>
        <el-descriptions-item label="探视日期" :span="2">{{ formatDate(currentVisitor.visitDate) }}</el-descriptions-item>
        <el-descriptions-item label="预约时段" :span="2">
          {{ currentVisitor.startTime?.slice(0, 5) || '-' }} - {{ currentVisitor.endTime?.slice(0, 5) || '-' }}
        </el-descriptions-item>
        <el-descriptions-item label="是否特殊探视" :span="2">
          <el-tag :type="currentVisitor.isSpecial ? 'danger' : 'success'" size="small">
            {{ currentVisitor.isSpecial ? '是' : '否' }}
          </el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="备注" :span="2">{{ currentVisitor.notes || '-' }}</el-descriptions-item>
        <el-descriptions-item label="审批状态" :span="2">
          <el-tag :type="statusTagType(currentVisitor.status)">{{ statusText(currentVisitor.status) }}</el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="审批意见" :span="2" v-if="currentVisitor.headNurseNote">
          {{ currentVisitor.headNurseNote }}
        </el-descriptions-item>
      </el-descriptions>
      <template #footer v-if="currentVisitor?.status === 'need_head_nurse_approval'">
        <el-button @click="handleReject(currentVisitor)" type="danger">拒绝</el-button>
        <el-button type="primary" @click="handleApprove(currentVisitor)">批准</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="approveDialogVisible" title="批准特殊探视" width="480px">
      <el-form ref="approveFormRef" :model="approveForm" :rules="approveRules" label-width="110px">
        <el-form-item label="护理计划影响" prop="affectCarePlan">
          <el-radio-group v-model="approveForm.affectCarePlan">
            <el-radio :value="false">不影响</el-radio>
            <el-radio :value="true">有影响</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="审批备注" prop="note">
          <el-input v-model="approveForm.note" type="textarea" :rows="3" placeholder="请填写审批意见（选填）" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="approveDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="confirmApprove">确认批准</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="rejectDialogVisible" title="拒绝特殊探视" width="480px">
      <el-form ref="rejectFormRef" :model="rejectForm" :rules="rejectRules" label-width="110px">
        <el-form-item label="拒绝原因" prop="note">
          <el-input v-model="rejectForm.note" type="textarea" :rows="4" placeholder="请填写拒绝原因" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="rejectDialogVisible = false">取消</el-button>
        <el-button type="danger" @click="confirmReject">确认拒绝</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { visitorApi, motherApi } from '@/api'
import dayjs from 'dayjs'

const loading = ref(false)
const visitors = ref([])
const mothers = ref([])
const users = ref([])
const statusFilter = ref('need_head_nurse_approval')

const detailVisible = ref(false)
const currentVisitor = ref(null)

const approveDialogVisible = ref(false)
const rejectDialogVisible = ref(false)
const approveFormRef = ref(null)
const rejectFormRef = ref(null)

const approveForm = reactive({
  affectCarePlan: false,
  note: ''
})

const rejectForm = reactive({
  note: ''
})

const approveRules = {
  note: [{ min: 0, max: 200, message: '审批备注不超过200字', trigger: 'blur' }]
}

const rejectRules = {
  note: [{ required: true, message: '请填写拒绝原因', trigger: 'blur' }]
}

const fetchData = async () => {
  loading.value = true
  try {
    const params = statusFilter.value === 'all' ? {} : { status: statusFilter.value }
    const [visitorsRes, mothersRes] = await Promise.all([
      visitorApi.list(params),
      motherApi.list()
    ])
    const allVisitors = visitorsRes.data?.data || visitorsRes.data || []
    visitors.value = allVisitors.filter(v => v.isSpecial || v.status === 'need_head_nurse_approval')
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

const getUserName = (id) => {
  if (!id) return '-'
  const u = users.value.find(x => x.id === id)
  return u?.name || u?.username || '-'
}

const formatDate = (d) => {
  if (!d) return '-'
  return dayjs(d).format('YYYY-MM-DD')
}

const statusTagType = (s) => {
  const map = {
    pending: 'warning',
    approved: 'success',
    checked_in: 'primary',
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

const viewDetail = (row) => {
  currentVisitor.value = row
  detailVisible.value = true
}

const handleApprove = (row) => {
  currentVisitor.value = row
  approveForm.affectCarePlan = false
  approveForm.note = ''
  approveDialogVisible.value = true
}

const confirmApprove = async () => {
  try {
    await visitorApi.approveSpecial(currentVisitor.value.id, {
      approved: true,
      note: approveForm.note,
      affectCarePlan: approveForm.affectCarePlan
    })
    ElMessage.success('审批通过')
    approveDialogVisible.value = false
    detailVisible.value = false
    await fetchData()
  } catch (e) {
    console.error(e)
    ElMessage.error('操作失败')
  }
}

const handleReject = (row) => {
  currentVisitor.value = row
  rejectForm.note = ''
  rejectDialogVisible.value = true
}

const confirmReject = async () => {
  try {
    await rejectFormRef.value.validate()
  } catch { return }

  try {
    await visitorApi.approveSpecial(currentVisitor.value.id, {
      approved: false,
      note: rejectForm.note
    })
    ElMessage.success('已拒绝')
    rejectDialogVisible.value = false
    detailVisible.value = false
    await fetchData()
  } catch (e) {
    console.error(e)
    ElMessage.error('操作失败')
  }
}

onMounted(() => {
  fetchData()
})
</script>

<style lang="scss" scoped>
.visitor-approval {
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
}
</style>
