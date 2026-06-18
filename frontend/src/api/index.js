import request from '@/utils/request'

export const authApi = {
  login: (data) => request.post('/auth/login', data),
  me: () => request.get('/auth/me')
}

export const userApi = {
  list: (params) => request.get('/users', { params }),
  get: (id) => request.get(`/users/${id}`),
  create: (data) => request.post('/users', data),
  update: (id, data) => request.put(`/users/${id}`, data),
  remove: (id) => request.delete(`/users/${id}`)
}

export const motherApi = {
  list: (params) => request.get('/mothers', { params }),
  get: (id) => request.get(`/mothers/${id}`),
  create: (data) => request.post('/mothers', data),
  update: (id, data) => request.put(`/mothers/${id}`, data),
  remove: (id) => request.delete(`/mothers/${id}`)
}

export const babyApi = {
  list: (params) => request.get('/babies', { params }),
  get: (id) => request.get(`/babies/${id}`),
  create: (data) => request.post('/babies', data),
  update: (id, data) => request.put(`/babies/${id}`, data),
  remove: (id) => request.delete(`/babies/${id}`)
}

export const roomApi = {
  list: (params) => request.get('/rooms', { params }),
  get: (id) => request.get(`/rooms/${id}`),
  create: (data) => request.post('/rooms', data),
  update: (id, data) => request.put(`/rooms/${id}`, data),
  remove: (id) => request.delete(`/rooms/${id}`)
}

export const packageApi = {
  list: (params) => request.get('/packages', { params }),
  get: (id) => request.get(`/packages/${id}`),
  create: (data) => request.post('/packages', data),
  update: (id, data) => request.put(`/packages/${id}`, data),
  remove: (id) => request.delete(`/packages/${id}`)
}

export const scheduleApi = {
  list: (params) => request.get('/schedules', { params }),
  get: (id) => request.get(`/schedules/${id}`),
  create: (data) => request.post('/schedules', data),
  update: (id, data) => request.put(`/schedules/${id}`, data),
  remove: (id) => request.delete(`/schedules/${id}`)
}

export const visitorApi = {
  list: (params) => request.get('/visitors', { params }),
  get: (id) => request.get(`/visitors/${id}`),
  create: (data) => request.post('/visitors', data),
  update: (id, data) => request.put(`/visitors/${id}`, data),
  checkIn: (id, data) => request.post(`/visitors/${id}/checkin`, data),
  checkOut: (id, data) => request.post(`/visitors/${id}/checkout`, data),
  checkConflicts: (data) => request.post('/visitors/check-conflicts', data),
  approveSpecial: (id, data) => request.post(`/visitors/${id}/approve-special`, data),
  getAuthList: (params) => request.get('/visitors/auth-list', { params }),
  addAuth: (data) => request.post('/visitors/auth-list', data),
  updateAuth: (id, data) => request.put(`/visitors/auth-list/${id}`, data),
  removeAuth: (id) => request.delete(`/visitors/auth-list/${id}`),
  remove: (id) => request.delete(`/visitors/${id}`)
}

export const mealApi = {
  list: (params) => request.get('/meals', { params }),
  get: (id) => request.get(`/meals/${id}`),
  create: (data) => request.post('/meals', data),
  update: (id, data) => request.put(`/meals/${id}`, data),
  remove: (id) => request.delete(`/meals/${id}`)
}

export const disinfectionApi = {
  list: (params) => request.get('/disinfection', { params }),
  get: (id) => request.get(`/disinfection/${id}`),
  create: (data) => request.post('/disinfection', data),
  update: (id, data) => request.put(`/disinfection/${id}`, data),
  remove: (id) => request.delete(`/disinfection/${id}`)
}

export const feeApi = {
  list: (params) => request.get('/fees', { params }),
  get: (id) => request.get(`/fees/${id}`),
  create: (data) => request.post('/fees', data),
  update: (id, data) => request.put(`/fees/${id}`, data),
  pay: (id, data) => request.post(`/fees/${id}/pay`, data),
  remove: (id) => request.delete(`/fees/${id}`)
}

export const handoverApi = {
  list: (params) => request.get('/handovers', { params }),
  get: (id) => request.get(`/handovers/${id}`),
  create: (data) => request.post('/handovers', data),
  update: (id, data) => request.put(`/handovers/${id}`, data),
  confirm: (id) => request.post(`/handovers/${id}/confirm`),
  remove: (id) => request.delete(`/handovers/${id}`)
}

export const contractApi = {
  list: (params) => request.get('/contracts', { params }),
  get: (id) => request.get(`/contracts/${id}`),
  create: (data) => request.post('/contracts', data),
  update: (id, data) => request.put(`/contracts/${id}`, data),
  remove: (id) => request.delete(`/contracts/${id}`)
}

export const taskApi = {
  list: (params) => request.get('/tasks', { params }),
  get: (id) => request.get(`/tasks/${id}`),
  create: (data) => request.post('/tasks', data),
  update: (id, data) => request.put(`/tasks/${id}`, data),
  complete: (id, data) => request.post(`/tasks/${id}/complete`, data),
  remove: (id) => request.delete(`/tasks/${id}`)
}

export const observationApi = {
  list: (params) => request.get('/observations', { params }),
  get: (id) => request.get(`/observations/${id}`),
  create: (data) => request.post('/observations', data),
  update: (id, data) => request.put(`/observations/${id}`, data),
  remove: (id) => request.delete(`/observations/${id}`)
}

export const babyAbnormalApi = {
  list: (params) => request.get('/baby-abnormal', { params }),
  get: (id) => request.get(`/baby-abnormal/${id}`),
  create: (data) => request.post('/baby-abnormal', data),
  update: (id, data) => request.put(`/baby-abnormal/${id}`, data),
  handle: (id, data) => request.post(`/baby-abnormal/${id}/handle`, data),
  recheck: (id, data) => request.post(`/baby-abnormal/${id}/recheck`, data),
  resolve: (id, data) => request.post(`/baby-abnormal/${id}/resolve`, data),
  remove: (id) => request.delete(`/baby-abnormal/${id}`)
}

export const familyApi = {
  dashboard: () => request.get('/family/dashboard'),
  motherSummary: (id) => request.get(`/family/mothers/${id}/summary`)
}

export const roleNameMap = {
  admin: '系统管理员',
  sales: '销售',
  head_nurse: '护士长',
  nurse: '月嫂',
  nutritionist: '营养师',
  reception: '前台',
  family: '家属'
}

export const taskTypeMap = {
  feeding: '喂奶',
  jaundice: '黄疸检测',
  bath: '洗澡',
  postnatal_care: '产康项目',
  baby_observation: '宝宝观察',
  room_check: '房间巡检',
  doctor_visit: '医生巡诊',
  lactation: '催乳服务'
}

export const observationTypeMap = {
  sleep: '睡眠',
  weight: '体重',
  excretion: '排便',
  feeding: '喂奶',
  jaundice: '黄疸',
  temperature: '体温',
  mother_vital: '产妇体征'
}
