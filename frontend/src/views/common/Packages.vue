<template>
  <div class="packages-page">
    <el-card shadow="never">
      <div class="toolbar">
        <div class="toolbar-left">
          <el-select v-model="filterType" placeholder="按类型筛选" clearable style="width: 180px; margin-right: 12px;" @change="fetchList">
            <el-option label="标准型" value="standard" />
            <el-option label="豪华型" value="deluxe" />
            <el-option label="尊享型" value="premium" />
          </el-select>
          <el-radio-group v-model="viewMode" size="default" style="margin-right: 12px;">
            <el-radio-button value="card">
              <el-icon><Grid /></el-icon>
              <span style="margin-left: 4px;">卡片</span>
            </el-radio-button>
            <el-radio-button value="table">
              <el-icon><List /></el-icon>
              <span style="margin-left: 4px;">表格</span>
            </el-radio-button>
          </el-radio-group>
        </div>
        <div class="toolbar-right">
          <el-button type="primary" :icon="Plus" @click="handleAdd">新增套餐</el-button>
        </div>
      </div>

      <div v-if="viewMode === 'card'" class="package-cards" style="margin-top: 16px;">
        <el-row :gutter="20">
          <el-col :xs="24" :sm="12" :md="8" :lg="8" v-for="pkg in filteredList" :key="pkg.id">
            <el-card class="package-card" shadow="hover" :class="'type-' + pkg.type">
              <template #header>
                <div class="card-header">
                  <span class="pkg-name">{{ pkg.name }}</span>
                  <el-tag :type="typeTagType(pkg.type)" size="small">{{ typeText(pkg.type) }}</el-tag>
                </div>
              </template>
              <div class="card-body">
                <div class="pkg-desc">{{ pkg.description }}</div>
                <div class="pkg-meta">
                  <span class="pkg-days">
                    <el-icon><Calendar /></el-icon>
                    {{ pkg.days }}天
                  </span>
                  <el-tag v-if="pkg.status === 'active'" type="success" size="small" effect="dark">启用中</el-tag>
                  <el-tag v-else type="info" size="small" effect="plain">已停用</el-tag>
                </div>
                <div class="pkg-price">
                  <span class="price-unit">¥</span>
                  <span class="price-value">{{ pkg.basePrice?.toLocaleString() }}</span>
                  <span class="price-tip">起</span>
                </div>
                <el-divider content-position="left" style="margin: 14px 0;">服务列表</el-divider>
                <ul class="pkg-services">
                  <li v-for="(s, idx) in (pkg.services || []).slice(0, 6)" :key="idx">
                    <el-icon color="#67c23a"><CircleCheck /></el-icon>
                    <span>{{ s }}</span>
                  </li>
                  <li v-if="(pkg.services || []).length > 6" class="more-services">
                    还有 {{ (pkg.services || []).length - 6 }} 项服务...
                  </li>
                </ul>
              </div>
              <template #footer>
                <div class="card-footer">
                  <el-button size="small" type="primary" link @click="handleEdit(pkg)">编辑</el-button>
                  <el-button size="small" type="danger" link @click="handleDelete(pkg)">删除</el-button>
                </div>
              </template>
            </el-card>
          </el-col>
        </el-row>
        <el-empty v-if="filteredList.length === 0" description="暂无套餐数据" style="margin-top: 60px;" />
      </div>

      <el-table v-else :data="filteredList" stripe style="width: 100%; margin-top: 16px;" v-loading="loading">
        <el-table-column prop="name" label="套餐名称" width="180" />
        <el-table-column label="类型" width="120">
          <template #default="{ row }">
            <el-tag :type="typeTagType(row.type)">{{ typeText(row.type) }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="days" label="天数" width="100">
          <template #default="{ row }">
            {{ row.days }}天
          </template>
        </el-table-column>
        <el-table-column prop="basePrice" label="基础价格" width="140">
          <template #default="{ row }">
            <span class="price-text">¥{{ row.basePrice?.toLocaleString() }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="description" label="描述" min-width="200" show-overflow-tooltip />
        <el-table-column label="服务" min-width="320">
          <template #default="{ row }">
            <el-tag v-for="(s, idx) in (row.services || []).slice(0, 5)" :key="idx" size="small" type="success" effect="plain" style="margin: 2px;">
              {{ s }}
            </el-tag>
            <el-tag v-if="(row.services || []).length > 5" size="small" type="info" effect="plain" style="margin: 2px;">
              +{{ (row.services || []).length - 5 }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="状态" width="100">
          <template #default="{ row }">
            <el-tag v-if="row.status === 'active'" type="success">启用</el-tag>
            <el-tag v-else type="info">停用</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="200" fixed="right">
          <template #default="{ row }">
            <el-button link type="primary" @click="handleEdit(row)">编辑</el-button>
            <el-button link type="danger" @click="handleDelete(row)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <el-dialog v-model="dialogVisible" :title="isEdit ? '编辑套餐' : '新增套餐'" width="640px" destroy-on-close>
      <el-form ref="formRef" :model="form" :rules="rules" label-width="100px">
        <el-row :gutter="16">
          <el-col :span="12">
            <el-form-item label="套餐名称" prop="name">
              <el-input v-model="form.name" placeholder="请输入套餐名称" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="套餐类型" prop="type">
              <el-select v-model="form.type" style="width: 100%;">
                <el-option label="标准型" value="standard" />
                <el-option label="豪华型" value="deluxe" />
                <el-option label="尊享型" value="premium" />
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="16">
          <el-col :span="12">
            <el-form-item label="天数" prop="days">
              <el-input-number v-model="form.days" :min="1" :max="90" style="width: 100%;" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="基础价格" prop="basePrice">
              <el-input-number v-model="form.basePrice" :min="0" :step="1000" style="width: 100%;" />
            </el-form-item>
          </el-col>
        </el-row>
        <el-form-item label="描述" prop="description">
          <el-input v-model="form.description" type="textarea" :rows="3" placeholder="请输入套餐描述" />
        </el-form-item>
        <el-form-item label="服务列表" prop="services">
          <el-select
            v-model="form.services"
            multiple
            filterable
            allow-create
            default-first-option
            style="width: 100%;"
            placeholder="选择或输入服务项，按回车确认"
          >
            <el-option v-for="s in serviceOptions" :key="s" :label="s" :value="s" />
          </el-select>
        </el-form-item>
        <el-form-item label="状态" prop="status">
          <el-radio-group v-model="form.status">
            <el-radio value="active">启用</el-radio>
            <el-radio value="inactive">停用</el-radio>
          </el-radio-group>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="submitting" @click="handleSubmit">确定</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Plus, Grid, List, Calendar, CircleCheck } from '@element-plus/icons-vue'
import { packageApi } from '@/api'

const loading = ref(false)
const submitting = ref(false)
const dialogVisible = ref(false)
const isEdit = ref(false)
const editId = ref(null)
const filterType = ref('')
const viewMode = ref('card')
const tableData = ref([])
const formRef = ref(null)

const serviceOptions = [
  '每日6餐月子餐', '每日6餐定制月子餐', '每日6餐私人定制月子餐',
  '基础母婴护理', '专属月嫂一对一24h服务', '双月嫂轮班24h服务',
  '每周医生巡诊', '每日医生巡诊', '专家团队每日巡诊',
  '基础产后康复项目3次', '专业产后康复项目10次', '全套产后康复项目不限次',
  '宝宝游泳洗澡5次', '宝宝游泳洗澡15次', '宝宝SPA不限次',
  '催乳服务2次', '催乳服务5次', '专业催乳不限次',
  '中医调理3次', '中医专家调理',
  '新生儿摄影1套', '新生儿摄影2套',
  '专业孕产瑜伽', '满月宴策划', '亲子早教课程'
]

const form = reactive({
  name: '',
  type: 'standard',
  days: 28,
  basePrice: 0,
  description: '',
  services: [],
  status: 'active'
})

const rules = {
  name: [{ required: true, message: '请输入套餐名称', trigger: 'blur' }],
  type: [{ required: true, message: '请选择套餐类型', trigger: 'change' }],
  days: [{ required: true, message: '请输入天数', trigger: 'blur' }],
  basePrice: [{ required: true, message: '请输入基础价格', trigger: 'blur' }]
}

const filteredList = computed(() => {
  let list = tableData.value
  if (filterType.value) {
    list = list.filter(p => p.type === filterType.value)
  }
  return list
})

const typeTagType = (t) => {
  const map = { standard: 'info', deluxe: 'warning', premium: 'danger' }
  return map[t] || 'info'
}

const typeText = (t) => {
  const map = { standard: '标准型', deluxe: '豪华型', premium: '尊享型' }
  return map[t] || t
}

const fetchList = async () => {
  loading.value = true
  try {
    const res = await packageApi.list()
    tableData.value = res.data?.data || res.data || []
  } finally {
    loading.value = false
  }
}

const resetForm = () => {
  form.name = ''
  form.type = 'standard'
  form.days = 28
  form.basePrice = 0
  form.description = ''
  form.services = []
  form.status = 'active'
  isEdit.value = false
  editId.value = null
}

const handleAdd = () => {
  resetForm()
  dialogVisible.value = true
}

const handleEdit = (row) => {
  isEdit.value = true
  editId.value = row.id
  form.name = row.name || ''
  form.type = row.type || 'standard'
  form.days = row.days || 28
  form.basePrice = row.basePrice || 0
  form.description = row.description || ''
  form.services = [...(row.services || [])]
  form.status = row.status || 'active'
  dialogVisible.value = true
}

const handleDelete = async (row) => {
  try {
    await ElMessageBox.confirm(`确定删除套餐「${row.name}」吗？`, '提示', { type: 'warning' })
    await packageApi.remove(row.id)
    ElMessage.success('删除成功')
    fetchList()
  } catch {}
}

const handleSubmit = async () => {
  try {
    await formRef.value.validate()
  } catch { return }
  submitting.value = true
  try {
    if (isEdit.value) {
      await packageApi.update(editId.value, { ...form })
      ElMessage.success('修改成功')
    } else {
      await packageApi.create({ ...form })
      ElMessage.success('新增成功')
    }
    dialogVisible.value = false
    fetchList()
  } finally {
    submitting.value = false
  }
}

onMounted(fetchList)
</script>

<style lang="scss" scoped>
.packages-page {
  padding: 20px;

  .toolbar {
    display: flex;
    justify-content: space-between;
    align-items: center;
    flex-wrap: wrap;
    gap: 12px;

    .toolbar-left,
    .toolbar-right {
      display: flex;
      align-items: center;
      flex-wrap: wrap;
      gap: 12px;
    }
  }

  .price-text {
    color: #f56c6c;
    font-weight: 600;
  }

  .package-cards {
    .package-card {
      margin-bottom: 20px;
      transition: all 0.3s;
      border-radius: 12px;
      overflow: hidden;

      &.type-standard {
        border-top: 5px solid #909399;
      }
      &.type-deluxe {
        border-top: 5px solid #e6a23c;
      }
      &.type-premium {
        border-top: 5px solid #f56c6c;
      }

      :deep(.el-card__header) {
        padding: 16px 20px;
        background: linear-gradient(135deg, #fafafa 0%, #f0f0f0 100%);
        border-bottom: none;
      }
      :deep(.el-card__body) {
        padding: 20px;
      }

      .card-header {
        display: flex;
        justify-content: space-between;
        align-items: center;

        .pkg-name {
          font-size: 18px;
          font-weight: 700;
          color: #303133;
        }
      }

      .card-body {
        .pkg-desc {
          font-size: 13px;
          color: #909399;
          line-height: 1.6;
          min-height: 42px;
          margin-bottom: 12px;
        }
        .pkg-meta {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 14px;

          .pkg-days {
            display: flex;
            align-items: center;
            gap: 4px;
            font-size: 14px;
            color: #606266;
            font-weight: 500;
          }
        }
        .pkg-price {
          display: flex;
          align-items: baseline;
          margin-bottom: 6px;
          padding: 12px 0;
          border-top: 1px dashed #ebeef5;
          border-bottom: 1px dashed #ebeef5;

          .price-unit {
            font-size: 16px;
            color: #f56c6c;
            font-weight: 600;
          }
          .price-value {
            font-size: 32px;
            font-weight: 700;
            color: #f56c6c;
            margin: 0 2px;
            line-height: 1;
          }
          .price-tip {
            font-size: 13px;
            color: #909399;
          }
        }
        .pkg-services {
          list-style: none;
          padding: 0;
          margin: 0;

          li {
            display: flex;
            align-items: flex-start;
            gap: 8px;
            font-size: 13px;
            color: #606266;
            padding: 4px 0;
            line-height: 1.5;

            .el-icon {
              margin-top: 2px;
              flex-shrink: 0;
            }
          }
          .more-services {
            color: #909399;
            font-style: italic;
          }
        }
      }

      .card-footer {
        display: flex;
        justify-content: flex-end;
        gap: 4px;
        padding-top: 4px;
        border-top: 1px solid #f0f0f0;
      }
    }
  }
}
</style>
