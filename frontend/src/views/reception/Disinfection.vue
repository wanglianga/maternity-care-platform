<template>
  <div class="disinfection">
    <el-card shadow="never">
      <template #header>
        <div class="card-header">
          <span class="header-title">消毒记录</span>
          <el-button type="primary" @click="openAddDialog">
            <el-icon><Plus /></el-icon>
            新增消毒
          </el-button>
        </div>
      </template>

      <el-table
        :data="disinfections"
        stripe
        style="width: 100%"
        v-loading="loading"
        empty-text="暂无消毒记录"
      >
        <el-table-column label="区域/房间" min-width="160">
          <template #default="{ row }">
            <span v-if="row.roomId">
              <el-tag type="primary" effect="light" size="small">{{ getRoomNo(row.roomId) }}</el-tag>
            </span>
            <span v-else-if="row.area">{{ row.area }}</span>
            <span v-else class="empty-text">-</span>
          </template>
        </el-table-column>
        <el-table-column label="消毒类型" width="120">
          <template #default="{ row }">
            <el-tag :type="typeTagType(row.type)" effect="light">{{ typeText(row.type) }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="消毒时间" width="170">
          <template #default="{ row }">{{ formatDateTime(row.disinfectionTime) }}</template>
        </el-table-column>
        <el-table-column label="执行人" width="110">
          <template #default="{ row }">{{ getUserName(row.operatorId) }}</template>
        </el-table-column>
        <el-table-column label="消毒产品" min-width="160" show-overflow-tooltip>
          <template #default="{ row }">
            <div v-if="row.products" class="products-list">
              <el-tag v-for="(p, i) in parseProducts(row.products)" :key="i" size="small" class="product-tag" effect="plain">
                {{ p }}
              </el-tag>
            </div>
            <span v-else class="empty-text">-</span>
          </template>
        </el-table-column>
        <el-table-column label="时长(分钟)" width="100" prop="duration">
          <template #default="{ row }">
            <span v-if="row.duration">{{ row.duration }}分钟</span>
            <span v-else>-</span>
          </template>
        </el-table-column>
        <el-table-column label="备注" min-width="140" show-overflow-tooltip prop="notes">
          <template #default="{ row }">
            <span v-if="row.notes">{{ row.notes }}</span>
            <span v-else class="empty-text">-</span>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="150" fixed="right">
          <template #default="{ row }">
            <el-button type="primary" size="small" link @click="handleEdit(row)">编辑</el-button>
            <el-popconfirm title="确定删除该消毒记录吗？" @confirm="handleDelete(row)">
              <template #reference>
                <el-button type="danger" size="small" link>删除</el-button>
              </template>
            </el-popconfirm>
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <el-dialog v-model="dialogVisible" :title="isEdit ? '编辑消毒记录' : '新增消毒记录'" width="580px" @close="resetForm">
      <el-form ref="formRef" :model="form" :rules="formRules" label-width="110px">
        <el-form-item label="选择方式" prop="areaType">
          <el-radio-group v-model="areaType" @change="handleAreaTypeChange">
            <el-radio value="area">公共区域</el-radio>
            <el-radio value="room">指定房间</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item v-if="areaType === 'room'" label="选择房间" prop="roomId">
          <el-select v-model="form.roomId" placeholder="请选择房间" style="width: 100%" filterable clearable>
            <el-option v-for="r in rooms" :key="r.id" :label="r.roomNo + ' - ' + r.type" :value="r.id" />
          </el-select>
        </el-form-item>
        <el-form-item v-if="areaType === 'area'" label="区域" prop="area">
          <el-select v-model="form.area" placeholder="请选择或输入区域" style="width: 100%" filterable allow-create clearable>
            <el-option label="公共区域" value="公共区域" />
            <el-option label="电梯" value="电梯" />
            <el-option label="餐厅" value="餐厅" />
            <el-option label="走廊" value="走廊" />
            <el-option label="前台大厅" value="前台大厅" />
            <el-option label="婴儿护理区" value="婴儿护理区" />
            <el-option label="厨房" value="厨房" />
            <el-option label="洗衣房" value="洗衣房" />
          </el-select>
        </el-form-item>
        <el-form-item label="消毒类型" prop="type">
          <el-select v-model="form.type" placeholder="请选择消毒类型" style="width: 100%">
            <el-option label="紫外线消毒" value="ultraviolet" />
            <el-option label="消毒液擦拭" value="disinfectant" />
            <el-option label="高温喷雾" value="steam" />
            <el-option label="其他方式" value="other" />
          </el-select>
        </el-form-item>
        <el-form-item label="消毒时间" prop="disinfectionTime">
          <el-date-picker
            v-model="form.disinfectionTime"
            type="datetime"
            placeholder="选择消毒时间"
            style="width: 100%"
            value-format="YYYY-MM-DDTHH:mm:ss"
          />
        </el-form-item>
        <el-form-item label="执行人" prop="operatorId">
          <el-select v-model="form.operatorId" placeholder="请选择执行人" style="width: 100%" filterable>
            <el-option v-for="u in users" :key="u.id" :label="u.name + ' - ' + roleNameMap[u.role]" :value="u.id" />
          </el-select>
        </el-form-item>
        <el-form-item label="消毒时长" prop="duration">
          <el-input-number v-model="form.duration" :min="0" :max="480" style="width: 100%" placeholder="请输入消毒时长（分钟）" />
        </el-form-item>
        <el-form-item label="使用产品" prop="products">
          <div class="products-input-wrapper">
            <div v-for="(p, idx) in productsArr" :key="idx" class="product-row">
              <el-input v-model="productsArr[idx]" placeholder="产品名称" style="flex: 1" />
              <el-button type="danger" text @click="removeProduct(idx)">
                <el-icon><Delete /></el-icon>
              </el-button>
            </div>
            <el-button type="primary" plain @click="addProduct" style="margin-top: 8px;">
              <el-icon><Plus /></el-icon>
              添加产品
            </el-button>
          </div>
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
import { ref, reactive, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { Plus, Delete } from '@element-plus/icons-vue'
import { disinfectionApi, roomApi, userApi, roleNameMap } from '@/api'
import { useAuthStore } from '@/store/auth'
import dayjs from 'dayjs'

const authStore = useAuthStore()

const loading = ref(false)
const disinfections = ref([])
const rooms = ref([])
const users = ref([])
const dialogVisible = ref(false)
const isEdit = ref(false)
const editId = ref(null)
const formRef = ref(null)
const areaType = ref('area')
const productsArr = ref([])

const defaultForm = {
  roomId: '',
  area: '公共区域',
  type: 'ultraviolet',
  disinfectionTime: new Date().toISOString(),
  operatorId: authStore.userId,
  duration: 30,
  products: '',
  notes: ''
}

const form = reactive({ ...defaultForm })

const formRules = {
  type: [{ required: true, message: '请选择消毒类型', trigger: 'change' }],
  disinfectionTime: [{ required: true, message: '请选择消毒时间', trigger: 'change' }],
  operatorId: [{ required: true, message: '请选择执行人', trigger: 'change' }]
}

const fetchData = async () => {
  loading.value = true
  try {
    const [disRes, roomsRes, usersRes] = await Promise.all([
      disinfectionApi.list(),
      roomApi.list(),
      userApi.list()
    ])
    disinfections.value = disRes.data?.data || disRes.data || []
    rooms.value = roomsRes.data?.data || roomsRes.data || []
    users.value = usersRes.data?.data || usersRes.data || []
  } finally {
    loading.value = false
  }
}

const typeText = (t) => {
  const map = { ultraviolet: '紫外线', disinfectant: '消毒液', steam: '高温喷雾', other: '其他' }
  return map[t] || t
}

const typeTagType = (t) => {
  const map = {
    ultraviolet: 'danger', disinfectant: 'primary', steam: 'warning', other: 'info' }
  return map[t] || 'info'
}

const getRoomNo = (id) => {
  if (!id) return ''
  const r = rooms.value.find(x => x.id === id)
  return r?.roomNo || ''
}

const getUserName = (id) => {
  if (!id) return '-'
  const u = users.value.find(x => x.id === id)
  return u?.name || '-'
}

const formatDateTime = (d) => {
  if (!d) return '-'
  return dayjs(d).format('YYYY-MM-DD HH:mm')
}

const parseProducts = (products) => {
  if (!products) return []
  try {
    if (typeof products === 'string') {
      return JSON.parse(products)
    }
    return Array.isArray(products) ? products : []
  } catch {
    return products.split(',').filter(Boolean)
  }
}

const handleAreaTypeChange = () => {
  if (areaType.value === 'room') {
    form.area = ''
  } else {
    form.roomId = ''
  }
}

const openAddDialog = () => {
  isEdit.value = false
  editId.value = null
  areaType.value = 'area'
  resetForm()
  dialogVisible.value = true
}

const handleEdit = (row) => {
  isEdit.value = true
  editId.value = row.id
  if (row.roomId) {
    areaType.value = 'room'
  } else {
    areaType.value = 'area'
  }
  Object.assign(form, {
    roomId: row.roomId || '',
    area: row.area || '',
    type: row.type || 'ultraviolet',
    disinfectionTime: row.disinfectionTime || new Date().toISOString(),
    operatorId: row.operatorId || authStore.userId,
    duration: row.duration || 30,
    products: row.products || '',
    notes: row.notes || ''
  })
  productsArr.value = [...parseProducts(row.products)]
  dialogVisible.value = true
}

const resetForm = () => {
  Object.assign(form, {
    ...defaultForm,
    disinfectionTime: new Date().toISOString(),
    operatorId: authStore.userId
  })
  productsArr.value = []
  if (formRef.value) formRef.value.clearValidate()
}

const addProduct = () => {
  productsArr.value.push('')
}

const removeProduct = (idx) => {
  productsArr.value.splice(idx, 1)
}

const submitForm = async () => {
  try {
    await formRef.value.validate()
  } catch { return }

  if (areaType.value === 'room' && !form.roomId) {
    ElMessage.warning('请选择房间')
    return
  }
  if (areaType.value === 'area' && !form.area) {
    ElMessage.warning('请填写区域')
    return
  }

  const productsStr = JSON.stringify(productsArr.value.filter(Boolean))

  try {
    const payload = {
      ...form,
      products: productsStr
    }
    if (isEdit.value) {
      await disinfectionApi.update(editId.value, payload)
      ElMessage.success('消毒记录更新成功')
    } else {
      await disinfectionApi.create(payload)
      ElMessage.success('消毒记录创建成功')
    }
    dialogVisible.value = false
    await fetchData()
  } catch (e) {
    console.error(e)
  }
}

const handleDelete = async (row) => {
  try {
    await disinfectionApi.remove(row.id)
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

<script>
export default {
  name: 'Disinfection'
}
</script>

<style lang="scss" scoped>
.disinfection {
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

  .products-list {
    display: flex;
    flex-wrap: wrap;
    gap: 4px;

    .product-tag {
      margin: 0;
    }
  }

  .empty-text {
    color: #c0c4cc;
  }

  .products-input-wrapper {
    width: 100%;

    .product-row {
      display: flex;
      align-items: center;
      gap: 8px;
      margin-bottom: 8px;
    }
  }
}
</style>
