<template>
  <div class="users-page">
    <el-card shadow="never">
      <div class="toolbar">
        <div class="toolbar-left">
          <el-select v-model="filterRole" placeholder="按角色筛选" clearable style="width: 200px; margin-right: 12px;" @change="fetchList">
            <el-option v-for="(label, value) in roleNameMap" :key="value" :label="label" :value="value" />
          </el-select>
          <el-input v-model="searchKey" placeholder="搜索用户名/姓名" clearable style="width: 240px;" @clear="fetchList" @keyup.enter="fetchList">
            <template #prefix>
              <el-icon><Search /></el-icon>
            </template>
          </el-input>
        </div>
        <div class="toolbar-right">
          <el-button type="primary" :icon="Plus" @click="handleAdd">新增用户</el-button>
        </div>
      </div>

      <el-table :data="tableData" stripe style="width: 100%; margin-top: 16px;" v-loading="loading">
        <el-table-column prop="username" label="用户名" width="140" />
        <el-table-column prop="name" label="姓名" width="140" />
        <el-table-column label="角色" width="140">
          <template #default="{ row }">
            <el-tag :type="roleTagType(row.role)">{{ roleNameMap[row.role] || row.role }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="phone" label="手机" width="140" />
        <el-table-column label="注册时间" width="180">
          <template #default="{ row }">
            {{ formatDate(row.createdAt) }}
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

    <el-dialog v-model="dialogVisible" :title="isEdit ? '编辑用户' : '新增用户'" width="500px" destroy-on-close>
      <el-form ref="formRef" :model="form" :rules="rules" label-width="100px">
        <el-form-item label="用户名" prop="username">
          <el-input v-model="form.username" placeholder="请输入用户名" :disabled="isEdit" />
        </el-form-item>
        <el-form-item label="姓名" prop="name">
          <el-input v-model="form.name" placeholder="请输入姓名" />
        </el-form-item>
        <el-form-item label="密码" prop="password">
          <el-input v-model="form.password" type="password" show-password :placeholder="isEdit ? '不修改请留空' : '请输入密码'" />
        </el-form-item>
        <el-form-item label="角色" prop="role">
          <el-select v-model="form.role" placeholder="请选择角色" style="width: 100%;">
            <el-option v-for="(label, value) in roleNameMap" :key="value" :label="label" :value="value" />
          </el-select>
        </el-form-item>
        <el-form-item label="手机" prop="phone">
          <el-input v-model="form.phone" placeholder="请输入手机号" />
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
import { Plus, Search } from '@element-plus/icons-vue'
import { userApi, roleNameMap } from '@/api'
import dayjs from 'dayjs'

const loading = ref(false)
const submitting = ref(false)
const dialogVisible = ref(false)
const isEdit = ref(false)
const editId = ref(null)
const filterRole = ref('')
const searchKey = ref('')
const tableData = ref([])
const formRef = ref(null)

const form = reactive({
  username: '',
  name: '',
  password: '',
  role: '',
  phone: ''
})

const rules = {
  username: [{ required: true, message: '请输入用户名', trigger: 'blur' }],
  name: [{ required: true, message: '请输入姓名', trigger: 'blur' }],
  password: [
    { validator: (r, v, cb) => { if (!isEdit.value && !v) cb(new Error('请输入密码')); else cb() }, trigger: 'blur' }
  ],
  role: [{ required: true, message: '请选择角色', trigger: 'change' }],
  phone: [
    { required: true, message: '请输入手机号', trigger: 'blur' },
    { pattern: /^1[3-9]\d{9}$/, message: '手机号格式不正确', trigger: 'blur' }
  ]
}

const roleTagType = (role) => {
  const map = {
    admin: 'danger',
    sales: 'warning',
    head_nurse: 'primary',
    nurse: 'success',
    nutritionist: 'info',
    reception: '',
    family: 'success'
  }
  return map[role] || 'info'
}

const fetchList = async () => {
  loading.value = true
  try {
    const params = {}
    if (filterRole.value) params.role = filterRole.value
    if (searchKey.value) params.keyword = searchKey.value
    const res = await userApi.list(params)
    let list = res.data?.data || res.data || []
    if (searchKey.value) {
      const kw = searchKey.value.toLowerCase()
      list = list.filter(u =>
        u.username?.toLowerCase().includes(kw) ||
        u.name?.toLowerCase().includes(kw)
      )
    }
    tableData.value = list
  } finally {
    loading.value = false
  }
}

const resetForm = () => {
  form.username = ''
  form.name = ''
  form.password = ''
  form.role = ''
  form.phone = ''
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
  form.username = row.username || ''
  form.name = row.name || ''
  form.password = ''
  form.role = row.role || ''
  form.phone = row.phone || ''
  dialogVisible.value = true
}

const handleDelete = async (row) => {
  try {
    await ElMessageBox.confirm(`确定删除用户「${row.name}」吗？`, '提示', { type: 'warning' })
    await userApi.remove(row.id)
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
    const payload = { ...form }
    if (isEdit.value && !payload.password) delete payload.password
    if (isEdit.value) {
      await userApi.update(editId.value, payload)
      ElMessage.success('修改成功')
    } else {
      await userApi.create(payload)
      ElMessage.success('新增成功')
    }
    dialogVisible.value = false
    fetchList()
  } finally {
    submitting.value = false
  }
}

const formatDate = (d) => {
  if (!d) return '-'
  return dayjs(d).format('YYYY-MM-DD HH:mm')
}

onMounted(fetchList)
</script>

<style lang="scss" scoped>
.users-page {
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
}
</style>
