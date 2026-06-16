<template>
  <div class="observation-record">
    <el-card shadow="never">
      <template #header>
        <div class="card-header">
          <span class="header-title">宝宝护理记录</span>
          <el-button type="primary" @click="openAddDialog">
            <el-icon><Plus /></el-icon>
            新增记录
          </el-button>
        </div>
      </template>

      <el-tabs v-model="activeTab" @tab-change="handleTabChange" class="obs-tabs">
        <el-tab-pane label="睡眠" name="sleep">
          <el-table :data="filteredObservations" stripe v-loading="loading" empty-text="暂无睡眠记录">
            <el-table-column label="宝宝姓名" width="140">
              <template #default="{ row }">{{ getBabyName(row.babyId) }}</template>
            </el-table-column>
            <el-table-column label="开始时间" width="170">
              <template #default="{ row }">{{ formatDateTime(row.startTime) }}</template>
            </el-table-column>
            <el-table-column label="结束时间" width="170">
              <template #default="{ row }">{{ formatDateTime(row.endTime) }}</template>
            </el-table-column>
            <el-table-column label="时长(分钟)" width="110" prop="duration" />
            <el-table-column label="睡眠质量" width="100">
              <template #default="{ row }">
                <el-tag :type="qualityTagType(row.quality)">{{ row.quality }}</el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="notes" label="备注" min-width="160" show-overflow-tooltip />
            <el-table-column label="操作" width="100" fixed="right">
              <template #default="{ row }">
                <el-button type="danger" size="small" link @click="handleDelete(row)">删除</el-button>
              </template>
            </el-table-column>
          </el-table>
        </el-tab-pane>

        <el-tab-pane label="体重" name="weight">
          <el-table :data="filteredObservations" stripe v-loading="loading" empty-text="暂无体重记录">
            <el-table-column label="宝宝姓名" width="140">
              <template #default="{ row }">{{ getBabyName(row.babyId) }}</template>
            </el-table-column>
            <el-table-column label="测量时间" width="170">
              <template #default="{ row }">{{ formatDateTime(row.measureTime) }}</template>
            </el-table-column>
            <el-table-column label="体重(克)" width="120">
              <template #default="{ row }">
                <span class="weight-value">{{ row.weight }}</span>
              </template>
            </el-table-column>
            <el-table-column prop="notes" label="备注" min-width="160" show-overflow-tooltip />
            <el-table-column label="操作" width="100" fixed="right">
              <template #default="{ row }">
                <el-button type="danger" size="small" link @click="handleDelete(row)">删除</el-button>
              </template>
            </el-table-column>
          </el-table>
        </el-tab-pane>

        <el-tab-pane label="排便" name="excretion">
          <el-table :data="filteredObservations" stripe v-loading="loading" empty-text="暂无排便记录">
            <el-table-column label="宝宝姓名" width="140">
              <template #default="{ row }">{{ getBabyName(row.babyId) }}</template>
            </el-table-column>
            <el-table-column label="时间" width="170">
              <template #default="{ row }">{{ formatDateTime(row.time) }}</template>
            </el-table-column>
            <el-table-column label="类型" width="90">
              <template #default="{ row }">
                <el-tag :type="row.type === '大便' ? 'warning' : 'info'">{{ row.type }}</el-tag>
              </template>
            </el-table-column>
            <el-table-column label="量" width="80">
              <template #default="{ row }">{{ row.amount }}</template>
            </el-table-column>
            <el-table-column label="颜色" width="100" prop="color" />
            <el-table-column prop="notes" label="备注" min-width="160" show-overflow-tooltip />
            <el-table-column label="操作" width="100" fixed="right">
              <template #default="{ row }">
                <el-button type="danger" size="small" link @click="handleDelete(row)">删除</el-button>
              </template>
            </el-table-column>
          </el-table>
        </el-tab-pane>

        <el-tab-pane label="喂奶" name="feeding">
          <el-table :data="filteredObservations" stripe v-loading="loading" empty-text="暂无喂奶记录">
            <el-table-column label="宝宝姓名" width="140">
              <template #default="{ row }">{{ getBabyName(row.babyId) }}</template>
            </el-table-column>
            <el-table-column label="时间" width="170">
              <template #default="{ row }">{{ formatDateTime(row.time) }}</template>
            </el-table-column>
            <el-table-column label="喂养方式" width="110">
              <template #default="{ row }">
                <el-tag type="success" effect="light">{{ row.type }}</el-tag>
              </template>
            </el-table-column>
            <el-table-column label="奶量(ml)" width="100" prop="amount" />
            <el-table-column label="时长(分钟)" width="110" prop="duration" />
            <el-table-column prop="notes" label="备注" min-width="160" show-overflow-tooltip />
            <el-table-column label="操作" width="100" fixed="right">
              <template #default="{ row }">
                <el-button type="danger" size="small" link @click="handleDelete(row)">删除</el-button>
              </template>
            </el-table-column>
          </el-table>
        </el-tab-pane>

        <el-tab-pane label="黄疸" name="jaundice">
          <el-table :data="filteredObservations" stripe v-loading="loading" empty-text="暂无黄疸记录">
            <el-table-column label="宝宝姓名" width="140">
              <template #default="{ row }">{{ getBabyName(row.babyId) }}</template>
            </el-table-column>
            <el-table-column label="测量时间" width="170">
              <template #default="{ row }">{{ formatDateTime(row.measureTime) }}</template>
            </el-table-column>
            <el-table-column label="黄疸值" width="100">
              <template #default="{ row }">
                <span class="jaundice-value" :class="{ high: Number(row.level) > 12 }">{{ row.level }}</span>
              </template>
            </el-table-column>
            <el-table-column label="部位" width="120" prop="location" />
            <el-table-column prop="notes" label="备注" min-width="160" show-overflow-tooltip />
            <el-table-column label="操作" width="100" fixed="right">
              <template #default="{ row }">
                <el-button type="danger" size="small" link @click="handleDelete(row)">删除</el-button>
              </template>
            </el-table-column>
          </el-table>
        </el-tab-pane>
      </el-tabs>
    </el-card>

    <el-dialog v-model="addDialogVisible" :title="'新增' + typeNameMap[activeTab] + '记录'" width="600px" @close="resetForm">
      <el-form ref="formRef" :model="form" :rules="formRules" label-width="110px">
        <el-form-item label="选择宝宝" prop="babyId">
          <el-select v-model="form.babyId" placeholder="请选择宝宝" style="width: 100%">
            <el-option v-for="baby in babies" :key="baby.id" :label="getBabyFullName(baby)" :value="baby.id" />
          </el-select>
        </el-form-item>

        <template v-if="activeTab === 'sleep'">
          <el-form-item label="开始时间" prop="startTime">
            <el-date-picker v-model="form.startTime" type="datetime" placeholder="选择开始时间" style="width: 100%" value-format="YYYY-MM-DDTHH:mm:ss" />
          </el-form-item>
          <el-form-item label="结束时间" prop="endTime">
            <el-date-picker v-model="form.endTime" type="datetime" placeholder="选择结束时间" style="width: 100%" value-format="YYYY-MM-DDTHH:mm:ss" />
          </el-form-item>
          <el-form-item label="时长(分钟)" prop="duration">
            <el-input-number v-model="form.duration" :min="0" :max="1440" style="width: 100%" placeholder="自动计算或手动输入" />
          </el-form-item>
          <el-form-item label="睡眠质量" prop="quality">
            <el-radio-group v-model="form.quality">
              <el-radio value="好">好</el-radio>
              <el-radio value="中">中</el-radio>
              <el-radio value="差">差</el-radio>
            </el-radio-group>
          </el-form-item>
        </template>

        <template v-if="activeTab === 'weight'">
          <el-form-item label="体重(克)" prop="weight">
            <el-input-number v-model="form.weight" :min="500" :max="10000" :step="10" style="width: 100%" placeholder="请输入体重克数" />
          </el-form-item>
          <el-form-item label="测量时间" prop="measureTime">
            <el-date-picker v-model="form.measureTime" type="datetime" placeholder="选择测量时间" style="width: 100%" value-format="YYYY-MM-DDTHH:mm:ss" />
          </el-form-item>
        </template>

        <template v-if="activeTab === 'excretion'">
          <el-form-item label="排便类型" prop="type">
            <el-radio-group v-model="form.type">
              <el-radio value="大便">大便</el-radio>
              <el-radio value="小便">小便</el-radio>
            </el-radio-group>
          </el-form-item>
          <el-form-item label="量" prop="amount">
            <el-radio-group v-model="form.amount">
              <el-radio value="多">多</el-radio>
              <el-radio value="中">中</el-radio>
              <el-radio value="少">少</el-radio>
            </el-radio-group>
          </el-form-item>
          <el-form-item label="颜色" prop="color">
            <el-input v-model="form.color" placeholder="例如：金黄色、绿色等" />
          </el-form-item>
          <el-form-item label="时间" prop="time">
            <el-date-picker v-model="form.time" type="datetime" placeholder="选择时间" style="width: 100%" value-format="YYYY-MM-DDTHH:mm:ss" />
          </el-form-item>
        </template>

        <template v-if="activeTab === 'feeding'">
          <el-form-item label="喂养方式" prop="type">
            <el-select v-model="form.type" placeholder="请选择喂养方式" style="width: 100%">
              <el-option label="母乳" value="母乳" />
              <el-option label="配方奶" value="配方奶" />
              <el-option label="混合" value="混合" />
            </el-select>
          </el-form-item>
          <el-form-item label="奶量(ml)" prop="amount">
            <el-input-number v-model="form.amount" :min="0" :max="500" style="width: 100%" placeholder="请输入奶量" />
          </el-form-item>
          <el-form-item label="时长(分钟)" prop="duration">
            <el-input-number v-model="form.duration" :min="0" :max="180" style="width: 100%" placeholder="请输入喂养时长" />
          </el-form-item>
          <el-form-item label="时间" prop="time">
            <el-date-picker v-model="form.time" type="datetime" placeholder="选择时间" style="width: 100%" value-format="YYYY-MM-DDTHH:mm:ss" />
          </el-form-item>
        </template>

        <template v-if="activeTab === 'jaundice'">
          <el-form-item label="黄疸值" prop="level">
            <el-input-number v-model="form.level" :min="0" :max="30" :step="0.1" :precision="1" style="width: 100%" placeholder="请输入黄疸值" />
          </el-form-item>
          <el-form-item label="部位" prop="location">
            <el-select v-model="form.location" placeholder="请选择测量部位" style="width: 100%">
              <el-option label="额头" value="额头" />
              <el-option label="脸颊" value="脸颊" />
              <el-option label="前胸" value="前胸" />
              <el-option label="腹部" value="腹部" />
              <el-option label="四肢" value="四肢" />
            </el-select>
          </el-form-item>
          <el-form-item label="测量时间" prop="measureTime">
            <el-date-picker v-model="form.measureTime" type="datetime" placeholder="选择测量时间" style="width: 100%" value-format="YYYY-MM-DDTHH:mm:ss" />
          </el-form-item>
        </template>

        <el-form-item label="备注">
          <el-input v-model="form.notes" type="textarea" :rows="2" placeholder="可选备注信息" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="addDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="submitForm">保存</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted, watch } from 'vue'
import { useRoute } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Plus } from '@element-plus/icons-vue'
import {
  observationApi,
  babyApi
} from '@/api'
import { useAuthStore } from '@/store/auth'
import dayjs from 'dayjs'

const route = useRoute()
const authStore = useAuthStore()

const loading = ref(false)
const activeTab = ref('sleep')
const observations = ref([])
const babies = ref([])

const addDialogVisible = ref(false)
const formRef = ref(null)
const queryBabyId = route.query.babyId

const typeNameMap = {
  sleep: '睡眠',
  weight: '体重',
  excretion: '排便',
  feeding: '喂奶',
  jaundice: '黄疸'
}

const defaultFormValues = {
  sleep: { babyId: '', startTime: '', endTime: '', duration: 0, quality: '中', notes: '' },
  weight: { babyId: '', weight: 3000, measureTime: '', notes: '' },
  excretion: { babyId: '', type: '大便', amount: '中', color: '', time: '', notes: '' },
  feeding: { babyId: '', type: '母乳', amount: 60, duration: 15, time: '', notes: '' },
  jaundice: { babyId: '', level: 0, location: '额头', measureTime: '', notes: '' }
}

const form = reactive({ ...defaultFormValues.sleep })

const formRules = computed(() => {
  const base = {
    babyId: [{ required: true, message: '请选择宝宝', trigger: 'change' }]
  }
  const rules = { ...base }
  if (activeTab.value === 'sleep') {
    rules.startTime = [{ required: true, message: '请选择开始时间', trigger: 'change' }]
    rules.endTime = [{ required: true, message: '请选择结束时间', trigger: 'change' }]
    rules.quality = [{ required: true, message: '请选择睡眠质量', trigger: 'change' }]
  } else if (activeTab.value === 'weight') {
    rules.weight = [{ required: true, message: '请输入体重', trigger: 'blur' }]
    rules.measureTime = [{ required: true, message: '请选择测量时间', trigger: 'change' }]
  } else if (activeTab.value === 'excretion') {
    rules.type = [{ required: true, message: '请选择排便类型', trigger: 'change' }]
    rules.amount = [{ required: true, message: '请选择量', trigger: 'change' }]
    rules.time = [{ required: true, message: '请选择时间', trigger: 'change' }]
  } else if (activeTab.value === 'feeding') {
    rules.type = [{ required: true, message: '请选择喂养方式', trigger: 'change' }]
    rules.time = [{ required: true, message: '请选择时间', trigger: 'change' }]
  } else if (activeTab.value === 'jaundice') {
    rules.level = [{ required: true, message: '请输入黄疸值', trigger: 'blur' }]
    rules.location = [{ required: true, message: '请选择部位', trigger: 'change' }]
    rules.measureTime = [{ required: true, message: '请选择测量时间', trigger: 'change' }]
  }
  return rules
})

const filteredObservations = computed(() => {
  return observations.value
    .filter(o => o.type === activeTab.value)
    .sort((a, b) => {
      const timeA = a.startTime || a.measureTime || a.time || a.createdAt
      const timeB = b.startTime || b.measureTime || b.time || b.createdAt
      return new Date(timeB) - new Date(timeA)
    })
})

const fetchData = async () => {
  loading.value = true
  try {
    const [obsRes, babiesRes] = await Promise.all([
      observationApi.list(),
      babyApi.list()
    ])
    observations.value = obsRes.data?.data || obsRes.data || []
    babies.value = babiesRes.data?.data || babiesRes.data || []
  } finally {
    loading.value = false
  }
}

const handleTabChange = () => {
  resetForm()
}

const openAddDialog = () => {
  resetForm()
  if (queryBabyId) {
    form.babyId = queryBabyId
  }
  const now = new Date().toISOString()
  if (activeTab.value === 'sleep') {
    form.startTime = now
    form.endTime = now
  } else if (activeTab.value === 'weight' || activeTab.value === 'jaundice') {
    form.measureTime = now
  } else if (activeTab.value === 'excretion' || activeTab.value === 'feeding') {
    form.time = now
  }
  addDialogVisible.value = true
}

const resetForm = () => {
  Object.keys(form).forEach(key => delete form[key])
  Object.assign(form, defaultFormValues[activeTab.value])
  if (formRef.value) formRef.value.clearValidate()
}

const getBabyName = (id) => {
  if (!id) return '-'
  const b = babies.value.find(x => x.id === id)
  if (!b) return '-'
  return b.name || (b.gender === 'male' ? '男宝' : '女宝')
}

const getBabyFullName = (baby) => {
  if (!baby) return ''
  const name = baby.name || (baby.gender === 'male' ? '男宝' : '女宝')
  const mother = baby.motherId ? '' : ''
  return name + (mother ? `(${mother})` : '')
}

const formatDateTime = (d) => {
  if (!d) return '-'
  return dayjs(d).format('YYYY-MM-DD HH:mm')
}

const qualityTagType = (q) => {
  const map = { '好': 'success', '中': 'warning', '差': 'danger' }
  return map[q] || 'info'
}

watch(() => [form.startTime, form.endTime], () => {
  if (activeTab.value === 'sleep' && form.startTime && form.endTime) {
    const diff = dayjs(form.endTime).diff(dayjs(form.startTime), 'minute')
    if (diff > 0) form.duration = diff
  }
}, { deep: true })

const submitForm = async () => {
  try {
    await formRef.value.validate()
  } catch { return }

  try {
    const payload = { ...form, type: activeTab.value, operatorId: authStore.userId }
    await observationApi.create(payload)
    ElMessage.success('记录创建成功')
    addDialogVisible.value = false
    await fetchData()
  } catch (e) {
    console.error(e)
  }
}

const handleDelete = async (row) => {
  try {
    await ElMessageBox.confirm('确定删除该记录吗？', '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    })
    await observationApi.remove(row.id)
    ElMessage.success('删除成功')
    await fetchData()
  } catch (e) {
    if (e !== 'cancel') console.error(e)
  }
}

onMounted(() => {
  fetchData()
})
</script>

<style lang="scss" scoped>
.observation-record {
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

  .obs-tabs {
    margin-top: 4px;
  }

  .weight-value {
    font-weight: 600;
    color: #409eff;
  }

  .jaundice-value {
    font-weight: 600;
    color: #67c23a;
    &.high {
      color: #f56c6c;
    }
  }
}
</style>
