<template>
  <div class="family-fees">
    <div class="privacy-tip">
      <el-icon :size="18" color="#e6a23c"><Warning /></el-icon>
      <span>本页面仅展示费用汇总，如有疑问请联系销售顾问，费用变动会有专人通知</span>
    </div>

    <el-row :gutter="20">
      <el-col :span="8">
        <el-card shadow="hover" class="fee-overview-card card-total">
          <div class="fee-card-inner">
            <div class="fee-icon-box">
              <el-icon :size="28" color="#e6a23c"><Money /></el-icon>
            </div>
            <div class="fee-info">
              <div class="fee-label">合同总额</div>
              <div class="fee-value total">¥{{ formatAmount(feeOverview.totalAmount) }}</div>
            </div>
          </div>
        </el-card>
      </el-col>
      <el-col :span="8">
        <el-card shadow="hover" class="fee-overview-card card-paid">
          <div class="fee-card-inner">
            <div class="fee-icon-box">
              <el-icon :size="28" color="#67c23a"><CircleCheckFilled /></el-icon>
            </div>
            <div class="fee-info">
              <div class="fee-label">已支付金额</div>
              <div class="fee-value paid">¥{{ formatAmount(feeOverview.paidAmount) }}</div>
            </div>
          </div>
        </el-card>
      </el-col>
      <el-col :span="8">
        <el-card shadow="hover" class="fee-overview-card card-unpaid">
          <div class="fee-card-inner">
            <div class="fee-icon-box">
              <el-icon :size="28" color="#f56c6c"><WarningFilled /></el-icon>
            </div>
            <div class="fee-info">
              <div class="fee-label">待支付金额</div>
              <div class="fee-value unpaid">¥{{ formatAmount(feeOverview.unpaidAmount) }}</div>
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
              <el-icon :size="18" color="#409eff"><Document /></el-icon>
              <span class="header-title">费用明细（大类）</span>
              <el-tooltip content="仅展示大类费用，内部费用调整细节由销售顾问单独通知" placement="top">
                <el-icon :size="16" color="#909399" style="margin-left: 4px; cursor: pointer;"><QuestionFilled /></el-icon>
              </el-tooltip>
            </div>
          </template>

          <el-table :data="feeBreakdown" style="width: 100%" :header-cell-style="{ background: '#fafafa' }">
            <el-table-column prop="category" label="费用类别" min-width="140">
              <template #default="{ row }">
                <div class="category-cell">
                  <span class="category-icon">{{ categoryIcon(row.type) }}</span>
                  <span>{{ row.category }}</span>
                </div>
              </template>
            </el-table-column>
            <el-table-column prop="description" label="说明" min-width="200">
              <template #default="{ row }">
                <span class="desc-text">{{ row.description }}</span>
              </template>
            </el-table-column>
            <el-table-column prop="amount" label="金额" width="140" align="right">
              <template #default="{ row }">
                <span class="amount-text">¥{{ formatAmount(row.amount) }}</span>
              </template>
            </el-table-column>
          </el-table>

          <el-divider />

          <div class="breakdown-total">
            <span class="breakdown-label">合计</span>
            <span class="breakdown-value">¥{{ formatAmount(feeOverview.totalAmount) }}</span>
          </div>
        </el-card>
      </el-col>

      <el-col :span="12">
        <el-card shadow="hover" class="section-card">
          <template #header>
            <div class="card-header">
              <el-icon :size="18" color="#67c23a"><Tickets /></el-icon>
              <span class="header-title">支付记录</span>
            </div>
          </template>

          <div class="payment-list" v-loading="loading">
            <div
              class="payment-item"
              v-for="(item, idx) in paymentRecords"
              :key="idx"
            >
              <div class="payment-status">
                <el-tag type="success" effect="light" round size="large">
                  <el-icon :size="12"><CircleCheck /></el-icon>
                  已支付
                </el-tag>
              </div>
              <div class="payment-body">
                <div class="payment-title">
                  <span class="payment-name">{{ item.name }}</span>
                  <span class="payment-amount">¥{{ formatAmount(item.amount) }}</span>
                </div>
                <div class="payment-meta">
                  <span class="payment-date">
                    <el-icon :size="13" color="#909399"><Calendar /></el-icon>
                    {{ item.payDate }}
                  </span>
                  <el-tag size="small" effect="plain" type="info">
                    {{ payMethodText(item.method) }}
                  </el-tag>
                </div>
              </div>
            </div>

            <el-empty v-if="paymentRecords.length === 0 && !loading" description="暂无支付记录" :image-size="80" />
          </div>
        </el-card>
      </el-col>
    </el-row>

    <el-row :gutter="20" style="margin-top: 20px;">
      <el-col :span="24">
        <el-card shadow="hover" class="section-card tip-card">
          <div class="tip-content">
            <div class="tip-icon-box">
              <el-icon :size="32" color="#e6a23c"><Service /></el-icon>
            </div>
            <div class="tip-text-group">
              <div class="tip-title">专属服务团队</div>
              <div class="tip-desc">
                如有任何费用疑问或需求，请随时联系您的销售顾问，我们将竭诚为您服务。
                费用变动、退款等内部流程会有专人单独沟通通知。
              </div>
              <div class="tip-contacts">
                <div class="contact-item">
                  <el-icon :size="14" color="#409eff"><User /></el-icon>
                  <span>销售顾问：刘顾问</span>
                  <el-tag type="info" size="small" effect="plain">137-7777-5678</el-tag>
                </div>
                <div class="contact-item">
                  <el-icon :size="14" color="#e6a23c"><User /></el-icon>
                  <span>前台服务：</span>
                  <el-tag type="info" size="small" effect="plain">0755-8888-6666</el-tag>
                </div>
              </div>
            </div>
          </div>
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { feeApi, contractApi, motherApi } from '@/api'

const loading = ref(false)
const currentMotherId = ref(null)

const feeOverview = reactive({
  totalAmount: 68800,
  paidAmount: 48800,
  unpaidAmount: 20000
})

const feeBreakdown = ref([
  {
    type: 'package',
    category: '月子套餐费',
    description: '标准28天尊享套餐（含基础护理、月子餐、住宿等）',
    amount: 58800
  },
  {
    type: 'deposit',
    category: '入住押金',
    description: '房间及物品使用押金（出院无损坏可退）',
    amount: 5000
  },
  {
    type: 'extra',
    category: '增购服务费',
    description: '额外产康项目、宝宝摄影等增购服务（大类汇总）',
    amount: 5000
  }
])

const paymentRecords = ref([
  {
    name: '合同首付款',
    amount: 20000,
    payDate: '2026-05-20 14:30',
    method: 'wechat'
  },
  {
    name: '入住尾款',
    amount: 28800,
    payDate: '2026-06-04 10:15',
    method: 'bank'
  }
])

const formatAmount = (amount) => {
  if (!amount && amount !== 0) return '0.00'
  return Number(amount).toLocaleString('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

const categoryIcon = (type) => {
  const map = { package: '📦', deposit: '🔒', extra: '⭐' }
  return map[type] || '💰'
}

const payMethodText = (method) => {
  const map = { wechat: '微信支付', alipay: '支付宝', bank: '银行转账', cash: '现金', card: '刷卡' }
  return map[method] || method
}

const fetchData = async () => {
  loading.value = true
  try {
    const mothers = await motherApi.list()
    const motherList = Array.isArray(mothers) ? mothers : (mothers?.list || [])
    if (motherList.length > 0) {
      currentMotherId.value = motherList[0].id

      const contracts = await contractApi.list({ motherId: currentMotherId.value })
      const contractList = Array.isArray(contracts) ? contracts : (contracts?.list || [])
      if (contractList.length > 0) {
        const c = contractList[0]
        feeOverview.totalAmount = c.totalAmount || 0
        feeOverview.paidAmount = c.paidAmount || 0
        feeOverview.unpaidAmount = (c.totalAmount || 0) - (c.paidAmount || 0)
      }

      const fees = await feeApi.list({ motherId: currentMotherId.value })
      const feeList = Array.isArray(fees) ? fees : (fees?.list || [])
      const paid = feeList.filter(f => f.status === 'paid')
      paymentRecords.value = paid.map(f => ({
        name: f.name || f.type || '费用支付',
        amount: f.amount || 0,
        payDate: f.paidAt || f.createdAt || '',
        method: f.payMethod || 'bank'
      }))
    }
  } catch (e) {
    console.error('获取费用数据失败', e)
  } finally {
    loading.value = false
  }
}

onMounted(fetchData)
</script>

<style lang="scss" scoped>
.family-fees {
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

.fee-overview-card {
  border-radius: 14px;
  border: none;
  overflow: hidden;

  :deep(.el-card__body) {
    padding: 0;
  }

  &.card-total {
    background: linear-gradient(135deg, #fff7e6 0%, #fde68a 100%);
  }

  &.card-paid {
    background: linear-gradient(135deg, #f0f9eb 0%, #bbf7d0 100%);
  }

  &.card-unpaid {
    background: linear-gradient(135deg, #fef0f0 0%, #fecaca 100%);
  }
}

.fee-card-inner {
  display: flex;
  align-items: center;
  gap: 18px;
  padding: 24px;
}

.fee-icon-box {
  width: 60px;
  height: 60px;
  border-radius: 16px;
  background: rgba(255, 255, 255, 0.8);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.06);
}

.fee-info {
  flex: 1;
}

.fee-label {
  font-size: 13px;
  color: #606266;
  margin-bottom: 6px;
}

.fee-value {
  font-size: 26px;
  font-weight: 700;
  font-family: 'DIN Alternate', 'Arial Narrow', sans-serif;

  &.total {
    color: #b45309;
  }

  &.paid {
    color: #15803d;
  }

  &.unpaid {
    color: #dc2626;
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

.category-cell {
  display: flex;
  align-items: center;
  gap: 8px;
  font-weight: 500;
  color: #303133;
}

.category-icon {
  font-size: 18px;
}

.desc-text {
  font-size: 13px;
  color: #606266;
  line-height: 1.5;
}

.amount-text {
  font-weight: 600;
  color: #303133;
  font-family: 'DIN Alternate', 'Arial Narrow', sans-serif;
}

.breakdown-total {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 4px 8px;
}

.breakdown-label {
  font-size: 15px;
  font-weight: 600;
  color: #303133;
}

.breakdown-value {
  font-size: 20px;
  font-weight: 700;
  color: #b45309;
  font-family: 'DIN Alternate', 'Arial Narrow', sans-serif;
}

.payment-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
  max-height: 420px;
  overflow-y: auto;
}

.payment-item {
  border: 1px solid #e4e7ed;
  border-radius: 12px;
  overflow: hidden;
  transition: all 0.3s;

  &:hover {
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.06);
  }
}

.payment-status {
  padding: 8px 14px;
  background: linear-gradient(135deg, #f0f9eb 0%, #e1f3d8 100%);
}

.payment-body {
  padding: 12px 14px;
}

.payment-title {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 6px;
}

.payment-name {
  font-size: 14px;
  font-weight: 600;
  color: #303133;
}

.payment-amount {
  font-size: 18px;
  font-weight: 700;
  color: #15803d;
  font-family: 'DIN Alternate', 'Arial Narrow', sans-serif;
}

.payment-meta {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 13px;
  color: #909399;
}

.payment-date {
  display: flex;
  align-items: center;
  gap: 4px;
}

.tip-card {
  background: linear-gradient(135deg, #fdf6ec 0%, #faecd8 100%);
  border: none;

  :deep(.el-card__body) {
    padding: 24px;
  }
}

.tip-content {
  display: flex;
  gap: 20px;
  align-items: flex-start;
}

.tip-icon-box {
  width: 64px;
  height: 64px;
  border-radius: 18px;
  background: rgba(255, 255, 255, 0.8);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  box-shadow: 0 4px 12px rgba(230, 162, 60, 0.2);
}

.tip-text-group {
  flex: 1;
}

.tip-title {
  font-size: 18px;
  font-weight: 600;
  color: #874d00;
  margin-bottom: 8px;
}

.tip-desc {
  font-size: 14px;
  color: #874d00;
  line-height: 1.6;
  margin-bottom: 14px;
}

.tip-contacts {
  display: flex;
  flex-wrap: wrap;
  gap: 24px;
}

.contact-item {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 14px;
  color: #874d00;
}
</style>
