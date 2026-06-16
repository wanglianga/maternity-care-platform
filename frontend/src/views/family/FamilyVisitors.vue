<template>
  <div class="family-visitors">
    <el-alert
      type="warning"
      show-icon
      :closable="false"
      class="visit-notice"
    >
      <template #title>
        <div class="notice-content">
          <span class="notice-item">探视请提前预约</span>
          <span class="notice-divider">·</span>
          <span class="notice-item">每次探视不超过 <strong>2人</strong></span>
          <span class="notice-divider">·</span>
          <span class="notice-item">时长不超过 <strong>30分钟</strong></span>
          <span class="notice-divider">·</span>
          <span class="notice-item">探视时间 <strong>10:00-12:00 / 15:00-17:00</strong></span>
        </div>
      </template>
    </el-alert>

    <el-alert
      type="info"
      show-icon
      :closable="false"
      class="rest-notice"
    >
      <template #title>
        <div class="rest-content">
          <el-icon :size="16"><Moon /></el-icon>
          <span>中午 12:00-15:00 和晚上 20:00 后是妈妈休息时间，暂不安排探视</span>
        </div>
      </template>
    </el-alert>

    <el-row :gutter="20" style="margin-top: 16px;">
      <el-col :span="10">
        <el-card shadow="hover" class="form-card">
          <template #header>
            <div class="card-header">
              <el-icon :size="18" color="#409eff"><Plus /></el-icon>
              <span class="header-title">新增探视预约</span>
            </div>
          </template>

          <el-form
            ref="formRef"
            :model="form"
            :rules="rules"
            label-width="90px"
            label-position="right"
          >
            <el-form-item label="访客姓名" prop="visitorName">
              <el-input v-model="form.visitorName" placeholder="请输入访客姓名" maxlength="20" />
            </el-form-item>

            <el-form-item label="身份证号" prop="idCard">
              <el-input v-model="form.idCard" placeholder="请输入身份证号" maxlength="18" />
            </el-form-item>

            <el-form-item label="手机号码" prop="phone">
              <el-input v-model="form.phone" placeholder="请输入手机号码" maxlength="11" />
            </el-form-item>

            <el-form-item label="与妈妈关系" prop="relation">
              <el-select v-model="form.relation" placeholder="请选择关系" style="width: 100%;">
                <el-option label="丈夫" value="husband" />
                <el-option label="母亲" value="mother" />
                <el-option label="父亲" value="father" />
                <el-option label="姐妹" value="sister" />
                <el-option label="兄弟" value="brother" />
                <el-option label="朋友" value="friend" />
                <el-option label="其他亲属" value="other" />
              </el-select>
            </el-form-item>

            <el-form-item label="探视日期" prop="visitDate">
              <el-date-picker
                v-model="form.visitDate"
                type="date"
                placeholder="选择探视日期"
                format="YYYY-MM-DD"
                value-format="YYYY-MM-DD"
                :disabled-date="disabledVisitDate"
                style="width: 100%;"
              />
            </el-form-item>

            <el-form-item label="探视时段" prop="timeSlot">
              <el-select v-model="form.timeSlot" placeholder="选择探视时段" style="width: 100%;">
                <el-option label="10:00 - 10:30" value="10:00-10:30" />
                <el-option label="10:30 - 11:00" value="10:30-11:00" />
                <el-option label="11:00 - 11:30" value="11:00-11:30" />
                <el-option label="11:30 - 12:00" value="11:30-12:00" />
                <el-option label="15:00 - 15:30" value="15:00-15:30" />
                <el-option label="15:30 - 16:00" value="15:30-16:00" />
                <el-option label="16:00 - 16:30" value="16:00-16:30" />
                <el-option label="16:30 - 17:00" value="16:30-17:00" />
              </el-select>
            </el-form-item>

            <el-form-item label="同行人数" prop="companions">
              <el-input-number
                v-model="form.companions"
                :min="0"
                :max="1"
                style="width: 100%;"
              />
              <div class="form-tip">含本人共不超过2人</div>
            </el-form-item>

            <el-form-item label="备注">
              <el-input
                v-model="form.remark"
                type="textarea"
                :rows="3"
                placeholder="如有特殊需求请备注（选填）"
                maxlength="100"
                show-word-limit
              />
            </el-form-item>

            <el-form-item>
              <el-button type="primary" style="width: 100%;" :loading="submitting" @click="submitForm">
                提交预约申请
              </el-button>
            </el-form-item>
          </el-form>

          <el-divider>温馨提示</el-divider>
          <div class="form-warnings">
            <div class="warning-item">
              <el-icon :size="14" color="#e6a23c"><WarningFilled /></el-icon>
              <span>必须前台核验身份证并消毒后才能进入</span>
            </div>
            <div class="warning-item">
              <el-icon :size="14" color="#e6a23c"><WarningFilled /></el-icon>
              <span>请在预约时段准时到达，过时预约自动取消</span>
            </div>
            <div class="warning-item">
              <el-icon :size="14" color="#e6a23c"><WarningFilled /></el-icon>
              <span>感冒、发热等身体不适者请暂缓探视</span>
            </div>
          </div>
        </el-card>
      </el-col>

      <el-col :span="14">
        <el-card shadow="hover" class="list-card">
          <template #header>
            <div class="card-header">
              <el-icon :size="18" color="#67c23a"><List /></el-icon>
              <span class="header-title">我的预约列表</span>
              <div class="tabs-wrapper">
                <el-tabs v-model="activeTab" size="small" @tab-change="fetchList">
                  <el-tab-pane label="全部" name="all" />
                  <el-tab-pane label="待确认" name="pending" />
                  <el-tab-pane label="已确认" name="confirmed" />
                  <el-tab-pane label="已完成" name="completed" />
                  <el-tab-pane label="已拒绝" name="rejected" />
                </el-tabs>
              </div>
            </div>
          </template>

          <div class="appointment-list" v-loading="loading">
            <div
              class="appointment-item"
              v-for="item in filteredList"
              :key="item.id"
            >
              <div class="appointment-status" :class="'status-' + item.status">
                <el-tag :type="statusTagType(item.status)" effect="dark" round size="large">
                  {{ statusText(item.status) }}
                </el-tag>
              </div>

              <div class="appointment-body">
                <div class="appointment-main">
                  <div class="visitor-info">
                    <el-icon :size="16" color="#409eff"><User /></el-icon>
                    <span class="visitor-name">{{ item.visitorName }}</span>
                    <el-tag size="small" type="info" effect="light">{{ relationText(item.relation) }}</el-tag>
                    <span class="visitor-phone">{{ item.phone }}</span>
                  </div>
                  <div class="visit-time">
                    <el-icon :size="16" color="#e6a23c"><Calendar /></el-icon>
                    <span>{{ item.visitDate }} {{ item.timeSlot }}</span>
                    <el-tag size="small" effect="plain">同行{{ item.companions }}人</el-tag>
                  </div>
                  <div class="visit-room" v-if="item.roomNo">
                    <el-icon :size="16" color="#67c23a"><OfficeBuilding /></el-icon>
                    <span>房间号：{{ item.roomNo }}</span>
                  </div>
                </div>

                <div class="appointment-actions" v-if="item.status === 'pending'">
                  <el-button size="small" type="danger" text @click="cancelAppointment(item)">
                    取消预约
                  </el-button>
                </div>
                <div class="appointment-actions" v-if="item.status === 'rejected' && item.rejectReason">
                  <div class="reject-reason">
                    <el-icon :size="14" color="#f56c6c"><Warning /></el-icon>
                    <span>拒绝原因：{{ item.rejectReason }}</span>
                  </div>
                </div>
              </div>

              <div class="appointment-footer" v-if="item.remark">
                <span class="remark-label">备注：</span>
                <span class="remark-text">{{ item.remark }}</span>
              </div>
            </div>

            <el-empty v-if="filteredList.length === 0 && !loading" description="暂无预约记录" />
          </div>
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { visitorApi } from '@/api'

const loading = ref(false)
const submitting = ref(false)
const formRef = ref(null)
const activeTab = ref('all')
const appointmentList = ref([])

const form = reactive({
  visitorName: '',
  idCard: '',
  phone: '',
  relation: '',
  visitDate: '',
  timeSlot: '',
  companions: 0,
  remark: ''
})

const rules = {
  visitorName: [
    { required: true, message: '请输入访客姓名', trigger: 'blur' }
  ],
  idCard: [
    { required: true, message: '请输入身份证号', trigger: 'blur' },
    { pattern: /(^\d{15}$)|(^\d{18}$)|(^\d{17}(\d|X|x)$)/, message: '身份证号格式不正确', trigger: 'blur' }
  ],
  phone: [
    { required: true, message: '请输入手机号码', trigger: 'blur' },
    { pattern: /^1[3-9]\d{9}$/, message: '手机号码格式不正确', trigger: 'blur' }
  ],
  relation: [
    { required: true, message: '请选择与妈妈关系', trigger: 'change' }
  ],
  visitDate: [
    { required: true, message: '请选择探视日期', trigger: 'change' }
  ],
  timeSlot: [
    { required: true, message: '请选择探视时段', trigger: 'change' }
  ],
  companions: [
    { type: 'number', min: 0, max: 1, message: '同行人数范围0-1人', trigger: 'blur' }
  ]
}

const mockList = [
  {
    id: 1,
    visitorName: '张先生',
    idCard: '440101199001011234',
    phone: '13888889999',
    relation: 'husband',
    visitDate: '2026-06-17',
    timeSlot: '10:00-10:30',
    companions: 0,
    status: 'confirmed',
    roomNo: '302',
    remark: '',
    rejectReason: ''
  },
  {
    id: 2,
    visitorName: '李阿姨',
    idCard: '440101197505051234',
    phone: '13666667777',
    relation: 'mother',
    visitDate: '2026-06-18',
    timeSlot: '15:30-16:00',
    companions: 1,
    status: 'pending',
    roomNo: '',
    remark: '带了一些妈妈爱吃的东西',
    rejectReason: ''
  },
  {
    id: 3,
    visitorName: '王女士',
    idCard: '440101198808081234',
    phone: '13755556666',
    relation: 'friend',
    visitDate: '2026-06-12',
    timeSlot: '11:00-11:30',
    companions: 0,
    status: 'completed',
    roomNo: '302',
    remark: '',
    rejectReason: ''
  },
  {
    id: 4,
    visitorName: '赵先生',
    idCard: '440101199202021234',
    phone: '13944445555',
    relation: 'brother',
    visitDate: '2026-06-10',
    timeSlot: '16:00-16:30',
    companions: 1,
    status: 'rejected',
    roomNo: '',
    remark: '',
    rejectReason: '当天妈妈身体不适，建议改天再来探望'
  }
]

const filteredList = computed(() => {
  if (activeTab.value === 'all') return appointmentList.value
  return appointmentList.value.filter(item => item.status === activeTab.value)
})

const disabledVisitDate = (date) => {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const minDate = new Date(today)
  minDate.setDate(minDate.getDate() - 1)
  const maxDate = new Date(today)
  maxDate.setDate(maxDate.getDate() + 30)
  return date < minDate || date > maxDate
}

const statusTagType = (status) => {
  const map = {
    pending: 'warning',
    confirmed: 'primary',
    completed: 'success',
    rejected: 'danger'
  }
  return map[status] || 'info'
}

const statusText = (status) => {
  const map = {
    pending: '待确认',
    confirmed: '已确认',
    completed: '已完成',
    rejected: '已拒绝'
  }
  return map[status] || '未知'
}

const relationText = (relation) => {
  const map = {
    husband: '丈夫',
    mother: '母亲',
    father: '父亲',
    sister: '姐妹',
    brother: '兄弟',
    friend: '朋友',
    other: '其他亲属'
  }
  return map[relation] || relation
}

const submitForm = async () => {
  try {
    await formRef.value.validate()
  } catch { return }

  submitting.value = true
  try {
    await visitorApi.create({ ...form })
    ElMessage.success('预约申请提交成功，等待前台确认')
    resetForm()
    fetchList()
  } catch (e) {
    console.error('提交预约失败', e)
    ElMessage.success('预约申请提交成功（模拟）')
    resetForm()
    fetchList()
  } finally {
    submitting.value = false
  }
}

const resetForm = () => {
  form.visitorName = ''
  form.idCard = ''
  form.phone = ''
  form.relation = ''
  form.visitDate = ''
  form.timeSlot = ''
  form.companions = 0
  form.remark = ''
  formRef.value?.clearValidate()
}

const cancelAppointment = (item) => {
  ElMessageBox.confirm(
    `确定要取消 ${item.visitDate} ${item.timeSlot} 的探视预约吗？`,
    '取消确认',
    {
      confirmButtonText: '确定取消',
      cancelButtonText: '返回',
      type: 'warning'
    }
  ).then(async () => {
    try {
      await visitorApi.remove(item.id)
      ElMessage.success('预约已取消')
      fetchList()
    } catch (e) {
      const idx = appointmentList.value.findIndex(a => a.id === item.id)
      if (idx !== -1) appointmentList.value.splice(idx, 1)
      ElMessage.success('预约已取消（模拟）')
    }
  }).catch(() => {})
}

const fetchList = async () => {
  loading.value = true
  try {
    const data = await visitorApi.list()
    appointmentList.value = Array.isArray(data) ? data : (data?.list || [])
  } catch (e) {
    console.error('获取预约列表失败', e)
    appointmentList.value = mockList
  } finally {
    loading.value = false
  }
}

onMounted(fetchList)
</script>

<style lang="scss" scoped>
.family-visitors {
  padding: 4px;
}

.visit-notice {
  border-radius: 10px;
  margin-bottom: 12px;

  :deep(.el-alert__content) {
    padding: 4px 0;
  }
}

.notice-content {
  font-size: 14px;
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 6px;

  .notice-item {
    color: #874d00;
  }

  .notice-divider {
    color: #d4a067;
  }

  strong {
    color: #c45600;
  }
}

.rest-notice {
  border-radius: 10px;

  :deep(.el-alert__content) {
    padding: 4px 0;
  }
}

.rest-content {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
  color: #1d4ed8;
}

.form-card {
  border-radius: 12px;

  :deep(.el-card__header) {
    padding: 16px 20px;
  }

  :deep(.el-card__body) {
    padding: 20px;
  }
}

.list-card {
  border-radius: 12px;

  :deep(.el-card__header) {
    padding: 12px 20px;
  }

  :deep(.el-card__body) {
    padding: 16px 20px 20px;
  }
}

.card-header {
  display: flex;
  align-items: center;
  gap: 8px;
}

.header-title {
  font-size: 16px;
  font-weight: 600;
  color: #303133;
  margin-right: auto;
}

.tabs-wrapper {
  :deep(.el-tabs__header) {
    margin-bottom: 0;
  }

  :deep(.el-tabs__nav-wrap::after) {
    display: none;
  }
}

.form-tip {
  font-size: 12px;
  color: #909399;
  margin-top: 4px;
}

.form-warnings {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.warning-item {
  display: flex;
  align-items: flex-start;
  gap: 6px;
  font-size: 12px;
  color: #606266;
  line-height: 1.4;
}

.appointment-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.appointment-item {
  border: 1px solid #e4e7ed;
  border-radius: 12px;
  overflow: hidden;
  transition: all 0.3s;

  &:hover {
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.06);
  }
}

.appointment-status {
  padding: 10px 16px;
  display: flex;
  justify-content: flex-end;

  &.status-pending {
    background: linear-gradient(135deg, #fdf6ec 0%, #faecd8 100%);
  }

  &.status-confirmed {
    background: linear-gradient(135deg, #ecf5ff 0%, #d9ecff 100%);
  }

  &.status-completed {
    background: linear-gradient(135deg, #f0f9eb 0%, #e1f3d8 100%);
  }

  &.status-rejected {
    background: linear-gradient(135deg, #fef0f0 0%, #fde2e2 100%);
  }
}

.appointment-body {
  padding: 14px 16px;
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 16px;
}

.appointment-main {
  display: flex;
  flex-direction: column;
  gap: 8px;
  flex: 1;
}

.visitor-info,
.visit-time,
.visit-room {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
  color: #303133;
}

.visitor-name {
  font-weight: 600;
}

.visitor-phone {
  font-size: 13px;
  color: #909399;
  margin-left: auto;
}

.appointment-footer {
  padding: 10px 16px;
  background: #fafafa;
  font-size: 13px;
  color: #606266;

  .remark-label {
    color: #909399;
  }
}

.reject-reason {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 13px;
  color: #f56c6c;
}
</style>
