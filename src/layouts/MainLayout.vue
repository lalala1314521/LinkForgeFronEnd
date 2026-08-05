<template>
  <div class="main-layout" :class="{ 'sidebar-collapsed': appStore.sidebarCollapsed }">
    <!-- Desktop Sidebar (only >768px) -->
    <aside v-if="!isMobile" class="sidebar">
      <!-- Logo -->
      <div class="sidebar-logo">
        <el-icon size="28" color="var(--primary)"><DocumentChecked /></el-icon>
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
          <el-icon><component :is="iconMap[item.icon]" /></el-icon>
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

    <!-- Mobile Drawer: reuses the same menu -->
    <el-drawer
      v-model="mobileDrawer"
      direction="ltr"
      size="220px"
      :with-header="false"
      class="mobile-drawer"
    >
      <div class="sidebar-logo">
        <el-icon size="28" color="var(--primary)"><DocumentChecked /></el-icon>
        <span class="logo-text">参考管理系统</span>
      </div>
      <el-menu
        :default-active="activeRoute"
        class="sidebar-menu"
        router
      >
        <el-menu-item
          v-for="item in menuItems"
          :key="item.path"
          :index="item.path"
        >
          <el-icon><component :is="iconMap[item.icon]" /></el-icon>
          <template #title>{{ item.title }}</template>
        </el-menu-item>
      </el-menu>
    </el-drawer>

    <!-- Main Content -->
    <div class="main-wrapper">
      <!-- Header -->
      <header class="app-header">
        <div class="header-left">
          <!-- Mobile hamburger -->
          <el-button
            v-if="isMobile"
            circle
            link
            class="hamburger-btn"
            @click="mobileDrawer = true"
          >
            <el-icon size="20"><Menu /></el-icon>
          </el-button>
          <!-- Mobile site name -->
          <span v-if="isMobile" class="mobile-site-name">参考管理系统</span>
          <!-- Breadcrumb (desktop) -->
          <el-breadcrumb v-else separator="/">
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
              <AppAvatar :name="authStore.nickname || authStore.username" :size="34" />
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
import { computed, ref, onMounted, onBeforeUnmount, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessageBox, ElMessage } from 'element-plus'
import type { Component } from 'vue'
import {
  DocumentChecked, Expand, Fold, Sunny, Moon, ArrowDown, User, SwitchButton, Menu,
  Odometer, ShoppingCart, Goods, Ticket, Clock,
} from '@element-plus/icons-vue'
import AppAvatar from '@/components/AppAvatar.vue'
import { useAuthStore } from '@/stores/auth'
import { useAppStore } from '@/stores/app'

const route = useRoute()
const router = useRouter()
const authStore = useAuthStore()
const appStore = useAppStore()

const isDark = computed(() => appStore.theme === 'dark')
const currentRoute = computed(() => route)
const activeRoute = computed(() => '/' + route.path.split('/')[1])

// 菜单从路由派生（meta.title / meta.icon），消除"加路由改两处"
const menuItems = computed(() => {
  const root = router.options.routes.find(r => r.path === '/')
  return (root?.children ?? [])
    .filter(c => c.meta?.title && !c.meta?.hidden && c.meta?.icon)
    .map(c => ({
      path: '/' + c.path,
      title: c.meta!.title as string,
      icon: c.meta!.icon as string,
    }))
})

// 图标字符串 -> 组件映射（T01 移除全量注册后必须局部引入）
const iconMap: Record<string, Component> = {
  Odometer,
  User,
  ShoppingCart,
  Goods,
  Ticket,
  Clock,
}

// 移动端：≤768px 侧边栏隐藏，显示汉堡 + 抽屉
const isMobile = ref(false)
const mobileDrawer = ref(false)

function updateIsMobile() {
  isMobile.value = window.innerWidth <= 768
}

onMounted(() => {
  updateIsMobile()
  window.addEventListener('resize', updateIsMobile)
})

onBeforeUnmount(() => {
  window.removeEventListener('resize', updateIsMobile)
})

// 抽屉内点击菜单跳转后自动关闭
watch(
  () => route.fullPath,
  () => {
    mobileDrawer.value = false
  }
)

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

/* Mobile drawer */
.mobile-drawer :deep(.el-drawer__body) {
  padding: 0;
  display: flex;
  flex-direction: column;
  background: var(--bg-card);
}

.mobile-drawer .sidebar-menu {
  flex: 1;
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

.hamburger-btn {
  color: var(--text-regular);
}

.mobile-site-name {
  font-size: 15px;
  font-weight: 700;
  color: var(--text-primary);
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
</style>
