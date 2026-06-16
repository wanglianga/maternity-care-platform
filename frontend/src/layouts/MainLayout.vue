<template>
  <div class="layout-container">
    <div class="sidebar">
      <div class="logo">
        <el-icon size="24" color="#fff"><HouseLaptop /></el-icon>
        <span class="logo-text">月子中心平台</span>
      </div>
      <el-menu
        :default-active="activeMenu"
        background-color="#001529"
        text-color="#b0c4de"
        active-text-color="#ffffff"
        router
        class="sidebar-menu"
      >
        <template v-for="route in menuRoutes" :key="route.path">
          <el-menu-item :index="route.path">
            <el-icon>
              <component :is="route.meta.icon" />
            </el-icon>
            <span>{{ route.meta.title }}</span>
          </el-menu-item>
        </template>
      </el-menu>
    </div>
    
    <div class="main-content">
      <div class="header">
        <el-breadcrumb separator="/">
          <el-breadcrumb-item>{{ currentRoleName }}</el-breadcrumb-item>
          <el-breadcrumb-item>{{ currentMenuTitle }}</el-breadcrumb-item>
        </el-breadcrumb>
        
        <div class="header-user">
          <el-tag type="success" effect="light">{{ currentRoleName }}</el-tag>
          <el-dropdown @command="handleCommand">
            <span class="el-dropdown-link" style="cursor: pointer; display: flex; align-items: center; gap: 6px;">
              <el-avatar :size="32" style="background: #409eff;">
                {{ authStore.userName?.charAt(0) }}
              </el-avatar>
              <span>{{ authStore.userName }}</span>
              <el-icon><ArrowDown /></el-icon>
            </span>
            <template #dropdown>
              <el-dropdown-menu>
                <el-dropdown-item command="profile">个人中心</el-dropdown-item>
                <el-dropdown-item divided command="logout" style="color: #f56c6c;">
                  <el-icon><SwitchButton /></el-icon>退出登录
                </el-dropdown-item>
              </el-dropdown-menu>
            </template>
          </el-dropdown>
        </div>
      </div>
      
      <div class="content">
        <router-view v-slot="{ Component }">
          <transition name="fade" mode="out-in">
            <component :is="Component" />
          </transition>
        </router-view>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessageBox } from 'element-plus'
import { useAuthStore } from '@/store/auth'
import { getRoleRoutes, ROLE_NAME_MAP } from '@/router'

const route = useRoute()
const router = useRouter()
const authStore = useAuthStore()

const menuRoutes = computed(() => getRoleRoutes(authStore.role))
const activeMenu = computed(() => route.path)
const currentRoleName = computed(() => ROLE_NAME_MAP[authStore.role] || authStore.role)
const currentMenuTitle = computed(() => {
  const found = menuRoutes.value.find(r => r.path === route.path)
  return found?.meta?.title || ''
})

const handleCommand = (cmd) => {
  if (cmd === 'logout') {
    ElMessageBox.confirm('确定要退出登录吗？', '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    }).then(() => {
      authStore.logout()
      router.push('/login')
    }).catch(() => {})
  } else if (cmd === 'profile') {
    // TODO: 个人中心
  }
}
</script>

<style scoped>
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s ease;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
:deep(.el-menu) {
  border-right: none;
}
:deep(.el-menu-item) {
  height: 50px;
  line-height: 50px;
}
:deep(.el-menu-item.is-active) {
  background-color: #1890ff !important;
}
</style>
