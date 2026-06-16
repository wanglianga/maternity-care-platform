import axios from 'axios'
import { ElMessage } from 'element-plus'
import { useAuthStore } from '@/store/auth'

const request = axios.create({
  baseURL: '/api',
  timeout: 15000
})

request.interceptors.request.use(
  (config) => {
    const authStore = useAuthStore()
    if (authStore.token) {
      config.headers.Authorization = `Bearer ${authStore.token}`
    }
    return config
  },
  (error) => Promise.reject(error)
)

request.interceptors.response.use(
  (response) => response.data,
  (error) => {
    if (error.response?.status === 401) {
      const authStore = useAuthStore()
      authStore.logout()
      ElMessage.error('登录已过期，请重新登录')
      window.location.hash = '#/login'
    } else if (error.response?.status === 403) {
      ElMessage.error(error.response.data?.error || '权限不足')
    } else if (error.response?.status === 404) {
      ElMessage.error(error.response.data?.error || '资源不存在')
    } else {
      ElMessage.error(error.response?.data?.error || error.message || '请求失败')
    }
    return Promise.reject(error)
  }
)

export default request
