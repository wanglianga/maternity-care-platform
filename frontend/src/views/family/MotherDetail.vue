<template>
  <div class="mother-detail">
    <div class="privacy-tip">
      <el-icon :size="18" color="#e6a23c"><Warning /></el-icon>
      <span>本页面仅展示恢复结论摘要，详细医疗数据由医护人员管理，如有疑问请联系护士长</span>
    </div>

    <el-card class="mother-info-card" shadow="hover">
      <div class="info-card-content">
        <div class="mother-avatar">
          <el-icon :size="42" color="#ff85c0"><Female /></el-icon>
        </div>
        <div class="mother-main">
          <div class="mother-name-row">
            <span class="mother-name">{{ currentMother?.name || '张女士' }}</span>
            <el-tag :type="statusTagType(currentMother?.healthStatus)" effect="dark" round>
              {{ healthStatusText(currentMother?.healthStatus) }}
            </el-tag>
          </div>
          <div class="mother-meta">
            <span class="meta-item">
              <el-icon :size="14" color="#909399"><Calendar /></el-icon>
              入住 {{ currentMother?.stayDays || 12 }} 天
            </span>
            <span class="meta-item">
              <el-icon :size="14" color="#909399"><OfficeBuilding /></el-icon>
              {{ currentMother?.roomNo || '302室' }}
            </span>
            <span class="meta-item">
              <el-icon :size="14" color="#909399"><Cake /></el-icon>
              预产期 {{ currentMother?.dueDate || '2026-05-20' }}
            </span>
          </div>
        </div>
        <div class="contact-box">
          <div class="contact-title">专属护士</div>
          <div class="contact-name">{{ currentMother?.nurseName || '李护士' }}</div>
          <div class="contact-phone">
            <el-icon :size="14"><Phone /></el-icon>
            {{ currentMother?.nursePhone || '138-8888-6666' }}
          </div>
        </div>
      </div>
    </el-card>

    <el-row :gutter="20" style="margin-top: 20px;">
      <el-col :span="12">
        <el-card shadow="hover" class="section-card">
          <template #header>
            <div class="card-header">
              <el-icon :size="18" color="#ff85c0"><Timer /></el-icon>
              <span class="header-title">恢复时间轴</span>
            </div>
          </template>
          <div class="timeline-wrapper">
            <el-timeline>
              <el-timeline-item
                v-for="(node, idx) in recoveryTimeline"
                :key="idx"
                :timestamp="node.date"
                :type="node.type"
                :icon="node.icon"
                :size="node.size"
                placement="top"
              >
                <div class="timeline-content">
                  <div class="timeline-title">{{ node.title }}</div>
                  <div class="timeline-desc" v-if="node.desc">{{ node.desc }}</div>
                </div>
              </el-timeline-item>
            </el-timeline>
          </div>
        </el-card>
      </el-col>

      <el-col :span="12">
        <el-card shadow="hover" class="section-card">
          <template #header>
            <div class="card-header">
              <el-icon :size="18" color="#67c23a"><CircleCheck /></el-icon>
              <span class="header-title">健康状态总结</span>
            </div>
          </template>
          <div class="health-summary">
            <div class="health-item">
              <div class="health-icon good">
                <el-icon :size="20"><CircleCheckFilled /></el-icon>
              </div>
              <div>
                <div class="health-label">医生评估</div>
                <div class="health-value">恢复良好，请继续保持</div>
              </div>
            </div>
            <div class="health-item">
              <div class="health-icon good">
                <el-icon :size="20"><CircleCheckFilled /></el-icon>
              </div>
              <div>
                <div class="health-label">伤口恢复</div>
                <div class="health-value">愈合良好，无异常</div>
              </div>
            </div>
            <div class="health-item">
              <div class="health-icon warning">
                <el-icon :size="20"><WarningFilled /></el-icon>
              </div>
              <div>
                <div class="health-label">睡眠建议</div>
                <div class="health-value">注意休息，避免熬夜</div>
              </div>
            </div>
            <div class="health-item">
              <div class="health-icon good">
                <el-icon :size="20"><CircleCheckFilled /></el-icon>
              </div>
              <div>
                <div class="health-label">泌乳情况</div>
                <div class="health-value">泌乳正常，供需平衡</div>
              </div>
            </div>
            <div class="health-item">
              <div class="health-icon good">
                <el-icon :size="20"><CircleCheckFilled /></el-icon>
              </div>
              <div>
                <div class="health-label">情绪状态</div>
                <div class="health-value">情绪稳定，心情愉悦</div>
              </div>
            </div>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <el-row :gutter="20" style="margin-top: 20px;">
      <el-col :span="14">
        <el-card shadow="hover" class="section-card">
          <template #header>
            <div class="card-header">
              <el-icon :size="18" color="#67c23a"><KnifeFork /></el-icon>
              <span class="header-title">近期月子餐</span>
            </div>
          </template>
          <div class="meals-recent">
            <div
              class="meal-day"
              v-for="day in recentMeals"
              :key="day.date"
            >
              <div class="meal-day-title">{{ day.dateText }}</div>
              <div class="meal-day-list">
                <div class="mini-meal" v-for="meal in day.meals" :key="meal.type">
                  <span class="mini-meal-icon">{{ mealIcon(meal.type) }}</span>
                  <div class="mini-meal-content">
                    <div class="mini-meal-type">{{ mealTypeName(meal.type) }}</div>
                    <div class="mini-meal-dishes">{{ meal.dishes }}</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </el-card>
      </el-col>

      <el-col :span="10">
        <el-card shadow="hover" class="section-card">
          <template #header>
            <div class="card-header">
              <el-icon :size="18" color="#e6a23c"><Document /></el-icon>
              <span class="header-title">注意事项</span>
            </div>
          </template>
          <div class="care-notes">
            <div class="note-item" v-for="(note, idx) in careNotes" :key="idx">
              <div class="note-dot"></div>
              <div class="note-content">{{ note }}</div>
            </div>
          </div>
        </el-card>

        <el-card shadow="hover" class="section-card" style="margin-top: 20px;">
          <template #header>
            <div class="card-header">
              <el-icon :size="18" color="#409eff"><Phone /></el-icon>
              <span class="header-title">联系方式</span>
            </div>
          </template>
          <div class="contact-list">
            <div class="contact-row">
              <div class="contact-role">护士长</div>
              <div class="contact-detail">王护士长 · 139-9999-1234</div>
            </div>
            <div class="contact-row">
              <div class="contact-role">销售顾问</div>
              <div class="contact-detail">刘顾问 · 137-7777-5678</div>
            </div>
            <div class="contact-row">
              <div class="contact-role">前台</div>
              <div class="contact-detail">0755-8888-6666</div>
            </div>
          </div>
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useAuthStore } from '@/store/auth'
import { motherApi } from '@/api'

const authStore = useAuthStore()
const loading = ref(false)
const mothers = ref([])
const currentMother = ref(null)

const recoveryTimeline = [
  {
    date: '入住日',
    title: '顺利入住',
    desc: '办理入住手续，完成身体评估',
    type: 'primary',
    size: 'large'
  },
  {
    date: '第1周',
    title: '第1周恢复完成',
    desc: '伤口初步愈合，身体适应月子期',
    type: 'success',
    size: 'normal'
  },
  {
    date: '第2周',
    title: '第2周恢复中',
    desc: '正在进行中，继续观察恢复情况',
    type: 'warning',
    size: 'normal'
  },
  {
    date: '第3周',
    title: '第3周计划',
    desc: '预计开始逐渐增加活动量',
    type: 'info',
    size: 'normal'
  },
  {
    date: '第4周',
    title: '第4周计划',
    desc: '预计完成月子期恢复，准备出院',
    type: 'info',
    size: 'normal'
  },
  {
    date: '预计出院',
    title: '2026-07-05',
    desc: '具体出院时间以医生评估为准',
    type: 'danger',
    size: 'large'
  }
]

const recentMeals = [
  {
    date: 'today',
    dateText: '今天',
    meals: [
      { type: 'breakfast', dishes: '小米粥、鸡蛋羹、凉拌时蔬' },
      { type: 'lunch', dishes: '鲫鱼汤、糙米饭、清炒虾仁' },
      { type: 'dinner', dishes: '银耳莲子羹、蒸鸡丝、时蔬沙拉' }
    ]
  },
  {
    date: 'yesterday',
    dateText: '昨天',
    meals: [
      { type: 'breakfast', dishes: '红枣粥、水煮蛋、凉拌菠菜' },
      { type: 'lunch', dishes: '花生猪蹄汤、藜麦饭、清蒸鲈鱼' },
      { type: 'dinner', dishes: '红糖姜粥、香菇滑鸡、上汤娃娃菜' }
    ]
  }
]

const careNotes = [
  '避免长时间站立或久坐，适当卧床休息',
  '注意保暖，避免接触冷水或吹风',
  '保持心情舒畅，有任何不适及时告知护士',
  '饮食已由营养师定制，请勿随意食用外带食物',
  '每日请配合护士做好产后康复操'
]

const fetchMothers = async () => {
  loading.value = true
  try {
    const data = await motherApi.list()
    mothers.value = Array.isArray(data) ? data : (data?.list || [])
    if (mothers.value.length > 0) {
      currentMother.value = mothers.value[0]
    }
  } catch (e) {
    console.error('获取妈妈信息失败', e)
  } finally {
    loading.value = false
  }
}

const statusTagType = (status) => {
  const map = { good: 'success', recovering: 'warning', poor: 'danger' }
  return map[status] || 'success'
}

const healthStatusText = (status) => {
  const map = { good: '恢复良好', recovering: '恢复中', poor: '需关注' }
  return map[status] || '恢复良好'
}

const mealIcon = (type) => {
  const map = { breakfast: '🌅', lunch: '☀️', dinner: '🌙', snack: '🍮' }
  return map[type] || '🍽️'
}

const mealTypeName = (type) => {
  const map = { breakfast: '早餐', lunch: '午餐', dinner: '晚餐', snack: '加餐' }
  return map[type] || '餐食'
}

onMounted(fetchMothers)
</script>

<style lang="scss" scoped>
.mother-detail {
  padding: 4px;
}

.privacy-tip {
  background: linear-gradient(135deg, #fff7e6 0%, #ffe7ba 100%);
  border-radius: 10px;
  padding: 12px 20px;
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 20px;
  color: #874d00;
  font-size: 14px;
  border: 1px solid #ffe58f;
}

.mother-info-card {
  background: linear-gradient(135deg, #fff0f6 0%, #ffd6e7 100%);
  border: none;
  border-radius: 16px;

  :deep(.el-card__body) {
    padding: 20px 24px;
  }
}

.info-card-content {
  display: flex;
  align-items: center;
  gap: 24px;
}

.mother-avatar {
  width: 76px;
  height: 76px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.8);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  box-shadow: 0 4px 12px rgba(255, 133, 192, 0.3);
}

.mother-main {
  flex: 1;
}

.mother-name-row {
  display: flex;
  align-items: center;
  gap: 14px;
  margin-bottom: 10px;
}

.mother-name {
  font-size: 22px;
  font-weight: 600;
  color: #87385d;
}

.mother-meta {
  display: flex;
  flex-wrap: wrap;
  gap: 20px;
}

.meta-item {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 13px;
  color: #87385d;
}

.contact-box {
  background: rgba(255, 255, 255, 0.7);
  padding: 14px 20px;
  border-radius: 12px;
  text-align: center;
  flex-shrink: 0;
}

.contact-title {
  font-size: 12px;
  color: #a0637f;
  margin-bottom: 4px;
}

.contact-name {
  font-size: 16px;
  font-weight: 600;
  color: #87385d;
  margin-bottom: 4px;
}

.contact-phone {
  font-size: 13px;
  color: #87385d;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 4px;
}

.section-card {
  border-radius: 12px;

  :deep(.el-card__header) {
    padding: 16px 20px;
  }

  :deep(.el-card__body) {
    padding: 20px;
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
}

.timeline-wrapper {
  padding: 4px 0;
}

.timeline-content {
  padding: 4px 0;
}

.timeline-title {
  font-size: 14px;
  font-weight: 600;
  color: #303133;
  margin-bottom: 2px;
}

.timeline-desc {
  font-size: 12px;
  color: #909399;
}

.health-summary {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.health-item {
  display: flex;
  gap: 12px;
  padding: 12px 14px;
  background: #f0f9eb;
  border-radius: 10px;
}

.health-icon {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;

  &.good {
    background: #e1f3d8;
    color: #67c23a;
  }

  &.warning {
    background: #faecd8;
    color: #e6a23c;
  }

  &.danger {
    background: #fde2e2;
    color: #f56c6c;
  }
}

.health-label {
  font-size: 12px;
  color: #909399;
  margin-bottom: 2px;
}

.health-value {
  font-size: 14px;
  color: #303133;
  font-weight: 500;
}

.meals-recent {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.meal-day-title {
  font-size: 14px;
  font-weight: 600;
  color: #303133;
  margin-bottom: 10px;
  padding-left: 6px;
  border-left: 3px solid #67c23a;
}

.meal-day-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
  margin-bottom: 6px;
}

.mini-meal {
  display: flex;
  gap: 10px;
  padding: 10px 12px;
  background: linear-gradient(135deg, #f0f9eb 0%, #e1f3d8 100%);
  border-radius: 8px;
}

.mini-meal-icon {
  font-size: 16px;
  flex-shrink: 0;
  width: 28px;
  text-align: center;
}

.mini-meal-type {
  font-size: 12px;
  color: #67c23a;
  font-weight: 600;
  margin-bottom: 2px;
}

.mini-meal-dishes {
  font-size: 13px;
  color: #606266;
  line-height: 1.4;
}

.care-notes {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.note-item {
  display: flex;
  gap: 10px;
  padding: 10px 12px;
  background: #fdf6ec;
  border-radius: 8px;
}

.note-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: #e6a23c;
  margin-top: 8px;
  flex-shrink: 0;
}

.note-content {
  font-size: 13px;
  color: #606266;
  line-height: 1.5;
}

.contact-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.contact-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px 12px;
  background: #ecf5ff;
  border-radius: 8px;
}

.contact-role {
  font-size: 13px;
  color: #409eff;
  font-weight: 600;
}

.contact-detail {
  font-size: 13px;
  color: #303133;
}
</style>
