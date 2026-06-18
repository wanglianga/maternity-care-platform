<template>
  <div class="baby-abnormal-manage">
    <el-card shadow="never">
      <template #header>
        <div class="card-header">
          <span class="header-title">宝宝异常观察管理</span>
          <div class="header-filters">
            <el-select v-model="filterStatus" placeholder="全部状态" style="width: 140px" @change="fetchData" clearable>
              <el-option label="待处理" value="pending" />
              <el-option label="已安排复测" value="recheck_scheduled" />
              <el-option label="持续观察中" value="observing" />
              <el-option label="建议就医" value="hospital_advice" />
              <el-option label="已处理完成" value="resolved" />
            </el-select>
          </div>
        </div>
      </template>

      <el-table :data="records" stripe v-loading="loading" empty-text="暂无异常观察记录">
        <el-table-column label="宝宝姓名" width="120">
          <template #default="{ row }">{{ row.babyName || '-' }}</template>
        </el-table-column>
        <el-table-column label="异常类型" width="120">
          <template #default="{ row }">
            <el-tag :type="abnormalTypeTagType(row.abnormalType)" effect="light">
              {{ row.abnormalTypeName || row.abnormalType }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="发生时间" width="160">
          <template #default="{ row }">{{ formatDateTime(row.occurTime) }}</template>
        </el-table-column>
        <el-table-column label="状态" width="130">
          <template #default="{ row }">
            <el-tag :type="statusTagType(row.status)">{{ row.statusName || row.status }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="提交人" width="90" prop="reporterName" />
        <el-table-column label="处理人" width="90" prop="handlerName" />
        <el-table-column label="观察频率" width="130" show-overflow-tooltip>
          <template #default="{ row }">{{ row.observationFrequency || '-' }}</template>
        </el-table-column>
        <el-table-column label="下次复查" width="160">
          <template #default="{ row }">{{ row.nextRecheckTime ? formatDateTime(row.nextRecheckTime) : '-' }}</template>
        </el-table-column>
        <el-table-column label="操作" width="260" fixed="right">
          <template #default="{ row }">
            <el-button type="primary" size="small" link @click="viewDetail(row)">详情</el-button>
            <el-button v-if="row.status === 'pending' || row.status === 'reviewing'" type="success" size="small" link @click="openHandleDialog(row)">
              处理
            </el-button>
            <el-button v-if="row.status !== 'resolved'" type="warning" size="small" link @click="openResolveDialog(row)">
              结案
            </el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <el-dialog v-model="detailDialogVisible" title="异常观察详情" width="720px">
      <div v-if="currentRecord">
        <el-descriptions :column="2" border>
          <el-descriptions-item label="宝宝姓名">{{ currentRecord.babyName }}</el-descriptions-item>
          <el-descriptions-item label="异常类型">
            <el-tag :type="abnormalTypeTagType(currentRecord.abnormalType)">
              {{ currentRecord.abnormalTypeName }}
            </el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="发生时间">{{ formatDateTime(currentRecord.occurTime) }}</el-descriptions-item>
          <el-descriptions-item label="状态">
            <el-tag :type="statusTagType(currentRecord.status)">{{ currentRecord.statusName }}</el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="精神状态">{{ currentRecord.mentalState || '-' }}</el-descriptions-item>
          <el-descriptions-item label="喂养量">{{ currentRecord.feedingAmount ? currentRecord.feedingAmount + 'ml' : '-' }}</el-descriptions-item>
          <el-descriptions-item label="提交人">{{ currentRecord.reporterName }}</el-descriptions-item>
          <el-descriptions-item label="提交时间">{{ formatDateTime(currentRecord.createdAt) }}</el-descriptions-item>
          <el-descriptions-item label="异常描述" :span="2">{{ currentRecord.description || '-' }}</el-descriptions-item>
        </el-descriptions>

        <el-divider>家属可见结论</el-divider>
        <el-alert v-if="currentRecord.familyConclusion" :title="currentRecord.familyConclusion" type="success" :closable="false" show-icon />
        <el-empty v-else description="暂未设置家属可见结论" :image-size="80" />

        <el-divider>观察安排</el-divider>
        <div class="observe-info">
          <div><strong>观察频率：</strong>{{ currentRecord.observationFrequency || '未设置' }}</div>
          <div><strong>下次复查：</strong>{{ currentRecord.nextRecheckTime ? formatDateTime(currentRecord.nextRecheckTime) : '未安排' }}</div>
          <div><strong>是否建议就医：</strong>{{ currentRecord.needHospital ? '是' : '否' }}</div>
        </div>

        <el-divider v-if="currentRecord.photos?.length > 0">照片记录</el-divider>
        <div v-if="currentRecord.photos?.length > 0" class="photo-gallery">
          <div v-for="(photo, idx) in currentRecord.photos" :key="idx" class="photo-item">
            <img :src="photo" :alt="'照片' + (idx + 1)" />
          </div>
        </div>

        <el-divider v-if="currentRecord.recheckRecords?.length > 0">复测记录</el-divider>
        <el-timeline v-if="currentRecord.recheckRecords?.length > 0">
          <el-timeline-item
            v-for="item in currentRecord.recheckRecords"
            :key="item.id"
            :timestamp="formatDateTime(item.checkedAt)"
            placement="top"
          >
            <el-card shadow="hover">
              <div class="recheck-item">
                <div class="recheck-result"><strong>复测结果：</strong>{{ recheckResultText(item.result) }}</div>
                <div v-if="item.level" class="recheck-level">黄疸值：{{ item.level }} mg/dL</div>
                <div v-if="item.weight" class="recheck-weight">体重：{{ item.weight }} g</div>
                <div v-if="item.notes" class="recheck-notes">备注：{{ item.notes }}</div>
              </div>
            </el-card>
          </el-timeline-item>
        </el-timeline>

        <el-divider v-if="currentRecord.internalNotes?.length > 0">内部讨论（家属不可见）</el-divider>
        <div v-if="currentRecord.internalNotes?.length > 0" class="internal-notes">
          <div v-for="note in currentRecord.internalNotes" :key="note.id" class="internal-note-item">
            <div class="note-header">
              <span class="note-time">{{ formatDateTime(note.createdAt) }}</span>
            </div>
            <div class="note-content">{{ note.content }}</div>
          </div>
        </div>
      </div>
    </el-dialog>

    <el-dialog v-model="handleDialogVisible" title="处理异常观察" width="560px" @close="resetHandleForm">
      <el-form ref="handleFormRef" :model="handleForm" :rules="handleRules" label-width="120px">
        <el-form-item label="处理状态" prop="status">
          <el-select v-model="handleForm.status" placeholder="请选择处理状态" style="width: 100%">
            <el-option label="持续观察中" value="observing" />
            <el-option label="已安排复测" value="recheck_scheduled" />
            <el-option label="建议就医" value="hospital_advice" />
            <el-option label="评估中" value="reviewing" />
          </el-select>
        </el-form-item>

        <el-form-item label="观察频率" prop="observationFrequency">
          <el-input v-model="handleForm.observationFrequency" placeholder="例如：每2小时观察一次" />
        </el-form-item>

        <el-form-item label="下次复查时间" prop="nextRecheckTime">
          <el-date-picker v-model="handleForm.nextRecheckTime" type="datetime" placeholder="选择复查时间" style="width: 100%" value-format="YYYY-MM-DDTHH:mm:ss" />
        </el-form-item>

        <el-form-item label="家属可见结论" prop="familyConclusion">
          <el-input v-model="handleForm.familyConclusion" type="textarea" :rows="3" placeholder="家属端将展示此结论，请使用温和、专业的措辞" maxlength="200" show-word-limit />
        </el-form-item>

        <el-form-item label="内部讨论记录" prop="internalNote">
          <el-input v-model="handleForm.internalNote" type="textarea" :rows="3" placeholder="内部责任讨论、评估细节等（家属不可见）" maxlength="500" show-word-limit />
        </el-form-item>

        <el-form-item label="建议就医">
          <el-switch v-model="handleForm.needHospital" />
          <span class="form-tip">开启后将标记为需就医状态</span>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="handleDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="submitHandle" :loading="handleSubmitting">确认处理</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="resolveDialogVisible" title="结案确认" width="480px" @close="resetResolveForm">
      <el-form ref="resolveFormRef" :model="resolveForm" :rules="resolveRules" label-width="120px">
        <el-form-item label="家属可见结论" prop="familyConclusion">
          <el-input v-model="resolveForm.familyConclusion" type="textarea" :rows="3" placeholder="结案结论（家属可见）" maxlength="200" show-word-limit />
        </el-form-item>
        <el-form-item label="内部结案记录">
          <el-input v-model="resolveForm.internalNote" type="textarea" :rows="2" placeholder="内部结案说明（家属不可见）" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="resolveDialogVisible = false">取消</el-button>
        <el-button type="success" @click="submitResolve" :loading="resolveSubmitting">确认结案</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { babyAbnormalApi } from '@/api'
import dayjs from 'dayjs'

const loading = ref(false)
const handleSubmitting = ref(false)
const resolveSubmitting = ref(false)
const records = ref([])
const filterStatus = ref('')

const detailDialogVisible = ref(false)
const handleDialogVisible = ref(false)
const resolveDialogVisible = ref(false)
const currentRecord = ref(null)
const handleFormRef = ref(null)
const resolveFormRef = ref(null)

const handleForm = reactive({
  status: '',
  observationFrequency: '',
  nextRecheckTime: '',
  familyConclusion: '',
  internalNote: '',
  needHospital: false
})

const handleRules = {
  status: [{ required: true, message: '请选择处理状态', trigger: 'change' }],
  familyConclusion: [{ required: true, message: '请输入家属可见结论', trigger: 'blur' }]
}

const resolveForm = reactive({
  familyConclusion: '',
  internalNote: ''
})

const resolveRules = {
  familyConclusion: [{ required: true, message: '请输入结案结论', trigger: 'blur' }]
}

const abnormalTypeTagType = (type) => {
  const map = {
    jaundice_rise: 'warning',
    weight_drop: 'danger',
    vomiting_frequent: 'warning',
    feeding_difficulty: 'info'
  }
  return map[type] || 'info'
}

const statusTagType = (status) => {
  const map = {
    pending: 'warning',
    reviewing: 'primary',
    recheck_scheduled: 'primary',
    hospital_advice: 'danger',
    resolved: 'success',
    observing: 'info'
  }
  return map[status] || 'info'
}

const recheckResultText = (result) => {
  const map = {
    normal: '已恢复正常',
    improving: '略有好转',
    no_change: '无明显变化',
    worsening: '情况加重'
  }
  return map[result] || result || '已完成'
}

const formatDateTime = (d) => {
  if (!d) return '-'
  return dayjs(d).format('YYYY-MM-DD HH:mm')
}

const fetchData = async () => {
  loading.value = true
  try {
    const params = filterStatus.value ? { status: filterStatus.value } : {}
    const res = await babyAbnormalApi.list(params)
    records.value = res.data?.data || res.data || []
  } finally {
    loading.value = false
  }
}

const viewDetail = async (row) => {
  try {
    const res = await babyAbnormalApi.get(row.id)
    currentRecord.value = res.data?.data || res.data || row
    detailDialogVisible.value = true
  } catch (e) {
    console.error(e)
  }
}

const openHandleDialog = (row) => {
  currentRecord.value = row
  resetHandleForm()
  handleForm.status = row.status === 'pending' ? 'observing' : row.status
  handleForm.observationFrequency = row.observationFrequency || ''
  handleForm.nextRecheckTime = row.nextRecheckTime || ''
  handleForm.familyConclusion = row.familyConclusion || ''
  handleForm.needHospital = row.needHospital || false
  handleDialogVisible.value = true
}

const resetHandleForm = () => {
  handleForm.status = ''
  handleForm.observationFrequency = ''
  handleForm.nextRecheckTime = ''
  handleForm.familyConclusion = ''
  handleForm.internalNote = ''
  handleForm.needHospital = false
  if (handleFormRef.value) handleFormRef.value.clearValidate()
}

const submitHandle = async () => {
  try {
    await handleFormRef.value.validate()
  } catch { return }

  handleSubmitting.value = true
  try {
    await babyAbnormalApi.handle(currentRecord.value.id, { ...handleForm })
    ElMessage.success('处理成功')
    handleDialogVisible.value = false
    await fetchData()
  } catch (e) {
    console.error(e)
    ElMessage.error('处理失败')
  } finally {
    handleSubmitting.value = false
  }
}

const openResolveDialog = (row) => {
  currentRecord.value = row
  resetResolveForm()
  resolveForm.familyConclusion = row.familyConclusion || '宝宝状态已恢复稳定，护理团队持续关注中'
  resolveDialogVisible.value = true
}

const resetResolveForm = () => {
  resolveForm.familyConclusion = ''
  resolveForm.internalNote = ''
  if (resolveFormRef.value) resolveFormRef.value.clearValidate()
}

const submitResolve = async () => {
  try {
    await resolveFormRef.value.validate()
  } catch { return }

  resolveSubmitting.value = true
  try {
    await babyAbnormalApi.resolve(currentRecord.value.id, { ...resolveForm })
    ElMessage.success('结案成功')
    resolveDialogVisible.value = false
    await fetchData()
  } catch (e) {
    console.error(e)
    ElMessage.error('结案失败')
  } finally {
    resolveSubmitting.value = false
  }
}

onMounted(() => {
  fetchData()
})
</script>

<style lang="scss" scoped>
.baby-abnormal-manage {
  padding: 20px;

  .card-header {
    display: flex;
    justify-content: space-between;
    align-items: center;

    .header-title {
      font-weight: 600;
      font-size: 16px;
    }

    .header-filters {
      display: flex;
      gap: 10px;
    }
  }

  .observe-info {
    padding: 16px;
    background: #f0f9eb;
    border-radius: 8px;
    font-size: 14px;
    line-height: 2;
  }

  .photo-gallery {
    display: flex;
    flex-wrap: wrap;
    gap: 12px;

    .photo-item {
      width: 120px;
      height: 120px;
      border-radius: 8px;
      overflow: hidden;
      border: 1px solid #e4e7ed;

      img {
        width: 100%;
        height: 100%;
        object-fit: cover;
      }
    }
  }

  .recheck-item {
    font-size: 14px;
    line-height: 1.8;

    .recheck-level,
    .recheck-weight {
      color: #409eff;
    }

    .recheck-notes {
      color: #606266;
    }
  }

  .internal-notes {
    display: flex;
    flex-direction: column;
    gap: 12px;

    .internal-note-item {
      padding: 12px 16px;
      background: #fff7e6;
      border-radius: 8px;
      border-left: 3px solid #e6a23c;

      .note-header {
        margin-bottom: 6px;

        .note-time {
          font-size: 12px;
          color: #874d00;
        }
      }

      .note-content {
        font-size: 14px;
        color: #303133;
        line-height: 1.6;
      }
    }
  }

  .form-tip {
    font-size: 12px;
    color: #909399;
    margin-left: 8px;
  }
}
</style>
