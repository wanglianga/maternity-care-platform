<template>
  <div class="meals">
    <el-card shadow="never">
      <template #header>
        <div class="card-header">
          <span class="header-title">月子餐管理</span>
          <el-button type="primary" @click="openAddDialog">
            <el-icon><Plus /></el-icon>
            新增餐食
          </el-button>
        </div>
      </template>

      <div class="filter-bar">
        <el-form :inline="true" :model="filterForm">
          <el-form-item label="日期">
            <el-date-picker
              v-model="filterForm.date"
              type="date"
              placeholder="选择日期"
              value-format="YYYY-MM-DD"
              style="width: 180px"
              clearable
            />
          </el-form-item>
          <el-form-item label="产妇">
            <el-input
              v-model="filterForm.motherName"
              placeholder="搜索产妇姓名"
              clearable
              style="width: 180px"
            />
          </el-form-item>
          <el-form-item>
            <el-button type="primary" @click="fetchData">
              <el-icon><Search /></el-icon>
              搜索
            </el-button>
            <el-button @click="resetFilter">重置</el-button>
          </el-form-item>
        </el-form>
      </div>

      <el-table
        :data="filteredMeals"
        stripe
        style="width: 100%"
        v-loading="loading"
        empty-text="暂无餐食记录"
      >
        <el-table-column label="日期" width="120" sortable>
          <template #default="{ row }">{{ formatDate(row.date) }}</template>
        </el-table-column>
        <el-table-column label="产妇姓名" width="120">
          <template #default="{ row }">{{ getMotherName(row.motherId) }}</template>
        </el-table-column>
        <el-table-column label="餐次" width="100">
          <template #default="{ row }">
            <el-tag :type="mealTypeTagType(row.mealType)" effect="light">{{ mealTypeText(row.mealType) }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="菜品" min-width="240">
          <template #default="{ row }">
            <div class="meal-items">
              <el-tag v-for="(item, idx) in parseItems(row.items)" :key="idx" size="small" class="meal-tag" type="info" effect="plain">
                {{ item }}
              </el-tag>
              <span v-if="!row.items" class="empty-meals">-</span>
            </div>
          </template>
        </el-table-column>
        <el-table-column label="营养信息" min-width="160" show-overflow-tooltip prop="nutritionInfo">
          <template #default="{ row }">
            <span v-if="row.nutritionInfo">{{ row.nutritionInfo }}</span>
            <span v-else class="empty-text">-</span>
          </template>
        </el-table-column>
        <el-table-column label="状态" width="100">
          <template #default="{ row }">
            <el-tag :type="statusTagType(row.status)">{{ statusText(row.status) }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="备注" min-width="120" show-overflow-tooltip prop="notes">
          <template #default="{ row }">
            <span v-if="row.notes">{{ row.notes }}</span>
            <span v-else class="empty-text">-</span>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="180" fixed="right">
          <template #default="{ row }">
            <el-button type="primary" size="small" link @click="handleEdit(row)">编辑</el-button>
            <el-popconfirm title="确定删除该餐食吗？" @confirm="handleDelete(row)">
              <template #reference>
                <el-button type="danger" size="small" link>删除</el-button>
              </template>
            </el-popconfirm>
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <el-dialog v-model="dialogVisible" :title="isEdit ? '编辑餐食' : '新增餐食'" width="640px" @close="resetForm">
      <el-form ref="formRef" :model="form" :rules="formRules" label-width="100px">
        <el-row :gutter="16">
          <el-col :span="12">
            <el-form-item label="日期" prop="date">
              <el-date-picker
                v-model="form.date"
                type="date"
                placeholder="选择日期"
                style="width: 100%"
                value-format="YYYY-MM-DD"
              />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="餐次" prop="mealType">
              <el-select v-model="form.mealType" placeholder="请选择餐次" style="width: 100%">
                <el-option label="早餐" value="breakfast" />
                <el-option label="午餐" value="lunch" />
                <el-option label="晚餐" value="dinner" />
                <el-option label="加餐1" value="snack1" />
                <el-option label="加餐2" value="snack2" />
                <el-option label="夜宵" value="supper" />
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>
        <el-form-item label="产妇" prop="motherId">
          <el-select v-model="form.motherId" placeholder="请选择产妇" filterable style="width: 100%">
            <el-option v-for="m in mothers" :key="m.id" :label="m.name" :value="m.id" />
          </el-select>
        </el-form-item>
        <el-form-item label="菜品" prop="items">
          <div class="items-input-wrapper">
            <div v-for="(item, idx) in formItemsArr" :key="idx" class="item-row">
              <el-input v-model="formItemsArr[idx]" placeholder="菜品名称" style="flex: 1" />
              <el-button type="danger" text @click="removeItem(idx)">
                <el-icon><Delete /></el-icon>
              </el-button>
            </div>
            <el-button type="primary" plain @click="addItem" style="margin-top: 8px;">
              <el-icon><Plus /></el-icon>
              添加菜品
            </el-button>
          </div>
        </el-form-item>
        <el-form-item label="营养信息" prop="nutritionInfo">
          <el-input v-model="form.nutritionInfo" type="textarea" :rows="2" placeholder="例如：热量500kcal，蛋白质25g，钙300mg..." />
        </el-form-item>
        <el-form-item label="状态" prop="status">
          <el-select v-model="form.status" placeholder="请选择状态" style="width: 100%">
            <el-option label="已计划" value="scheduled" />
            <el-option label="制作中" value="preparing" />
            <el-option label="已配送" value="delivered" />
            <el-option label="已食用" value="eaten" />
          </el-select>
        </el-form-item>
        <el-form-item label="备注">
          <el-input v-model="form.notes" type="textarea" :rows="2" placeholder="备注信息，可选" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="submitForm">保存</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { Plus, Search, Delete } from '@element-plus/icons-vue'
import { mealApi, motherApi } from '@/api'
import dayjs from 'dayjs'

const loading = ref(false)
const meals = ref([])
const mothers = ref([])
const dialogVisible = ref(false)
const isEdit = ref(false)
const editId = ref(null)
const formRef = ref(null)

const filterForm = reactive({
  date: '',
  motherName: ''
})

const form = reactive({
  date: dayjs().format('YYYY-MM-DD'),
  motherId: '',
  mealType: 'breakfast',
  items: '',
  nutritionInfo: '',
  notes: '',
  status: 'scheduled'
})

const formItemsArr = ref([])

const formRules = {
  date: [{ required: true, message: '请选择日期', trigger: 'change' }],
  motherId: [{ required: true, message: '请选择产妇', trigger: 'change' }],
  mealType: [{ required: true, message: '请选择餐次', trigger: 'change' }],
  status: [{ required: true, message: '请选择状态', trigger: 'change' }]
}

const filteredMeals = computed(() => {
  let list = [...meals.value]
  if (filterForm.date) {
    list = list.filter(m => m.date === filterForm.date)
  }
  if (filterForm.motherName) {
    const keyword = filterForm.motherName.toLowerCase()
    list = list.filter(m => {
      const name = getMotherName(m.motherId).toLowerCase()
      return name.includes(keyword)
    })
  }
  return list.sort((a, b) => {
    if (a.date !== b.date) return a.date > b.date ? -1 : 1
    const order = { breakfast: 1, snack1: 2, lunch: 3, snack2: 4, dinner: 5, supper: 6 }
    return (order[a.mealType] || 99) - (order[b.mealType] || 99)
  })
})

const fetchData = async () => {
  loading.value = true
  try {
    const [mealsRes, mothersRes] = await Promise.all([
      mealApi.list(),
      motherApi.list()
    ])
    meals.value = mealsRes.data?.data || mealsRes.data || []
    mothers.value = mothersRes.data?.data || mothersRes.data || []
  } finally {
    loading.value = false
  }
}

const resetFilter = () => {
  filterForm.date = ''
  filterForm.motherName = ''
  fetchData()
}

const getMotherName = (id) => {
  if (!id) return '-'
  const m = mothers.value.find(x => x.id === id)
  return m?.name || '-'
}

const formatDate = (d) => {
  if (!d) return '-'
  return dayjs(d).format('YYYY-MM-DD')
}

const mealTypeText = (t) => {
  const map = { breakfast: '早餐', lunch: '午餐', dinner: '晚餐', snack1: '加餐1', snack2: '加餐2', supper: '夜宵' }
  return map[t] || t
}

const mealTypeTagType = (t) => {
  const map = {
    breakfast: 'success',
    snack1: 'warning',
    lunch: 'primary',
    snack2: 'warning',
    dinner: '',
    supper: 'danger'
  }
  return map[t] || 'info'
}

const statusTagType = (s) => {
  const map = { scheduled: 'info', preparing: 'warning', delivered: 'primary', eaten: 'success' }
  return map[s] || 'info'
}

const statusText = (s) => {
  const map = { scheduled: '已计划', preparing: '制作中', delivered: '已配送', eaten: '已食用' }
  return map[s] || s
}

const parseItems = (items) => {
  if (!items) return []
  try {
    if (typeof items === 'string') {
      return JSON.parse(items)
    }
    return Array.isArray(items) ? items : []
  } catch {
    return items.split(',').filter(Boolean)
  }
}

const openAddDialog = () => {
  isEdit.value = false
  editId.value = null
  resetForm()
  dialogVisible.value = true
}

const handleEdit = (row) => {
  isEdit.value = true
  editId.value = row.id
  Object.assign(form, {
    date: row.date,
    motherId: row.motherId,
    mealType: row.mealType,
    items: row.items || '',
    nutritionInfo: row.nutritionInfo || '',
    notes: row.notes || '',
    status: row.status || 'scheduled'
  })
  formItemsArr.value = [...parseItems(row.items)]
  dialogVisible.value = true
}

const resetForm = () => {
  Object.assign(form, {
    date: dayjs().format('YYYY-MM-DD'),
    motherId: '',
    mealType: 'breakfast',
    items: '',
    nutritionInfo: '',
    notes: '',
    status: 'scheduled'
  })
  formItemsArr.value = []
  if (formRef.value) formRef.value.clearValidate()
}

const addItem = () => {
  formItemsArr.value.push('')
}

const removeItem = (idx) => {
  formItemsArr.value.splice(idx, 1)
}

const submitForm = async () => {
  try {
    await formRef.value.validate()
  } catch { return }

  const itemsStr = JSON.stringify(formItemsArr.value.filter(Boolean))

  try {
    const payload = {
      ...form,
      items: itemsStr
    }
    if (isEdit.value) {
      await mealApi.update(editId.value, payload)
      ElMessage.success('餐食更新成功')
    } else {
      await mealApi.create(payload)
      ElMessage.success('餐食创建成功')
    }
    dialogVisible.value = false
    await fetchData()
  } catch (e) {
    console.error(e)
  }
}

const handleDelete = async (row) => {
  try {
    await mealApi.remove(row.id)
    ElMessage.success('删除成功')
    await fetchData()
  } catch (e) {
    console.error(e)
  }
}

onMounted(() => {
  fetchData()
})
</script>

<style lang="scss" scoped>
.meals {
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

  .filter-bar {
    margin-bottom: 16px;
  }

  .meal-items {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;

    .meal-tag {
      margin: 0;
    }

    .empty-meals {
      color: #c0c4cc;
    }
  }

  .empty-text {
    color: #c0c4cc;
  }

  .items-input-wrapper {
    width: 100%;

    .item-row {
      display: flex;
      align-items: center;
      gap: 8px;
      margin-bottom: 8px;
    }
  }
}
</style>
