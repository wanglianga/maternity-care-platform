<template>
  <div class="family-meals">
    <div class="privacy-tip">
      <el-icon :size="18" color="#e6a23c"><Warning /></el-icon>
      <span>菜单由营养师根据妈妈体质定制，如有特殊饮食需求请联系营养师调整</span>
    </div>

    <el-card shadow="hover" class="date-picker-card">
      <div class="date-picker-row">
        <div class="date-label">
          <el-icon :size="18" color="#67c23a"><Calendar /></el-icon>
          <span>查看日期</span>
        </div>
        <el-date-picker
          v-model="selectedDate"
          type="date"
          placeholder="选择日期"
          format="YYYY-MM-DD"
          value-format="YYYY-MM-DD"
          :disabled-date="disabledDate"
          size="large"
          style="width: 240px;"
        />
        <div class="quick-dates">
          <el-button size="default" @click="setQuickDate(-2)">前天</el-button>
          <el-button size="default" @click="setQuickDate(-1)">昨天</el-button>
          <el-button type="primary" size="default" @click="setQuickDate(0)">今天</el-button>
          <el-button size="default" @click="setQuickDate(1)">明天</el-button>
        </div>
      </div>
    </el-card>

    <el-row :gutter="20" style="margin-top: 20px;">
      <el-col :span="18">
        <div class="meals-grid" v-loading="loading">
          <el-card
            shadow="hover"
            class="meal-card"
            :class="'meal-' + meal.type"
            v-for="meal in dailyMeals"
            :key="meal.type"
          >
            <div class="meal-card-header">
              <div class="meal-type-badge" :class="'badge-' + meal.type">
                <span class="meal-emoji">{{ mealIcon(meal.type) }}</span>
                <span class="meal-type-text">{{ mealTypeName(meal.type) }}</span>
              </div>
              <div class="meal-time">{{ mealTime(meal.type) }}</div>
            </div>

            <div class="meal-dishes">
              <el-tag
                v-for="(dish, idx) in meal.dishesList"
                :key="idx"
                :type="dishTagType(meal.type)"
                effect="light"
                size="default"
                class="dish-tag"
              >
                {{ dish }}
              </el-tag>
            </div>

            <el-divider style="margin: 14px 0;" />

            <div class="meal-nutritionist">
              <div class="nutritionist-label">
                <el-icon :size="14" color="#67c23a"><ChatDotRound /></el-icon>
                <span>营养师点评</span>
              </div>
              <div class="nutritionist-text">{{ meal.comment }}</div>
            </div>

            <div class="meal-tags-row">
              <el-tag
                v-for="(tag, idx) in meal.tags"
                :key="idx"
                size="small"
                class="nutrition-tag"
                effect="plain"
              >
                {{ tag }}
              </el-tag>
            </div>
          </el-card>
        </div>

        <el-empty v-if="dailyMeals.length === 0 && !loading" description="该日期暂无餐食记录" />
      </el-col>

      <el-col :span="6">
        <el-card shadow="hover" class="side-card">
          <template #header>
            <div class="card-header">
              <el-icon :size="18" color="#e6a23c"><DataAnalysis /></el-icon>
              <span class="header-title">营养成分概览</span>
            </div>
          </template>
          <div class="nutrition-tags">
            <div class="nutrition-group" v-for="(group, idx) in nutritionOverview" :key="idx">
              <div class="group-title">{{ group.title }}</div>
              <div class="group-tags">
                <el-tag
                  v-for="(tag, tIdx) in group.tags"
                  :key="tIdx"
                  :type="group.tagType"
                  effect="light"
                  round
                  size="default"
                >
                  {{ tag }}
                </el-tag>
              </div>
            </div>
          </div>
        </el-card>

        <el-card shadow="hover" class="side-card" style="margin-top: 20px;">
          <template #header>
            <div class="card-header">
              <el-icon :size="18" color="#f56c6c"><Bell /></el-icon>
              <span class="header-title">温馨提示</span>
            </div>
          </template>
          <div class="tips-list">
            <div class="tip-item" v-for="(tip, idx) in tips" :key="idx">
              <div class="tip-icon">✿</div>
              <div class="tip-text">{{ tip }}</div>
            </div>
          </div>
        </el-card>

        <el-card shadow="hover" class="side-card" style="margin-top: 20px;">
          <template #header>
            <div class="card-header">
              <el-icon :size="18" color="#409eff"><User /></el-icon>
              <span class="header-title">营养师联系方式</span>
            </div>
          </template>
          <div class="nutritionist-info">
            <div class="nutritionist-avatar">
              <el-avatar :size="56" style="background: linear-gradient(135deg, #a0cfff, #79bbff);">
                <el-icon :size="28"><Avatar /></el-icon>
              </el-avatar>
            </div>
            <div class="nutritionist-detail">
              <div class="nutritionist-name">陈营养师</div>
              <div class="nutritionist-title">高级母婴营养师</div>
              <div class="nutritionist-phone">
                <el-icon :size="14"><Phone /></el-icon>
                138-6666-8888
              </div>
            </div>
          </div>
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { mealApi, motherApi } from '@/api'

const loading = ref(false)
const selectedDate = ref(formatDate(new Date()))
const meals = ref([])
const currentMotherId = ref(null)

const formatDate = (date) => {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

const parseDate = (str) => {
  const parts = str.split('-')
  return new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]))
}

const disabledDate = (date) => {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const maxDate = new Date(today)
  maxDate.setDate(maxDate.getDate() + 2)
  return date > maxDate
}

const setQuickDate = (offset) => {
  const d = new Date()
  d.setDate(d.getDate() + offset)
  selectedDate.value = formatDate(d)
}

const mockMealsData = {
  breakfast: {
    type: 'breakfast',
    dishesList: ['小米红枣粥', '蒸鸡蛋羹', '凉拌黄瓜', '全麦馒头', '温牛奶'],
    comment: '早餐清淡养胃，小米红枣有助于补气血，鸡蛋补充优质蛋白',
    tags: ['高蛋白', '易消化', '补气血']
  },
  lunch: {
    type: 'lunch',
    dishesList: ['花生猪蹄汤', '糙米饭', '清蒸鲈鱼', '清炒时蔬', '虫草花炖鸡'],
    comment: '午餐营养均衡，花生猪蹄汤利于泌乳，鲈鱼富含DHA',
    tags: ['高蛋白', '利于泌乳', '高铁']
  },
  dinner: {
    type: 'dinner',
    dishesList: ['银耳莲子羹', '香菇滑鸡', '上汤娃娃菜', '红豆薏米饭', '蒸南瓜'],
    comment: '晚餐清淡养身，银耳莲子滋阴润肺，有助于睡眠',
    tags: ['低脂肪', '滋阴润肺', '富含膳食纤维']
  },
  snack: {
    type: 'snack',
    dishesList: ['木瓜牛奶炖雪蛤', '红豆山药糕', '桂圆红枣茶'],
    comment: '加餐补充能量，木瓜牛奶有助于乳汁分泌，口感丰富',
    tags: ['养颜美容', '利于泌乳', '高维生素']
  }
}

const dailyMeals = computed(() => {
  return Object.values(mockMealsData)
})

const nutritionOverview = [
  { title: '蛋白质', tags: ['高蛋白', '优质蛋白', '植物蛋白'], tagType: 'success' },
  { title: '矿物质', tags: ['高铁', '高钙', '补锌'], tagType: 'warning' },
  { title: '脂肪', tags: ['低脂肪', '不饱和脂肪'], tagType: 'info' },
  { title: '其他', tags: ['富含膳食纤维', '高维生素', '利于泌乳'], tagType: 'danger' }
]

const tips = [
  '月子餐均由营养师根据妈妈体质定制',
  '如有食物过敏史或特殊饮食需求，请提前告知',
  '请勿随意给妈妈食用外带食物，以免影响恢复',
  '用餐时间：早餐8:00、午餐12:00、晚餐18:00、加餐15:00',
  '如有餐食偏好调整，可联系营养师沟通'
]

const fetchData = async () => {
  loading.value = true
  try {
    const mothers = await motherApi.list()
    const motherList = Array.isArray(mothers) ? mothers : (mothers?.list || [])
    if (motherList.length > 0) {
      currentMotherId.value = motherList[0].id
      const data = await mealApi.list({ motherId: currentMotherId.value, date: selectedDate.value })
      meals.value = Array.isArray(data) ? data : (data?.list || [])
    }
  } catch (e) {
    console.error('获取月子餐数据失败', e)
  } finally {
    loading.value = false
  }
}

const mealIcon = (type) => {
  const map = { breakfast: '🌅', lunch: '☀️', dinner: '🌙', snack: '🍮' }
  return map[type] || '🍽️'
}

const mealTypeName = (type) => {
  const map = { breakfast: '营养早餐', lunch: '滋补午餐', dinner: '养生晚餐', snack: '暖心加餐' }
  return map[type] || '餐食'
}

const mealTime = (type) => {
  const map = { breakfast: '08:00', lunch: '12:00', dinner: '18:00', snack: '15:00' }
  return map[type] || ''
}

const dishTagType = (type) => {
  const map = { breakfast: 'success', lunch: 'warning', dinner: 'info', snack: 'danger' }
  return map[type] || ''
}

onMounted(fetchData)
</script>

<style lang="scss" scoped>
.family-meals {
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

.date-picker-card {
  border-radius: 12px;

  :deep(.el-card__body) {
    padding: 20px 24px;
  }
}

.date-picker-row {
  display: flex;
  align-items: center;
  gap: 20px;
  flex-wrap: wrap;
}

.date-label {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 15px;
  font-weight: 600;
  color: #303133;
}

.quick-dates {
  display: flex;
  gap: 8px;
}

.meals-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 20px;
}

.meal-card {
  border-radius: 14px;
  border: none;
  transition: all 0.3s;

  :deep(.el-card__body) {
    padding: 22px;
  }

  &:hover {
    transform: translateY(-4px);
    box-shadow: 0 10px 24px rgba(0, 0, 0, 0.1);
  }

  &.meal-breakfast {
    background: linear-gradient(135deg, #fff7e6 0%, #fef3c7 100%);
  }

  &.meal-lunch {
    background: linear-gradient(135deg, #fff0f6 0%, #ffe7ef 100%);
  }

  &.meal-dinner {
    background: linear-gradient(135deg, #ecf5ff 0%, #d9ecff 100%);
  }

  &.meal-snack {
    background: linear-gradient(135deg, #f0f9eb 0%, #e1f3d8 100%);
  }
}

.meal-card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.meal-type-badge {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 8px 14px;
  background: rgba(255, 255, 255, 0.85);
  border-radius: 24px;

  .meal-emoji {
    font-size: 20px;
  }

  .meal-type-text {
    font-size: 15px;
    font-weight: 600;
    color: #303133;
  }
}

.meal-time {
  font-size: 14px;
  color: #909399;
  font-weight: 500;
  background: rgba(255, 255, 255, 0.7);
  padding: 4px 12px;
  border-radius: 12px;
}

.meal-dishes {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-bottom: 4px;
}

.dish-tag {
  padding: 4px 12px;
  font-size: 13px;
  background: rgba(255, 255, 255, 0.9) !important;
}

.meal-nutritionist {
  margin-bottom: 12px;
}

.nutritionist-label {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 13px;
  color: #606266;
  margin-bottom: 6px;
  font-weight: 500;
}

.nutritionist-text {
  font-size: 13px;
  color: #303133;
  line-height: 1.6;
  padding: 10px 12px;
  background: rgba(255, 255, 255, 0.75);
  border-radius: 8px;
  border-left: 3px solid #67c23a;
}

.meal-tags-row {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.nutrition-tag {
  background: rgba(255, 255, 255, 0.8) !important;
}

.side-card {
  border-radius: 12px;

  :deep(.el-card__header) {
    padding: 14px 18px;
  }

  :deep(.el-card__body) {
    padding: 18px;
  }
}

.card-header {
  display: flex;
  align-items: center;
  gap: 8px;
}

.header-title {
  font-size: 15px;
  font-weight: 600;
  color: #303133;
}

.nutrition-tags {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.nutrition-group {
  .group-title {
    font-size: 13px;
    color: #606266;
    font-weight: 500;
    margin-bottom: 8px;
  }

  .group-tags {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
  }
}

.tips-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.tip-item {
  display: flex;
  gap: 10px;
  padding: 10px 12px;
  background: #fdf6ec;
  border-radius: 8px;
}

.tip-icon {
  color: #f56c6c;
  font-size: 14px;
  flex-shrink: 0;
  margin-top: 1px;
}

.tip-text {
  font-size: 13px;
  color: #606266;
  line-height: 1.5;
}

.nutritionist-info {
  display: flex;
  gap: 14px;
  align-items: center;
}

.nutritionist-avatar {
  flex-shrink: 0;
}

.nutritionist-detail {
  flex: 1;
}

.nutritionist-name {
  font-size: 16px;
  font-weight: 600;
  color: #303133;
  margin-bottom: 2px;
}

.nutritionist-title {
  font-size: 12px;
  color: #909399;
  margin-bottom: 6px;
}

.nutritionist-phone {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 13px;
  color: #409eff;
}
</style>
