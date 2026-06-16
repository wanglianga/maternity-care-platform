<template>
  <div class="rooms-page">
    <el-card shadow="never">
      <div class="toolbar">
        <div class="toolbar-left">
          <el-select v-model="filterStatus" placeholder="按状态筛选" clearable style="width: 160px; margin-right: 12px;" @change="fetchList">
            <el-option label="空闲" value="empty" />
            <el-option label="占用" value="occupied" />
            <el-option label="维修" value="maintenance" />
          </el-select>
          <el-input v-model="searchKey" placeholder="搜索房间号/房型" clearable style="width: 220px;" @clear="fetchList" @keyup.enter="fetchList">
            <template #prefix>
              <el-icon><Search /></el-icon>
            </template>
          </el-input>
        </div>
        <div class="toolbar-right">
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
          <el-button type="primary" :icon="Plus" @click="handleAdd">新增房间</el-button>
        </div>
      </div>

      <div v-if="viewMode === 'card'" class="room-cards" style="margin-top: 16px;">
        <el-row :gutter="20">
          <el-col :xs="24" :sm="12" :md="8" :lg="6" v-for="room in filteredList" :key="room.id">
            <el-card class="room-card" shadow="hover" :class="'status-' + room.status">
              <template #header>
                <div class="card-header">
                  <span class="room-no">{{ room.roomNo }}</span>
                  <el-tag :type="statusTagType(room.status)" size="small">{{ statusText(room.status) }}</el-tag>
                </div>
              </template>
              <div class="card-body">
                <div class="room-type">{{ room.type }}</div>
                <div class="room-meta">
                  <span><el-icon><OfficeBuilding /></el-icon> {{ room.floor }}</span>
                  <span><el-icon><HomeFilled /></el-icon> {{ room.capacity }}床</span>
                </div>
                <div class="room-price">
                  <span class="price-label">日价</span>
                  <span class="price-value">¥{{ room.pricePerDay?.toLocaleString() }}</span>
                </div>
                <div class="room-facilities">
                  <el-tag v-for="(f, idx) in (room.facilities || []).slice(0, 4)" :key="idx" size="small" effect="plain" style="margin: 2px;">
                    {{ f }}
                  </el-tag>
                  <el-tag v-if="(room.facilities || []).length > 4" size="small" type="info" effect="plain" style="margin: 2px;">
                    +{{ (room.facilities || []).length - 4 }}
                  </el-tag>
                </div>
              </div>
              <template #footer>
                <div class="card-footer">
                  <el-button size="small" type="primary" link @click="handleEdit(room)">编辑</el-button>
                  <el-button size="small" type="danger" link @click="handleDelete(room)">删除</el-button>
                </div>
              </template>
            </el-card>
          </el-col>
        </el-row>
        <el-empty v-if="filteredList.length === 0" description="暂无房间数据" style="margin-top: 60px;" />
      </div>

      <el-table v-else :data="filteredList" stripe style="width: 100%; margin-top: 16px;" v-loading="loading">
        <el-table-column prop="roomNo" label="房间号" width="120" />
        <el-table-column prop="type" label="房型" width="160" />
        <el-table-column prop="floor" label="楼层" width="100" />
        <el-table-column prop="pricePerDay" label="日价格" width="140">
          <template #default="{ row }">
            <span class="price-text">¥{{ row.pricePerDay?.toLocaleString() }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="capacity" label="床位数" width="100">
          <template #default="{ row }">
            {{ row.capacity }}床
          </template>
        </el-table-column>
        <el-table-column label="状态" width="100">
          <template #default="{ row }">
            <el-tag :type="statusTagType(row.status)">{{ statusText(row.status) }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="设施" min-width="260">
          <template #default="{ row }">
            <el-tag v-for="(f, idx) in (row.facilities || []).slice(0, 5)" :key="idx" size="small" effect="plain" style="margin: 2px;">
              {{ f }}
            </el-tag>
            <el-tag v-if="(row.facilities || []).length > 5" size="small" type="info" effect="plain" style="margin: 2px;">
              +{{ (row.facilities || []).length - 5 }}
            </el-tag>
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

    <el-dialog v-model="dialogVisible" :title="isEdit ? '编辑房间' : '新增房间'" width="600px" destroy-on-close>
      <el-form ref="formRef" :model="form" :rules="rules" label-width="100px">
        <el-row :gutter="16">
          <el-col :span="12">
            <el-form-item label="房间号" prop="roomNo">
              <el-input v-model="form.roomNo" placeholder="例如 A101" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="房型" prop="type">
              <el-input v-model="form.type" placeholder="例如 标准单人间" />
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="16">
          <el-col :span="12">
            <el-form-item label="楼层" prop="floor">
              <el-input v-model="form.floor" placeholder="例如 1楼" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="日价格" prop="pricePerDay">
              <el-input-number v-model="form.pricePerDay" :min="0" :step="100" style="width: 100%;" />
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="16">
          <el-col :span="12">
            <el-form-item label="床位数" prop="capacity">
              <el-input-number v-model="form.capacity" :min="1" :max="10" style="width: 100%;" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="状态" prop="status">
              <el-select v-model="form.status" style="width: 100%;">
                <el-option label="空闲" value="empty" />
                <el-option label="占用" value="occupied" />
                <el-option label="维修" value="maintenance" />
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>
        <el-form-item label="设施" prop="facilities">
          <el-select v-model="form.facilities" multiple filterable allow-create style="width: 100%;" placeholder="选择或输入设施">
            <el-option v-for="f in facilityOptions" :key="f" :label="f" :value="f" />
          </el-select>
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
import { Plus, Search, Grid, List, OfficeBuilding, HomeFilled } from '@element-plus/icons-vue'
import { roomApi } from '@/api'

const loading = ref(false)
const submitting = ref(false)
const dialogVisible = ref(false)
const isEdit = ref(false)
const editId = ref(null)
const filterStatus = ref('')
const searchKey = ref('')
const viewMode = ref('card')
const tableData = ref([])
const formRef = ref(null)

const facilityOptions = [
  '独立卫浴', '空调', '电视', 'WiFi',
  '独立客厅', '婴儿看护区', '家属陪护床',
  '餐厅', '双卫浴', '中央空调', '智能电视',
  '高速WiFi', '家属陪护间', '专属阳台'
]

const form = reactive({
  roomNo: '',
  type: '',
  floor: '',
  pricePerDay: 0,
  capacity: 1,
  facilities: [],
  status: 'empty'
})

const rules = {
  roomNo: [{ required: true, message: '请输入房间号', trigger: 'blur' }],
  type: [{ required: true, message: '请输入房型', trigger: 'blur' }],
  floor: [{ required: true, message: '请输入楼层', trigger: 'blur' }],
  pricePerDay: [{ required: true, message: '请输入日价格', trigger: 'blur' }],
  capacity: [{ required: true, message: '请输入床位数', trigger: 'blur' }],
  status: [{ required: true, message: '请选择状态', trigger: 'change' }]
}

const filteredList = computed(() => {
  let list = tableData.value
  if (filterStatus.value) {
    list = list.filter(r => r.status === filterStatus.value)
  }
  if (searchKey.value) {
    const kw = searchKey.value.toLowerCase()
    list = list.filter(r =>
      r.roomNo?.toLowerCase().includes(kw) ||
      r.type?.toLowerCase().includes(kw)
    )
  }
  return list
})

const statusTagType = (s) => {
  const map = { empty: 'success', occupied: 'warning', maintenance: 'danger' }
  return map[s] || 'info'
}

const statusText = (s) => {
  const map = { empty: '空闲', occupied: '占用', maintenance: '维修' }
  return map[s] || s
}

const fetchList = async () => {
  loading.value = true
  try {
    const res = await roomApi.list()
    tableData.value = res.data?.data || res.data || []
  } finally {
    loading.value = false
  }
}

const resetForm = () => {
  form.roomNo = ''
  form.type = ''
  form.floor = ''
  form.pricePerDay = 0
  form.capacity = 1
  form.facilities = []
  form.status = 'empty'
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
  form.roomNo = row.roomNo || ''
  form.type = row.type || ''
  form.floor = row.floor || ''
  form.pricePerDay = row.pricePerDay || 0
  form.capacity = row.capacity || 1
  form.facilities = [...(row.facilities || [])]
  form.status = row.status || 'empty'
  dialogVisible.value = true
}

const handleDelete = async (row) => {
  try {
    await ElMessageBox.confirm(`确定删除房间「${row.roomNo}」吗？`, '提示', { type: 'warning' })
    await roomApi.remove(row.id)
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
      await roomApi.update(editId.value, { ...form })
      ElMessage.success('修改成功')
    } else {
      await roomApi.create({ ...form })
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
.rooms-page {
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

  .room-cards {
    .room-card {
      margin-bottom: 20px;
      transition: all 0.3s;
      border-radius: 10px;

      &.status-empty {
        border-top: 4px solid #67c23a;
      }
      &.status-occupied {
        border-top: 4px solid #e6a23c;
      }
      &.status-maintenance {
        border-top: 4px solid #f56c6c;
      }

      :deep(.el-card__header) {
        padding: 14px 18px;
        border-bottom: 1px dashed #ebeef5;
      }
      :deep(.el-card__body) {
        padding: 16px 18px;
      }

      .card-header {
        display: flex;
        justify-content: space-between;
        align-items: center;

        .room-no {
          font-size: 18px;
          font-weight: 700;
          color: #303133;
        }
      }

      .card-body {
        .room-type {
          font-size: 14px;
          color: #606266;
          margin-bottom: 10px;
          font-weight: 500;
        }
        .room-meta {
          display: flex;
          gap: 16px;
          font-size: 13px;
          color: #909399;
          margin-bottom: 12px;

          span {
            display: flex;
            align-items: center;
            gap: 4px;
          }
        }
        .room-price {
          display: flex;
          align-items: baseline;
          gap: 8px;
          margin-bottom: 14px;

          .price-label {
            font-size: 12px;
            color: #909399;
          }
          .price-value {
            font-size: 22px;
            font-weight: 700;
            color: #f56c6c;
          }
        }
        .room-facilities {
          min-height: 56px;
        }
      }

      .card-footer {
        display: flex;
        justify-content: flex-end;
        gap: 4px;
        padding-top: 4px;
      }
    }
  }
}
</style>
