<template>
  <div class="baby-abnormal-record">
    <el-card shadow="never">
      <template #header>
        <div class="card-header">
          <span class="header-title">宝宝异常观察记录</span>
          <el-button type="primary" @click="openAddDialog">
            <el-icon><Plus /></el-icon>
            提交异常观察
          </el-button>
        </div>
      </template>

      <el-table :data="records" stripe v-loading="loading" empty-text="暂无异常观察记录">
        <el-table-column label="宝宝姓名" width="130">
          <template #default="{ row }">{{ row.babyName || '-' }}</template>
        </el-table-column>
        <el-table-column label="异常类型" width="130">
          <template #default="{ row }">
            <el-tag :type="abnormalTypeTagType(row.abnormalType)" effect="light">
              {{ row.abnormalTypeName || row.abnormalType }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="发生时间" width="170">
          <template #default="{ row }">{{ formatDateTime(row.occurTime) }}</template>
        </el-table-column>
        <el-table-column label="状态" width="140">
          <template #default="{ row }">
            <el-tag :type="statusTagType(row.status)">{{ row.statusName || row.status }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="精神状态" width="120" prop="mentalState" show-overflow-tooltip />
        <el-table-column label="喂养量(ml)" width="110">
          <template #default="{ row }">{{ row.feedingAmount || '-' }}</template>
        </el-table-column>
        <el-table-column label="提交人" width="100" prop="reporterName" />
        <el-table-column label="描述" min-width="200" show-overflow-tooltip prop="description" />
        <el-table-column label="操作" width="180" fixed="right">
          <template #default="{ row }">
            <el-button type="primary" size="small" link @click="viewDetail(row)">查看</el-button>
            <el-button v-if="row.reportedBy === currentUserId" type="primary" size="small" link @click="handleEdit(row)">编辑</el-button>
            <el-button v-if="row.status === 'pending' || row.status === 'recheck_scheduled'" type="success" size="small" link @click="openRecheckDialog(row)">
              复测记录
            </el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <el-dialog v-model="addDialogVisible" :title="isEdit ? '编辑异常观察' : '提交异常观察'" width="640px" @close="resetForm">
      <el-form ref="formRef" :model="form" :rules="formRules" label-width="120px">
        <el-form-item label="选择宝宝" prop="babyId">
          <el-select v-model="form.babyId" placeholder="请选择宝宝" style="width: 100%" filterable>
            <el-option v-for="baby in babies" :key="baby.id" :label="baby.name || '宝宝'" :value="baby.id" />
          </el-select>
        </el-form-item>

        <el-form-item label="异常类型" prop="abnormalType">
          <el-select v-model="form.abnormalType" placeholder="请选择异常类型" style="width: 100%">
            <el-option label="黄疸值升高" value="jaundice_rise" />
            <el-option label="体重下降" value="weight_drop" />
            <el-option label="吐奶频繁" value="vomiting_frequent" />
            <el-option label="喂养不顺" value="feeding_difficulty" />
          </el-select>
        </el-form-item>

        <el-form-item label="发生时间" prop="occurTime">
          <el-date-picker v-model="form.occurTime" type="datetime" placeholder="选择发生时间" style="width: 100%" value-format="YYYY-MM-DDTHH:mm:ss" />
        </el-form-item>

        <el-form-item label="喂养量(ml)" prop="feedingAmount">
          <el-input-number v-model="form.feedingAmount" :min="0" :max="500" style="width: 200px" placeholder="可选" />
        </el-form-item>

        <el-form-item label="精神状态" prop="mentalState">
          <el-radio-group v-model="form.mentalState">
            <el-radio value="良好">良好</el-radio>
            <el-radio value="一般">一般</el-radio>
            <el-radio value="较差">较差</el-radio>
            <el-radio value="嗜睡">嗜睡</el-radio>
            <el-radio value="烦躁">烦躁</el-radio>
          </el-radio-group>
        </el-form-item>

        <el-form-item label="异常描述" prop="description">
          <el-input v-model="form.description" type="textarea" :rows="4" placeholder="请详细描述异常情况" maxlength="500" show-word-limit />
        </el-form-item>

        <el-form-item label="照片">
          <el-upload
            :auto-upload="false"
            :file-list="photoList"
            :on-change="handlePhotoChange"
            :on-remove="handlePhotoRemove"
            list-type="picture-card"
            accept="image/*"
            :limit="5"
          >
            <el-icon><Plus /></el-icon>
          </el-upload>
          <div class="upload-tip">最多上传5张照片，用于辅助诊断（本地预览）</div>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="addDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="submitForm" :loading="submitting">
          {{ isEdit ? '保存修改' : '提交观察' }}
        </el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="detailDialogVisible" title="异常观察详情" width="640px">
      <el-descriptions :column="2" border v-if="currentRecord">
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

      <el-divider v-if="currentRecord?.recheckRecords?.length > 0">复测记录</el-divider>
      <el-timeline v-if="currentRecord?.recheckRecords?.length > 0">
        <el-timeline-item
          v-for="item in currentRecord.recheckRecords"
          :key="item.id"
          :timestamp="formatDateTime(item.checkedAt)"
          placement="top"
        >
          <el-card shadow="hover">
            <div class="recheck-item">
              <div class="recheck-result"><strong>复测结果：</strong>{{ item.result || '已完成' }}</div>
              <div v-if="item.level" class="recheck-level">黄疸值：{{ item.level }} mg/dL</div>
              <div v-if="item.weight" class="recheck-weight">体重：{{ item.weight }} g</div>
              <div v-if="item.notes" class="recheck-notes">备注：{{ item.notes }}</div>
            </div>
          </el-card>
        </el-timeline-item>
      </el-timeline>

      <el-divider v-if="currentRecord?.familyConclusion">家属可见结论</el-divider>
      <el-alert v-if="currentRecord?.familyConclusion" :title="currentRecord.familyConclusion" type="info" :closable="false" show-icon />

      <el-divider v-if="currentRecord?.observationFrequency">观察安排</el-divider>
      <div v-if="currentRecord" class="observe-schedule">
        <div v-if="currentRecord.observationFrequency"><strong>观察频率：</strong>{{ currentRecord.observationFrequency }}</div>
        <div v-if="currentRecord.nextRecheckTime"><strong>下次复查：</strong>{{ formatDateTime(currentRecord.nextRecheckTime) }}</div>
      </div>
    </el-dialog>

    <el-dialog v-model="recheckDialogVisible" title="记录复测" width="520px" @close="resetRecheckForm">
      <el-form ref="recheckFormRef" :model="recheckForm" :rules="recheckRules" label-width="100px">
        <el-form-item label="复测结果" prop="result">
          <el-select v-model="recheckForm.result" placeholder="请选择复测结果" style="width: 100%">
            <el-option label="已恢复正常" value="normal" />
            <el-option label="略有好转" value="improving" />
            <el-option label="无明显变化" value="no_change" />
            <el-option label="情况加重" value="worsening" />
          </el-select>
        </el-form-item>
        <el-form-item label="黄疸值" v-if="currentRecord?.abnormalType === 'jaundice_rise'">
          <el-input-number v-model="recheckForm.level" :min="0" :max="30" :step="0.1" :precision="1" style="width: 100%" placeholder="mg/dL" />
        </el-form-item>
        <el-form-item label="体重(g)" v-if="currentRecord?.abnormalType === 'weight_drop'">
          <el-input-number v-model="recheckForm.weight" :min="500" :max="10000" :step="10" style="width: 100%" placeholder="克" />
        </el-form-item>
        <el-form-item label="备注说明" prop="notes">
          <el-input v-model="recheckForm.notes" type="textarea" :rows="3" placeholder="请填写复测备注" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="recheckDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="submitRecheck" :loading="recheckSubmitting">保存复测记录</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, computed } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Plus } from '@element-plus/icons-vue'
import { babyAbnormalApi, babyApi } from '@/api'
import { useAuthStore } from '@/store/auth'
import dayjs from 'dayjs'

const authStore = useAuthStore()
const currentUserId = computed(() => authStore.userId)

const loading = ref(false)
const submitting = ref(false)
const recheckSubmitting = ref(false)
const records = ref([])
const babies = ref([])

const addDialogVisible = ref(false)
const detailDialogVisible = ref(false)
const recheckDialogVisible = ref(false)
const isEdit = ref(false)
const editId = ref(null)
const currentRecord = ref(null)
const formRef = ref(null)
const recheckFormRef = ref(null)
const photoList = ref([])

const defaultForm = {
  babyId: '',
  abnormalType: '',
  occurTime: '',
  feedingAmount: null,
  mentalState: '良好',
  description: '',
  photos: []
}

const form = reactive({ ...defaultForm })

const formRules = {
  babyId: [{ required: true, message: '请选择宝宝', trigger: 'change' }],
  abnormalType: [{ required: true, message: '请选择异常类型', trigger: 'change' }],
  occurTime: [{ required: true, message: '请选择发生时间', trigger: 'change' }],
  description: [{ required: true, message: '请描述异常情况', trigger: 'blur' }]
}

const recheckForm = reactive({
  result: '',
  level: null,
  weight: null,
  notes: ''
})

const recheckRules = {
  result: [{ required: true, message: '请选择复测结果', trigger: 'change' }]
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

const formatDateTime = (d) => {
  if (!d) return '-'
  return dayjs(d).format('YYYY-MM-DD HH:mm')
}

const fetchData = async () => {
  loading.value = true
  try {
    const [recordsRes, babiesRes] = await Promise.all([
      babyAbnormalApi.list(),
      babyApi.list()
    ])
    records.value = recordsRes.data?.data || recordsRes.data || []
    babies.value = babiesRes.data?.data || babiesRes.data || []
  } finally {
    loading.value = false
  }
}

const openAddDialog = () => {
  isEdit.value = false
  editId.value = null
  resetForm()
  form.occurTime = new Date().toISOString()
  addDialogVisible.value = true
}

const handleEdit = (row) => {
  isEdit.value = true
  editId.value = row.id
  Object.assign(form, {
    babyId: row.babyId,
    abnormalType: row.abnormalType,
    occurTime: row.occurTime,
    feedingAmount: row.feedingAmount,
    mentalState: row.mentalState || '良好',
    description: row.description || ''
  })
  photoList.value = (row.photos || []).map((p, i) => ({ name: `photo${i}`, url: p }))
  addDialogVisible.value = true
}

const resetForm = () => {
  Object.assign(form, defaultForm)
  photoList.value = []
  if (formRef.value) formRef.value.clearValidate()
}

const handlePhotoChange = (file, fileList) => {
  photoList.value = fileList
  if (file.raw) {
    const reader = new FileReader()
    reader.onload = (e) => {
      const idx = photoList.value.findIndex(f => f.uid === file.uid)
      if (idx !== -1) {
        photoList.value[idx].url = e.target.result
      }
    }
    reader.readAsDataURL(file.raw)
  }
}

const handlePhotoRemove = (file, fileList) => {
  photoList.value = fileList
}

const submitForm = async () => {
  try {
    await formRef.value.validate()
  } catch { return }

  submitting.value = true
  try {
    const photos = photoList.value.map(p => p.url).filter(Boolean)
    const payload = { ...form, photos }

    if (isEdit.value) {
      await babyAbnormalApi.update(editId.value, payload)
      ElMessage.success('修改成功')
    } else {
      await babyAbnormalApi.create(payload)
      ElMessage.success('异常观察已提交，等待护士长处理')
    }
    addDialogVisible.value = false
    await fetchData()
  } catch (e) {
    console.error(e)
    ElMessage.error('提交失败，请重试')
  } finally {
    submitting.value = false
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

const openRecheckDialog = (row) => {
  currentRecord.value = row
  resetRecheckForm()
  recheckDialogVisible.value = true
}

const resetRecheckForm = () => {
  recheckForm.result = ''
  recheckForm.level = null
  recheckForm.weight = null
  recheckForm.notes = ''
  if (recheckFormRef.value) recheckFormRef.value.clearValidate()
}

const submitRecheck = async () => {
  try {
    await recheckFormRef.value.validate()
  } catch { return }

  recheckSubmitting.value = true
  try {
    await babyAbnormalApi.recheck(currentRecord.value.id, { ...recheckForm })
    ElMessage.success('复测记录已保存')
    recheckDialogVisible.value = false
    await fetchData()
  } catch (e) {
    console.error(e)
    ElMessage.error('保存失败')
  } finally {
    recheckSubmitting.value = false
  }
}

onMounted(() => {
  fetchData()
})
</script>

<style lang="scss" scoped>
.baby-abnormal-record {
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

  .upload-tip {
    font-size: 12px;
    color: #909399;
    margin-top: 6px;
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

  .observe-schedule {
    padding: 12px 16px;
    background: #ecf5ff;
    border-radius: 8px;
    font-size: 14px;
    line-height: 2;
  }
}
</style>
