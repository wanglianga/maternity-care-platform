<template>
  <div class="login-container">
    <div class="login-box">
      <h2 class="login-title">🌸 月子中心护理平台</h2>
      <p class="login-subtitle">专业护理，贴心守护</p>
      
      <el-form ref="loginFormRef" :model="loginForm" :rules="rules" @keyup.enter="handleLogin">
        <el-form-item prop="username">
          <el-input
            v-model="loginForm.username"
            placeholder="请输入用户名"
            prefix-icon="User"
            size="large"
          />
        </el-form-item>
        <el-form-item prop="password">
          <el-input
            v-model="loginForm.password"
            type="password"
            placeholder="请输入密码"
            prefix-icon="Lock"
            size="large"
            show-password
          />
        </el-form-item>
        <el-form-item>
          <el-button
            type="primary"
            size="large"
            style="width: 100%"
            :loading="loading"
            @click="handleLogin"
          >
            登 录
          </el-button>
        </el-form-item>
      </el-form>
      
      <el-divider>快速登录</el-divider>
      
      <div class="quick-login">
        <el-row :gutter="8">
          <el-col :span="12" style="margin-bottom: 8px;">
            <el-button size="small" @click="quickLogin('admin', '123456')">管理员</el-button>
          </el-col>
          <el-col :span="12" style="margin-bottom: 8px;">
            <el-button size="small" @click="quickLogin('sales01', '123456')">销售</el-button>
          </el-col>
          <el-col :span="12" style="margin-bottom: 8px;">
            <el-button size="small" @click="quickLogin('headnurse', '123456')">护士长</el-button>
          </el-col>
          <el-col :span="12" style="margin-bottom: 8px;">
            <el-button size="small" @click="quickLogin('nurse01', '123456')">月嫂</el-button>
          </el-col>
          <el-col :span="12" style="margin-bottom: 8px;">
            <el-button size="small" @click="quickLogin('nutrition', '123456')">营养师</el-button>
          </el-col>
          <el-col :span="12" style="margin-bottom: 8px;">
            <el-button size="small" @click="quickLogin('reception', '123456')">前台</el-button>
          </el-col>
          <el-col :span="24">
            <el-button type="success" size="small" style="width:100%" @click="quickLogin('family01', '123456')">家属体验</el-button>
          </el-col>
        </el-row>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { useAuthStore } from '@/store/auth'

const router = useRouter()
const authStore = useAuthStore()
const loginFormRef = ref(null)
const loginForm = reactive({ username: '', password: '' })
const loading = ref(false)

const rules = {
  username: [{ required: true, message: '请输入用户名', trigger: 'blur' }],
  password: [{ required: true, message: '请输入密码', trigger: 'blur' }]
}

const handleLogin = async () => {
  try {
    await loginFormRef.value.validate()
  } catch { return }
  
  loading.value = true
  try {
    await authStore.login(loginForm.username, loginForm.password)
    ElMessage.success('登录成功')
    router.push('/dashboard')
  } catch (e) {
    console.error(e)
  } finally {
    loading.value = false
  }
}

const quickLogin = async (username, password) => {
  loginForm.username = username
  loginForm.password = password
  await handleLogin()
}
</script>
