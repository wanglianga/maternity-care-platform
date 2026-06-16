<template>
  <div class="family-dashboard">
    <div class="privacy-tip">
      <el-icon :size="18" color="#e6a23c"><Warning /></el-icon>
      <span>为保护妈妈和宝宝隐私，内部交班和费用变化详情将由销售/护士长单独通知</span>
    </div>

    <el-card class="mother-card" shadow="hover">
      <div class="mother-card-content">
        <div class="mother-avatar">
          <el-icon :size="48" color="#ff85c0"><Female /></el-icon>
        </div>
        <div class="mother-info">
          <div class="mother-name">{{ mockMother.name }}</div>
          <div class="mother-status-row">
            <el-tag :type="statusTagType(mockMother.healthStatus)" effect="dark" round size="large">
              {{ healthStatusText(mockMother.healthStatus) }}
            </el-tag>
            <span class="stay-days">已入住 {{ mockMother.stayDays }} 天</span>
          </div>
          <div class="mother-expected">预计出院：{{ mockMother.expectedDischarge }}</div>
        </div>
        <div class="mother-room">
          <div class="room-label">房间</div>
          <div class="room-no">{{ mockMother.roomNo }}</div>
        </div>
      </div>
    </el-card>

    <el-row :gutter="20" style="margin-top: 20px;">
      <el-col :span="16">
        <el-card shadow="hover" class="section-card">
          <template #header>
            <div class="card-header">
              <el-icon :size="18" color="#f56c6c"><Avatar /></el-icon>
              <span class="header-title">宝宝近况</span>
            </div>
          </template>
          <el-row :gutter="16">
            <el-col :span="12" v-for="baby in mockBabies" :key="baby.id">
              <div class="baby-card" :class="baby.gender === '男' ? 'baby-boy' : 'baby-girl'">
                <div class="baby-header">
                  <div class="baby-avatar" :class="baby.gender === '男' ? 'boy' : 'girl'">
                    <el-icon :size="24">{{ baby.gender === '男' ? '👦' : '👧' }}</el-icon>
                  </div>
                  <div>
                    <div class="baby-name">{{ baby.name }}</div>
                    <el-tag size="small" :type="baby.gender === '男' ? 'primary' : 'danger'" effect="light">
                      {{ baby.gender }}宝宝
                    </el-tag>
                  </div>
                </div>
                <div class="baby-summary">
                  <div class="summary-item">
                    <el-icon :size="14" color="#909399"><Moon /></el-icon>
                    <span>睡眠：{{ baby.todaySleep }}</span>
                  </div>
                  <div class="summary-item">
                    <el-icon :size="14" color="#67c23a"><Scale /></el-icon>
                    <span>体重：{{ baby.weight }}</span>
                  </div>
                  <div class="summary-item">
                    <el-icon :size="14" color="#e6a23c"><MilkTea /></el-icon>
                    <span>喂奶：{{ baby.feedCount }}次</span>
                  </div>
                  <div class="summary-item">
                    <el-icon :size="14" color="#409eff"><Sunny /></el-icon>
                    <span>黄疸：{{ baby.jaundiceStatus }}</span>
                  </div>
                </div>
              </div>
            </el-col>
          </el-row>
        </el-card>
      </el-col>

      <el-col :span="8">
        <el-card shadow="hover" class="section-card">
          <template #header>
            <div class="card-header">
              <el-icon :size="18" color="#67c23a"><KnifeFork /></el-icon>
              <span class="header-title">今日月子餐</span>
            </div>
          </template>
          <div class="meals-list">
            <div class="meal-item" v-for="meal in mockTodayMeals" :key="meal.type">
              <div class="meal-icon" :class="meal.type">{{ mealIcon(meal.type) }}</div>
              <div class="meal-info">
                <div class="meal-type">{{ mealTypeName(meal.type) }}</div>
                <div class="meal-dishes">{{ meal.dishes }}</div>
              </div>
            </div>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <el-row :gutter="20" style="margin-top: 20px;">
      <el-col :span="12">
        <el-card shadow="hover" class="section-card">
          <template #header>
            <div class="card-header">
              <el-icon :size="18" color="#409eff"><List /></el-icon>
              <span class="header-title">今日护理活动</span>
            </div>
          </template>
          <div class="care-list">
            <div class="care-item" v-for="(item, idx) in mockCareActivities" :key="idx">
              <div class="care-check">
                <el-icon :size="18" color="#67c23a"><CircleCheckFilled /></el-icon>
              </div>
              <div class="care-content">
                <div class="care-title">{{ item.title }}</div>
                <div class="care-time">{{ item.time }}</div>
              </div>
            </div>
            <div class="care-empty" v-if="mockCareActivities.length === 0">
              <el-empty description="暂无护理记录" :image-size="80" />
            </div>
          </div>
        </el-card>
      </el-col>

      <el-col :span="12">
        <el-card shadow="hover" class="section-card">
          <template #header>
            <div class="card-header">
              <el-icon :size="18" color="#e6a23c"><Bell /></el-icon>
              <span class="header-title">通知消息</span>
            </div>
          </template>
          <div class="notice-list">
            <div class="notice-item" v-for="(notice, idx) in mockNotices" :key="idx">
              <div class="notice-tag" :type="notice.type">
                <el-tag size="small" :type="noticeTagType(notice.type)" effect="dark">{{ noticeTypeName(notice.type) }}</el-tag>
              </div>
              <div class="notice-content">
                <div class="notice-title">{{ notice.title }}</div>
                <div class="notice-time">{{ notice.time }}</div>
              </div>
            </div>
            <div class="notice-empty" v-if="mockNotices.length === 0">
              <el-empty description="暂无通知" :image-size="80" />
            </div>
          </div>
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { familyApi } from '@/api'

const loading = ref(false)
const dashboardData = ref(null)

const mockMother = {
  name: '张女士',
  healthStatus: 'good',
  stayDays: 12,
  expectedDischarge: '2026-07-05',
  roomNo: '302'
}

const mockBabies = [
  {
    id: 1,
    name: '小年糕',
    gender: '男',
    todaySleep: '约16小时',
    weight: '3.6kg',
    feedCount: 8,
    jaundiceStatus: '正常'
  },
  {
    id: 2,
    name: '小汤圆',
    gender: '女',
    todaySleep: '约15小时',
    weight: '3.4kg',
    feedCount: 7,
    jaundiceStatus: '正常'
  }
]

const mockTodayMeals = [
  { type: 'breakfast', dishes: '小米粥、鸡蛋羹、凉拌时蔬' },
  { type: 'lunch', dishes: '鲫鱼汤、糙米饭、清炒虾仁' },
  { type: 'dinner', dishes: '银耳莲子羹、蒸鸡丝、时蔬沙拉' },
  { type: 'snack', dishes: '木瓜牛奶、红豆糕' }
]

const mockCareActivities = [
  { title: '宝宝小年糕洗澡完成', time: '今天 09:30' },
  { title: '宝宝小汤圆抚触完成', time: '今天 10:15' },
  { title: '黄疸检测正常', time: '今天 11:00' },
  { title: '妈妈产后康复操指导', time: '今天 14:30' },
  { title: '房间消毒完成', time: '今天 16:00' }
]

const mockNotices = [
  { type: 'important', title: '本周六将有儿科医生巡诊', time: '2小时前' },
  { type: 'normal', title: '天气转凉，注意保暖', time: '1天前' },
  { type: 'activity', title: '下周三有手工DIY活动', time: '2天前' }
]

const fetchData = async () => {
  loading.value = true
  try {
    const data = await familyApi.dashboard()
    dashboardData.value = data
  } catch (e) {
    console.error('获取首页数据失败', e)
  } finally {
    loading.value = false
  }
}

const statusTagType = (status) => {
  const map = { good: 'success', recovering: 'warning', poor: 'danger' }
  return map[status] || 'info'
}

const healthStatusText = (status) => {
  const map = { good: '恢复良好', recovering: '恢复中', poor: '需关注' }
  return map[status] || '状态未知'
}

const mealIcon = (type) => {
  const map = { breakfast: '🌅', lunch: '☀️', dinner: '🌙', snack: '🍮' }
  return map[type] || '🍽️'
}

const mealTypeName = (type) => {
  const map = { breakfast: '早餐', lunch: '午餐', dinner: '晚餐', snack: '加餐' }
  return map[type] || '餐食'
}

const noticeTagType = (type) => {
  const map = { important: 'danger', normal: 'info', activity: 'warning' }
  return map[type] || 'info'
}

const noticeTypeName = (type) => {
  const map = { important: '重要', normal: '普通', activity: '活动' }
  return map[type] || '通知'
}

onMounted(fetchData)
</script>

<style lang="scss" scoped>
.family-dashboard {
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

.mother-card {
  background: linear-gradient(135deg, #fff0f6 0%, #ffd6e7 100%);
  border: none;
  border-radius: 16px;

  :deep(.el-card__body) {
    padding: 24px;
  }
}

.mother-card-content {
  display: flex;
  align-items: center;
  gap: 24px;
}

.mother-avatar {
  width: 88px;
  height: 88px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.8);
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 4px 12px rgba(255, 133, 192, 0.3);
}

.mother-info {
  flex: 1;
}

.mother-name {
  font-size: 24px;
  font-weight: 600;
  color: #87385d;
  margin-bottom: 10px;
}

.mother-status-row {
  display: flex;
  align-items: center;
  gap: 16px;
  margin-bottom: 8px;
}

.stay-days {
  font-size: 14px;
  color: #87385d;
}

.mother-expected {
  font-size: 13px;
  color: #a0637f;
}

.mother-room {
  text-align: center;
  padding: 16px 24px;
  background: rgba(255, 255, 255, 0.7);
  border-radius: 12px;
}

.room-label {
  font-size: 12px;
  color: #a0637f;
  margin-bottom: 4px;
}

.room-no {
  font-size: 22px;
  font-weight: 600;
  color: #87385d;
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

.baby-card {
  border-radius: 12px;
  padding: 16px;
  margin-bottom: 8px;
  transition: all 0.3s;

  &.baby-boy {
    background: linear-gradient(135deg, #ecf5ff 0%, #d9ecff 100%);
  }

  &.baby-girl {
    background: linear-gradient(135deg, #fff0f6 0%, #ffe7ef 100%);
  }

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 6px 16px rgba(0, 0, 0, 0.08);
  }
}

.baby-header {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 14px;
}

.baby-avatar {
  width: 44px;
  height: 44px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(255, 255, 255, 0.9);

  &.boy {
    color: #409eff;
  }

  &.girl {
    color: #f56c6c;
  }
}

.baby-name {
  font-size: 16px;
  font-weight: 600;
  margin-bottom: 4px;
}

.baby-summary {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 8px 12px;
}

.summary-item {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 13px;
  color: #606266;
}

.meals-list {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.meal-item {
  display: flex;
  gap: 12px;
  padding: 12px;
  background: linear-gradient(135deg, #f0f9eb 0%, #e1f3d8 100%);
  border-radius: 10px;
  transition: all 0.3s;

  &:hover {
    transform: translateX(4px);
  }
}

.meal-icon {
  width: 36px;
  height: 36px;
  border-radius: 10px;
  background: rgba(255, 255, 255, 0.8);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 18px;
  flex-shrink: 0;
}

.meal-type {
  font-size: 14px;
  font-weight: 600;
  color: #529b2e;
  margin-bottom: 2px;
}

.meal-dishes {
  font-size: 13px;
  color: #606266;
  line-height: 1.4;
}

.care-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.care-item {
  display: flex;
  gap: 12px;
  padding: 12px 14px;
  background: linear-gradient(135deg, #f0f9ff 0%, #e6f7ff 100%);
  border-radius: 10px;
  transition: all 0.3s;

  &:hover {
    background: linear-gradient(135deg, #ecf5ff 0%, #d9ecff 100%);
  }
}

.care-check {
  flex-shrink: 0;
  margin-top: 2px;
}

.care-title {
  font-size: 14px;
  color: #303133;
  margin-bottom: 2px;
}

.care-time {
  font-size: 12px;
  color: #909399;
}

.notice-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.notice-item {
  display: flex;
  gap: 10px;
  padding: 12px 14px;
  background: #fdf6ec;
  border-radius: 10px;
  border-left: 3px solid #e6a23c;
  transition: all 0.3s;

  &:hover {
    background: #faecd8;
  }
}

.notice-title {
  font-size: 14px;
  color: #303133;
  margin-bottom: 2px;
}

.notice-time {
  font-size: 12px;
  color: #909399;
}

.care-empty,
.notice-empty {
  padding: 20px 0;
}
</style>
