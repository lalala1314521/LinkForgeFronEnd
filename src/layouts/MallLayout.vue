<template>
  <div class="mall-layout">
    <!-- Top Nav -->
    <header class="mall-header">
      <div class="mall-header-inner">
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

          <!-- Logo -->
          <router-link to="/mall/home" class="mall-logo">
            <el-icon size="24" color="var(--primary)"><Link /></el-icon>
            <span class="logo-text">LinkForge</span>
          </router-link>

          <!-- Desktop Nav -->
          <nav v-if="!isMobile" class="mall-nav">
            <router-link
              v-for="item in navItems"
              :key="item.path"
              :to="item.path"
              class="nav-link"
              :class="{ 'is-active': isActive(item.path) }"
            >
              {{ item.label }}
            </router-link>
          </nav>
        </div>

        <div class="header-right">
          <!-- 购物车入口（角标显示数量） -->
          <el-tooltip content="购物车" placement="bottom">
            <el-badge :value="cartCount" :hidden="cartCount === 0" :max="99" class="cart-badge">
              <el-button circle link size="large" @click="router.push('/mall/cart')">
                <el-icon size="20"><ShoppingCart /></el-icon>
              </el-button>
            </el-badge>
          </el-tooltip>

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
      </div>

      <!-- Mobile Drawer -->
      <el-drawer
        v-model="mobileDrawer"
        direction="ltr"
        size="240px"
        :with-header="false"
        class="mall-drawer"
      >
        <div class="sidebar-logo">
          <el-icon size="24" color="var(--primary)"><Link /></el-icon>
          <span class="logo-text">LinkForge</span>
        </div>
        <nav class="mobile-nav">
          <router-link
            v-for="item in navItems"
            :key="item.path"
            :to="item.path"
            class="nav-link"
            :class="{ 'is-active': isActive(item.path) }"
            @click="mobileDrawer = false"
          >
            {{ item.label }}
          </router-link>
        </nav>
      </el-drawer>
    </header>

    <!-- Page Content -->
    <main class="mall-content">
      <router-view v-slot="{ Component }">
        <transition name="page" mode="out-in">
          <component :is="Component" />
        </transition>
      </router-view>
    </main>

    <!-- Footer -->
    <footer class="mall-footer">
      <div class="mall-footer-inner">
        <span class="footer-brand">LinkForge</span>
        <span class="footer-copy">© 2026 LinkForge · 让链接创造价值</span>
      </div>
    </footer>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, onMounted, onBeforeUnmount, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessageBox, ElMessage } from 'element-plus'
import { Link, Sunny, Moon, ArrowDown, User, SwitchButton, Menu, ShoppingCart } from '@element-plus/icons-vue'
import AppAvatar from '@/components/AppAvatar.vue'
import { useAuthStore } from '@/stores/auth'
import { useAppStore } from '@/stores/app'
import { useCartApi } from '@/api/cart'

const route = useRoute()
const router = useRouter()
const authStore = useAuthStore()
const appStore = useAppStore()
const { getCount } = useCartApi()

const isDark = computed(() => appStore.theme === 'dark')
const mobileDrawer = ref(false)

/** 购物车商品总数（导航角标） */
const cartCount = ref(0)

async function refreshCartCount() {
  try {
    cartCount.value = await getCount()
  } catch {
    cartCount.value = 0
  }
}

// 路由变化（进入商城域）时刷新购物车角标
watch(
  () => route.path,
  () => {
    if (authStore.isLoggedIn && route.path.startsWith('/mall')) {
      refreshCartCount()
    }
  },
  { immediate: true }
)

const navItems = [
  { path: '/mall/home', label: '首页' },
  { path: '/mall/seckill', label: '限时秒杀' },
  { path: '/mall/orders', label: '我的订单' },
  { path: '/mall/coupons', label: '优惠券' },
  { path: '/mall/support', label: '在线客服' },
  { path: '/mall/profile', label: '个人中心' },
]

function isActive(path: string) {
  return route.path === path || (path !== '/mall/home' && route.path.startsWith(path))
}

// 移动端：≤768px 导航折叠为抽屉
const isMobile = ref(false)

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

// 路由变化自动关闭抽屉
watch(
  () => route.fullPath,
  () => {
    mobileDrawer.value = false
  }
)

async function handleCommand(command: string) {
  if (command === 'profile') {
    router.push('/mall/profile')
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
.mall-layout {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  background: var(--bg-page);
}

/* Header */
.mall-header {
  position: sticky;
  top: 0;
  z-index: 100;
  background: var(--bg-card);
  border-bottom: 1px solid var(--border-color);
  box-shadow: var(--shadow-sm);
}

.mall-header-inner {
  max-width: 1200px;
  margin: 0 auto;
  height: var(--header-height);
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 24px;
  gap: 16px;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 20px;
  min-width: 0;
}

.mall-logo {
  display: flex;
  align-items: center;
  gap: 8px;
  text-decoration: none;
  flex-shrink: 0;
}

.logo-text {
  font-size: 18px;
  font-weight: 800;
  color: var(--text-primary);
  letter-spacing: 0.5px;
}

.mall-nav {
  display: flex;
  align-items: center;
  gap: 6px;
}

.nav-link {
  padding: 8px 14px;
  border-radius: var(--radius-sm);
  font-size: 14px;
  color: var(--text-regular);
  text-decoration: none;
  transition: var(--transition);
  white-space: nowrap;
}

.nav-link:hover {
  color: var(--primary);
  background: var(--primary-light);
}

.nav-link.is-active {
  color: var(--primary);
  background: var(--primary-light);
  font-weight: 600;
}

.header-right {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-shrink: 0;
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

.hamburger-btn {
  color: var(--text-regular);
}

/* Drawer */
.mall-drawer :deep(.el-drawer__body) {
  padding: 0;
  display: flex;
  flex-direction: column;
  background: var(--bg-card);
}

.sidebar-logo {
  height: var(--header-height);
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 0 18px;
  border-bottom: 1px solid var(--border-color);
}

.mobile-nav {
  display: flex;
  flex-direction: column;
  padding: 12px;
  gap: 4px;
}

.mobile-nav .nav-link {
  padding: 12px 14px;
  font-size: 15px;
}

/* Content */
.mall-content {
  flex: 1;
  width: 100%;
  max-width: 1200px;
  margin: 0 auto;
  padding: 24px;
}

/* Footer */
.mall-footer {
  border-top: 1px solid var(--border-color);
  background: var(--bg-card);
}

.mall-footer-inner {
  max-width: 1200px;
  margin: 0 auto;
  padding: 24px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  flex-wrap: wrap;
}

.footer-brand {
  font-size: 15px;
  font-weight: 700;
  color: var(--text-primary);
}

.footer-copy {
  font-size: 13px;
  color: var(--text-secondary);
}

@media (max-width: 768px) {
  .mall-content {
    padding: 16px;
  }

  .mall-footer-inner {
    justify-content: center;
  }
}
</style>
