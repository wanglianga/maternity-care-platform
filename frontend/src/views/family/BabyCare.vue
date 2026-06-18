<template>
  <div class="baby-care">
    <div class="privacy-tip">
      <el-icon :size="18" color="#e6a23c"><Warning /></el-icon>
      <span>宝宝的详细医疗数据由医护人员保存，此处仅展示日常护理结论性摘要，如有疑问请联系护士长</span>
    </div>

    <div class="babies-container" v-loading="loading">
      <div
        class="baby-card-wrapper"
        v-for="baby in babies"
        :key="baby.id"
      >
        <el-card shadow="hover" class="baby-main-card" :class="baby.gender === '男' ? 'card-boy' : 'card-girl'">
          <div class="baby-header-row">
            <div class="baby-avatar-wrap">
              <div class="baby-avatar" :class="baby.gender === '男' ? 'avatar-boy' : 'avatar-girl'">
                <el-icon :size="32">{{ baby.gender === '男' ? '👦' : '👧' }}</el-icon>
              </div>
              <div class="baby-info-wrap">
                <div class="baby-name">{{ baby.name }}</div>
                <div class="baby-meta-row">
                  <el-tag size="small" :type="baby.gender === '男' ? 'primary' : 'danger'" effect="light">
                    {{ baby.gender }}宝
                  </el-tag>
                  <span class="baby-age">{{ baby.age || '出生12天' }}</span>
                </div>
              </div>
            </div>
            <div class="baby-birth" :class="baby.gender === '男' ? 'text-boy' : 'text-girl'">
              出生日期：{{ baby.birthDate || '2026-06-04' }}
            </div>
          </div>
        </el-card>

        <el-card shadow="hover" class="section-card" style="margin-top: 16px;">
          <template #header>
            <div class="card-header">
              <el-icon :size="18" color="baby.gender === '男' ? '#409eff' : '#f56c6c'"><DataBoard /></el-icon>
              <span class="header-title">今日数据摘要</span>
            </div>
          </template>
          <el-row :gutter="12">
            <el-col :span="8">
              <div class="stat-card stat-sleep">
                <div class="stat-icon-box">
                  <el-icon :size="20" color="#909399"><Moon /></el-icon>
                </div>
                <div class="stat-content">
                  <div class="stat-label">睡眠总时长</div>
                  <div class="stat-value">{{ baby.todaySleep || '约16小时' }}</div>
                </div>
              </div>
            </el-col>
            <el-col :span="8">
              <div class="stat-card stat-feed">
                <div class="stat-icon-box">
                  <el-icon :size="20" color="#e6a23c"><MilkTea /></el-icon>
                </div>
                <div class="stat-content">
                  <div class="stat-label">今日喂奶</div>
                  <div class="stat-value">{{ baby.feedCount || 8 }} 次</div>
                </div>
              </div>
            </el-col>
            <el-col :span="8">
              <div class="stat-card stat-weight">
                <div class="stat-icon-box">
                  <el-icon :size="20" color="#67c23a"><Scale /></el-icon>
                </div>
                <div class="stat-content">
                  <div class="stat-label">最新体重</div>
                  <div class="stat-value">{{ baby.weight || '3.6kg' }}</div>
                </div>
              </div>
            </el-col>
            <el-col :span="8" style="margin-top: 12px;">
              <div class="stat-card stat-excretion">
                <div class="stat-icon-box">
                  <el-icon :size="20" color="#909399"><DocumentDelete /></el-icon>
                </div>
                <div class="stat-content">
                  <div class="stat-label">排便次数</div>
                  <div class="stat-value">{{ baby.excretion || 5 }} 次</div>
                </div>
              </div>
            </el-col>
            <el-col :span="8" style="margin-top: 12px;">
              <div class="stat-card stat-jaundice" :class="baby.jaundiceStatus === '正常' ? 'normal' : 'watch'">
                <div class="stat-icon-box">
                  <el-icon :size="20" color="#409eff"><Sunny /></el-icon>
                </div>
                <div class="stat-content">
                  <div class="stat-label">黄疸状态</div>
                  <div class="stat-value">{{ baby.jaundiceStatus || '正常' }}</div>
                </div>
              </div>
            </el-col>
          </el-row>
        </el-card>

        <el-card shadow="hover" class="section-card" style="margin-top: 16px;">
          <template #header>
            <div class="card-header">
              <el-icon :size="18" color="#67c23a"><TrendCharts /></el-icon>
              <span class="header-title">近7天体重趋势</span>
            </div>
          </template>
          <div class="weight-trend">
            <div class="trend-summary">
              <el-tag type="success" effect="light" size="large">
                <el-icon><Top /></el-icon>
                体重稳步增长，发育良好
              </el-tag>
            </div>
            <div class="trend-chart">
              <div
                class="trend-item"
                v-for="(item, idx) in baby.weightTrend || defaultWeightTrend"
                :key="idx"
              >
                <div class="trend-bar-wrapper">
                  <div
                    class="trend-bar"
                    :style="{ height: (40 + idx * 12) + '%' }"
                  ></div>
                </div>
                <div class="trend-label">{{ item.date }}</div>
                <div class="trend-conclusion">{{ item.conclusion }}</div>
              </div>
            </div>
          </div>
        </el-card>

        <el-card shadow="hover" class="section-card" style="margin-top: 16px;">
          <template #header>
            <div class="card-header">
              <el-icon :size="18" color="#e6a23c"><List /></el-icon>
              <span class="header-title">近期护理记录</span>
            </div>
          </template>
          <div class="care-records">
            <div
              class="care-record-item"
              v-for="(record, idx) in baby.careRecords || defaultCareRecords"
              :key="idx"
            >
              <div class="care-record-date">{{ record.date }}</div>
              <div class="care-record-content">
                <el-icon :size="16" color="#67c23a"><CircleCheckFilled /></el-icon>
                <span>{{ record.conclusion }}</span>
              </div>
            </div>
          </div>
        </el-card>

        <el-card shadow="hover" class="section-card abnormal-card" style="margin-top: 16px;" v-if="baby.abnormalRecords && baby.abnormalRecords.length > 0">
          <template #header>
            <div class="card-header">
              <el-icon :size="18" color="#f56c6c"><Warning /></el-icon>
              <span class="header-title">异常观察跟踪</span>
              <el-tag size="small" type="warning" effect="light">
                <span class="abnormal-count">{{ baby.abnormalRecords.length }} 项关注</span>
              </el-tag>
            </div>
          </template>
          <div class="abnormal-list">
            <div
              class="abnormal-item"
              v-for="item in baby.abnormalRecords"
              :key="item.id"
              @click="viewAbnormalDetail(item)"
            >
              <div class="abnormal-header">
                <el-tag :type="abnormalIndicatorType(item.indicator)" effect="dark" size="small" round>
                  {{ item.abnormalTypeName }}
                </el-tag>
                <span class="abnormal-date">{{ item.reportedDate }}</span>
              </div>
              <div class="abnormal-conclusion">{{ item.conclusion }}</div>
              <div class="abnormal-info">
                <div class="info-item">
                  <span class="info-label">观察频率</span>
                  <span class="info-value">{{ item.observationFrequency }}</span>
                </div>
                <div class="info-item" v-if="item.nextRecheckTime">
                  <span class="info-label">下次复查</span>
                  <span class="info-value">{{ formatDateTime(item.nextRecheckTime) }}</span>
                </div>
              </div>
            </div>
          </div>
          <div class="abnormal-footer-tip">
            <el-icon :size="14" color="#909399"><InfoFilled /></el-icon>
            <span>以上为护理团队评估后的结论性展示，详细医疗数据由医护团队内部保存。如有任何疑问请随时联系护士长。</span>
          </div>
        </el-card>
      </div>
    </div>

    <el-empty v-if="babies.length === 0 && !loading" description="暂无宝宝信息" />

    <el-dialog v-model="abnormalDetailVisible" title="异常观察详情" width="520px">
      <div v-if="currentAbnormal" class="abnormal-detail">
        <div class="detail-header">
          <el-tag :type="abnormalIndicatorType(currentAbnormal.indicator)" effect="dark" size="large" round>
            {{ currentAbnormal.abnormalTypeName }}
          </el-tag>
          <span class="detail-date">记录日期：{{ currentAbnormal.reportedDate }}</span>
        </div>

        <el-divider>处理结论</el-divider>
        <el-alert :title="currentAbnormal.conclusion" :type="currentAbnormal.indicator === 'warning' ? 'error' : currentAbnormal.indicator === 'attention' ? 'warning' : 'success'" :closable="false" show-icon />

        <el-divider>观察安排</el-divider>
        <div class="observe-schedule">
          <div class="schedule-item">
            <span class="schedule-label">观察频率</span>
            <span class="schedule-value">{{ currentAbnormal.observationFrequency }}</span>
          </div>
          <div class="schedule-item" v-if="currentAbnormal.nextRecheckTime">
            <span class="schedule-label">下次复查</span>
            <span class="schedule-value">{{ formatDateTime(currentAbnormal.nextRecheckTime) }}</span>
          </div>
        </div>

        <el-divider>温馨提示</el-divider>
        <div class="detail-tips">
          <div v-for="(tip, idx) in currentAbnormal.tips" :key="idx" class="tip-item">
            <el-icon :size="14" color="#909399"><InfoFilled /></el-icon>
            <span>{{ tip }}</span>
          </div>
        </div>

        <div class="detail-footer">
          <el-icon :size="14" color="#e6a23c"><WarningFilled /></el-icon>
          <span>宝宝的健康时刻被专业团队关注，如有任何紧急情况护士会第一时间联系您。如需了解更多细节，请联系护士长或专属月嫂。</span>
        </div>
      </div>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { babyApi, observationApi, motherApi, babyAbnormalApi } from '@/api'
import dayjs from 'dayjs'

const loading = ref(false)
const babies = ref([])
const abnormalDetailVisible = ref(false)
const currentAbnormal = ref(null)

const defaultWeightTrend = [
  { date: '06-10', conclusion: '正常' },
  { date: '06-11', conclusion: '略增' },
  { date: '06-12', conclusion: '增长' },
  { date: '06-13', conclusion: '增长' },
  { date: '06-14', conclusion: '良好' },
  { date: '06-15', conclusion: '良好' },
  { date: '06-16', conclusion: '良好' }
]

const defaultCareRecords = [
  { date: '今天', conclusion: '洗澡完成 · 抚触完成 · 黄疸检测正常' },
  { date: '昨天', conclusion: '发育评估正常 · 脐带护理完成' },
  { date: '2天前', conclusion: '洗澡完成 · 疫苗接种完成' },
  { date: '3天前', conclusion: '听力筛查通过 · 抚触完成' },
  { date: '4天前', conclusion: '儿科医生巡诊正常 · 洗澡完成' }
]

const mockBabies = [
  {
    id: 1,
    name: '小年糕',
    gender: '男',
    age: '出生12天',
    birthDate: '2026-06-04',
    todaySleep: '约16小时',
    feedCount: 8,
    weight: '3.6kg',
    excretion: 5,
    jaundiceStatus: '正常',
    weightTrend: defaultWeightTrend,
    careRecords: defaultCareRecords
  },
  {
    id: 2,
    name: '小汤圆',
    gender: '女',
    age: '出生12天',
    birthDate: '2026-06-04',
    todaySleep: '约15小时',
    feedCount: 7,
    weight: '3.4kg',
    excretion: 4,
    jaundiceStatus: '正常',
    weightTrend: defaultWeightTrend,
    careRecords: defaultCareRecords
  }
]

const fetchData = async () => {
  loading.value = true
  try {
    const mothers = await motherApi.list()
    const motherList = Array.isArray(mothers) ? mothers : (mothers?.list || [])
    if (motherList.length > 0) {
      const motherId = motherList[0].id
      const [babyData, abnormalData] = await Promise.all([
        babyApi.list({ motherId }),
        babyAbnormalApi.list({ motherId })
      ])
      const babyList = Array.isArray(babyData) ? babyData : (babyData?.list || [])
      const abnormalList = Array.isArray(abnormalData) ? abnormalData : (abnormalData?.data || abnormalData?.list || [])

      babies.value = babyList.map(b => {
        const babyAbnormals = abnormalList.filter(a => a.babyId === b.id) || []
        return {
          ...b,
          todaySleep: b.todaySleep || '约15-16小时',
          feedCount: b.feedCount || 8,
          weight: b.weight || '3.5kg',
          excretion: b.excretion || 5,
          jaundiceStatus: b.jaundiceStatus || '正常',
          weightTrend: defaultWeightTrend,
          careRecords: defaultCareRecords,
          abnormalRecords: babyAbnormals.filter(a => a.status !== 'resolved').slice(0, 3)
        }
      })
    }
    if (babies.value.length === 0) {
      babies.value = mockBabies
    }
  } catch (e) {
    console.error('获取宝宝数据失败', e)
    babies.value = mockBabies
  } finally {
    loading.value = false
  }
}

const abnormalIndicatorType = (indicator) => {
  const map = {
    normal: 'success',
    attention: 'warning',
    warning: 'danger'
  }
  return map[indicator] || 'info'
}

const formatDateTime = (d) => {
  if (!d) return '-'
  return dayjs(d).format('YYYY-MM-DD HH:mm')
}

const viewAbnormalDetail = (item) => {
  currentAbnormal.value = item
  abnormalDetailVisible.value = true
}

onMounted(fetchData)
</script>

<style lang="scss" scoped>
.baby-care {
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

.babies-container {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.baby-card-wrapper {
  padding-bottom: 8px;
}

.baby-main-card {
  border-radius: 16px;
  border: none;

  &.card-boy {
    background: linear-gradient(135deg, #ecf5ff 0%, #d9ecff 100%);
  }

  &.card-girl {
    background: linear-gradient(135deg, #fff0f6 0%, #ffe7ef 100%);
  }

  :deep(.el-card__body) {
    padding: 20px 24px;
  }
}

.baby-header-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 16px;
}

.baby-avatar-wrap {
  display: flex;
  align-items: center;
  gap: 16px;
}

.baby-avatar {
  width: 64px;
  height: 64px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(255, 255, 255, 0.9);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.06);

  &.avatar-boy {
    color: #409eff;
  }

  &.avatar-girl {
    color: #f56c6c;
  }
}

.baby-info-wrap {
  .baby-name {
    font-size: 22px;
    font-weight: 600;
    color: #303133;
    margin-bottom: 6px;
  }
}

.baby-meta-row {
  display: flex;
  align-items: center;
  gap: 10px;
}

.baby-age {
  font-size: 13px;
  color: #606266;
}

.baby-birth {
  font-size: 13px;
  padding: 8px 14px;
  background: rgba(255, 255, 255, 0.7);
  border-radius: 8px;

  &.text-boy {
    color: #409eff;
  }

  &.text-girl {
    color: #f56c6c;
  }
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

.stat-card {
  display: flex;
  gap: 12px;
  padding: 14px;
  border-radius: 10px;
  transition: all 0.3s;

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.06);
  }
}

.stat-sleep {
  background: linear-gradient(135deg, #f4f4f5 0%, #e9e9eb 100%);
}

.stat-feed {
  background: linear-gradient(135deg, #fdf6ec 0%, #faecd8 100%);
}

.stat-weight {
  background: linear-gradient(135deg, #f0f9eb 0%, #e1f3d8 100%);
}

.stat-excretion {
  background: linear-gradient(135deg, #f4f4f5 0%, #e9e9eb 100%);
}

.stat-jaundice {
  &.normal {
    background: linear-gradient(135deg, #ecf5ff 0%, #d9ecff 100%);
  }
  &.watch {
    background: linear-gradient(135deg, #fef0f0 0%, #fde2e2 100%);
  }
}

.stat-icon-box {
  width: 36px;
  height: 36px;
  border-radius: 10px;
  background: rgba(255, 255, 255, 0.8);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.stat-label {
  font-size: 12px;
  color: #909399;
  margin-bottom: 2px;
}

.stat-value {
  font-size: 16px;
  font-weight: 600;
  color: #303133;
}

.weight-trend {
  padding: 4px 0;
}

.trend-summary {
  margin-bottom: 20px;
  text-align: center;
}

.trend-chart {
  display: flex;
  justify-content: space-between;
  align-items: flex-end;
  gap: 8px;
  padding: 0 4px;
  min-height: 180px;
}

.trend-item {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
}

.trend-bar-wrapper {
  height: 120px;
  width: 100%;
  display: flex;
  align-items: flex-end;
  justify-content: center;
}

.trend-bar {
  width: 24px;
  background: linear-gradient(180deg, #95d475 0%, #67c23a 100%);
  border-radius: 12px 12px 4px 4px;
  min-height: 16px;
  transition: all 0.3s;

  &:hover {
    background: linear-gradient(180deg, #85ce61 0%, #5daf34 100%);
  }
}

.trend-label {
  font-size: 12px;
  color: #909399;
}

.trend-conclusion {
  font-size: 11px;
  color: #67c23a;
  font-weight: 500;
}

.care-records {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.care-record-item {
  display: flex;
  align-items: flex-start;
  gap: 16px;
  padding: 12px 14px;
  background: linear-gradient(135deg, #f0f9eb 0%, #f9fcff 100%);
  border-radius: 10px;
}

.care-record-date {
  width: 56px;
  flex-shrink: 0;
  font-size: 13px;
  font-weight: 600;
  color: #409eff;
  padding-top: 1px;
}

.care-record-content {
  flex: 1;
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 13px;
  color: #606266;
  line-height: 1.5;
}

.abnormal-card {
  border: 1px solid #fecaca;
  background: linear-gradient(135deg, #fef2f2 0%, #fff1f2 100%);

  :deep(.el-card__header) {
    background: linear-gradient(135deg, #fee2e2 0%, #fecaca 100%);
  }

  .header-title {
    color: #b91c1c;
  }

  .abnormal-count {
    font-weight: 600;
  }
}

.abnormal-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.abnormal-item {
  padding: 14px 16px;
  background: #ffffff;
  border-radius: 10px;
  border: 1px solid #fecaca;
  cursor: pointer;
  transition: all 0.3s;

  &:hover {
    box-shadow: 0 4px 12px rgba(239, 68, 68, 0.1);
    transform: translateY(-1px);
  }
}

.abnormal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.abnormal-date {
  font-size: 12px;
  color: #909399;
}

.abnormal-conclusion {
  font-size: 14px;
  color: #303133;
  line-height: 1.6;
  margin-bottom: 10px;
}

.abnormal-info {
  display: flex;
  gap: 20px;
  padding-top: 8px;
  border-top: 1px dashed #fde2e2;
}

.info-item {
  display: flex;
  flex-direction: column;
  gap: 2px;

  .info-label {
    font-size: 12px;
    color: #909399;
  }

  .info-value {
    font-size: 13px;
    color: #606266;
    font-weight: 500;
  }
}

.abnormal-footer-tip {
  display: flex;
  align-items: flex-start;
  gap: 6px;
  margin-top: 12px;
  padding: 10px 12px;
  background: #fef9c3;
  border-radius: 8px;
  font-size: 12px;
  color: #854d0e;
  line-height: 1.5;
}

.abnormal-detail {
  .detail-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 8px;
  }

  .detail-date {
    font-size: 13px;
    color: #909399;
  }
}

.observe-schedule {
  padding: 14px 18px;
  background: #f0f9eb;
  border-radius: 10px;

  .schedule-item {
    display: flex;
    justify-content: space-between;
    padding: 6px 0;

    .schedule-label {
      color: #606266;
      font-size: 14px;
    }

    .schedule-value {
      color: #303133;
      font-size: 14px;
      font-weight: 500;
    }
  }
}

.detail-tips {
  display: flex;
  flex-direction: column;
  gap: 8px;

  .tip-item {
    display: flex;
    align-items: flex-start;
    gap: 6px;
    font-size: 13px;
    color: #606266;
    line-height: 1.5;
  }
}

.detail-footer {
  display: flex;
  align-items: flex-start;
  gap: 8px;
  margin-top: 16px;
  padding: 12px 14px;
  background: #fff7e6;
  border-radius: 8px;
  font-size: 12px;
  color: #874d00;
  line-height: 1.6;
}
</style>
