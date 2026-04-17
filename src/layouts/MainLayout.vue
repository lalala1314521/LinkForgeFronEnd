<template>
  <div class="main-layout" :class="{ 'sidebar-collapsed': appStore.sidebarCollapsed }">
    <!-- Sidebar -->
    <aside class="sidebar">
      <!-- Logo -->
      <div class="sidebar-logo">
        <el-icon size="28" color="#409EFF"><DocumentChecked /></el-icon>
        <transition name="fade">
          <span v-if="!appStore.sidebarCollapsed" class="logo-text">参考管理系统</span>
        </transition>
      </div>

      <!-- Navigation Menu -->
      <el-menu
        :default-active="activeRoute"
        :collapse="appStore.sidebarCollapsed"
        :collapse-transition="false"
        class="sidebar-menu"
        router
      >
        <el-menu-item
          v-for="item in menuItems"
          :key="item.path"
          :index="item.path"
        >
          <el-icon><component :is="item.icon" /></el-icon>
          <template #title>{{ item.title }}</template>
        </el-menu-item>
      </el-menu>

      <!-- Sidebar Footer -->
      <div class="sidebar-footer">
        <el-tooltip
          :content="appStore.sidebarCollapsed ? '展开菜单' : '收起菜单'"
          placement="right"
        >
          <el-button
            link
            class="collapse-btn"
            @click="appStore.toggleSidebar"
          >
            <el-icon size="18">
              <Expand v-if="appStore.sidebarCollapsed" />
              <Fold v-else />
            </el-icon>
          </el-button>
        </el-tooltip>
      </div>
    </aside>

    <!-- Main Content -->
    <div class="main-wrapper">
      <!-- Header -->
      <header class="app-header">
        <div class="header-left">
          <!-- Breadcrumb -->
          <el-breadcrumb separator="/">
            <el-breadcrumb-item :to="{ path: '/' }">首页</el-breadcrumb-item>
            <el-breadcrumb-item v-if="currentRoute.meta?.title">
              {{ currentRoute.meta.title }}
            </el-breadcrumb-item>
          </el-breadcrumb>
        </div>

        <div class="header-right">
          <!-- Theme Toggle -->
          <el-tooltip :content="isDark ? '切换亮色模式' : '切换深色模式'" placement="bottom">
            <el-button circle link size="large" @click="appStore.toggleTheme">
              <el-icon size="20">
                <Sunny v-if="isDark" />
                <Moon v-else />
              </el-icon>
            </el-button>
          </el-tooltip>

          <!-- User Dropdown -->
          <el-dropdown trigger="click" @command="handleCommand">
            <div class="user-avatar-wrap">
              <el-avatar :size="34" :style="{ background: avatarColor }">
                {{ avatarLetter }}
              </el-avatar>
              <span class="user-name">{{ authStore.nickname }}</span>
              <el-icon size="14" class="arrow-icon"><ArrowDown /></el-icon>
            </div>
            <template #dropdown>
              <el-dropdown-menu>
                <el-dropdown-item command="profile" :icon="User">个人中心</el-dropdown-item>
                <el-dropdown-item divided command="logout" :icon="SwitchButton">退出登录</el-dropdown-item>
              </el-dropdown-menu>
            </template>
          </el-dropdown>
        </div>
      </header>

      <!-- Page Content -->
      <main class="page-content">
        <router-view v-slot="{ Component }">
          <transition name="page" mode="out-in">
            <component :is="Component" />
          </transition>
        </router-view>
      </main>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessageBox, ElMessage } from 'element-plus'
import { User, SwitchButton } from '@element-plus/icons-vue'
import { useAuthStore } from '@/stores/auth'
import { useAppStore } from '@/stores/app'

const route = useRoute()
const router = useRouter()
const authStore = useAuthStore()
const appStore = useAppStore()

const isDark = computed(() => appStore.theme === 'dark')
const currentRoute = computed(() => route)
const activeRoute = computed(() => '/' + route.path.split('/')[1])

const menuItems = [
  { path: '/dashboard', title: '控制台', icon: 'Odometer' },
  { path: '/users', title: '用户管理', icon: 'User' },
  { path: '/orders', title: '订单管理', icon: 'ShoppingCart' },
]

// Avatar
const avatarLetter = computed(() => (authStore.nickname || authStore.username || 'U')[0].toUpperCase())
const avatarColors = ['#409EFF', '#67C23A', '#E6A23C', '#F56C6C', '#909399', '#6554C0']
const avatarColor = computed(() => {
  const n = (authStore.username || '').charCodeAt(0) % avatarColors.length
  return avatarColors[n]
})

async function handleCommand(command: string) {
  if (command === 'profile') {
    router.push('/profile')
  } else if (command === 'logout') {
    try {
      await ElMessageBox.confirm('确定要退出登录吗？', '提示', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning',
      })
      authStore.logout()
      ElMessage.success('已安全退出')
      router.push('/login')
    } catch {
      // cancelled
    }
  }
}
</script>

<style scoped>
.main-layout {
  display: flex;
  height: 100vh;
  overflow: hidden;
  background: var(--bg-page);
}

/* Sidebar */
.sidebar {
  width: var(--sidebar-width);
  min-width: var(--sidebar-width);
  background: var(--bg-card);
  border-right: 1px solid var(--border-color);
  display: flex;
  flex-direction: column;
  transition: width 0.25s ease, min-width 0.25s ease;
  overflow: hidden;
  box-shadow: 2px 0 8px rgba(0,0,0,0.04);
  z-index: 100;
}

.main-layout.sidebar-collapsed .sidebar {
  width: 64px;
  min-width: 64px;
}

.sidebar-logo {
  height: var(--header-height);
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 0 18px;
  border-bottom: 1px solid var(--border-color);
  white-space: nowrap;
  overflow: hidden;
}

.logo-text {
  font-size: 15px;
  font-weight: 700;
  color: var(--text-primary);
  letter-spacing: 0.5px;
}

.sidebar-menu {
  flex: 1;
  border: none !important;
  background: transparent !important;
  overflow-y: auto;
  overflow-x: hidden;
  padding: 8px 0;
}

.sidebar-menu :deep(.el-menu-item) {
  margin: 2px 8px;
  border-radius: var(--radius-sm);
  height: 44px;
}

.sidebar-menu :deep(.el-menu-item.is-active) {
  background: var(--primary-light) !important;
  color: var(--primary) !important;
}

.sidebar-footer {
  padding: 12px;
  border-top: 1px solid var(--border-color);
  display: flex;
  justify-content: center;
}

.collapse-btn {
  color: var(--text-secondary);
  width: 40px;
  height: 40px;
  border-radius: var(--radius-sm);
}

.collapse-btn:hover {
  background: var(--primary-light);
  color: var(--primary);
}

/* Main Wrapper */
.main-wrapper {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

/* Header */
.app-header {
  height: var(--header-height);
  min-height: var(--header-height);
  background: var(--bg-card);
  border-bottom: 1px solid var(--border-color);
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 24px;
  box-shadow: var(--shadow-sm);
}

.header-left {
  display: flex;
  align-items: center;
  gap: 12px;
}

.header-right {
  display: flex;
  align-items: center;
  gap: 8px;
}

.user-avatar-wrap {
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  padding: 4px 8px;
  border-radius: var(--radius-sm);
  transition: var(--transition);
}

.user-avatar-wrap:hover {
  background: var(--primary-light);
}

.user-name {
  font-size: 14px;
  font-weight: 500;
  color: var(--text-primary);
  max-width: 100px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.arrow-icon {
  color: var(--text-secondary);
}

/* Page Content */
.page-content {
  flex: 1;
  overflow-y: auto;
  padding: 24px;
}

/* Fade transition for logo text */
.fade-enter-active, .fade-leave-active {
  transition: opacity 0.2s;
}
.fade-enter-from, .fade-leave-to {
  opacity: 0;
}

/* Dark mode adjustments */
.dark .sidebar-menu :deep(.el-menu-item.is-active) {
  background: rgba(64, 158, 255, 0.15) !important;
}
</style>
