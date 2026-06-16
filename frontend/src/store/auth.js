import { defineStore } from 'pinia'
import request from '@/utils/request'

export const useAuthStore = defineStore('auth', {
  state: () => ({
    token: localStorage.getItem('maternity_token') || '',
    user: JSON.parse(localStorage.getItem('maternity_user') || 'null')
  }),
  getters: {
    isLoggedIn: (state) => !!state.token,
    role: (state) => state.user?.role || '',
    userName: (state) => state.user?.name || '',
    userId: (state) => state.user?.id || ''
  },
  actions: {
    async login(username, password) {
      const data = await request.post('/auth/login', { username, password })
      this.token = data.token
      this.user = data.user
      localStorage.setItem('maternity_token', data.token)
      localStorage.setItem('maternity_user', JSON.stringify(data.user))
      return data
    },
    logout() {
      this.token = ''
      this.user = null
      localStorage.removeItem('maternity_token')
      localStorage.removeItem('maternity_user')
    },
    async fetchMe() {
      try {
        const data = await request.get('/auth/me')
        this.user = { ...this.user, ...data }
        localStorage.setItem('maternity_user', JSON.stringify(this.user))
      } catch (e) {
        console.error('获取用户信息失败', e)
      }
    }
  }
})
