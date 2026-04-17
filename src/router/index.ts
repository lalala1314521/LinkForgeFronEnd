import { createRouter, createWebHistory, type RouteRecordRaw } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

const routes: RouteRecordRaw[] = [
  {
    path: '/login',
    name: 'Login',
    component: () => import('@/views/auth/LoginView.vue'),
    meta: { requiresAuth: false, title: '登录' },
  },
  {
    path: '/register',
    name: 'Register',
    component: () => import('@/views/auth/RegisterView.vue'),
    meta: { requiresAuth: false, title: '注册' },
  },
  {
    path: '/',
    component: () => import('@/layouts/MainLayout.vue'),
    meta: { requiresAuth: true },
    redirect: '/dashboard',
    children: [
      {
        path: 'dashboard',
        name: 'Dashboard',
        component: () => import('@/views/dashboard/DashboardView.vue'),
        meta: { title: '控制台', icon: 'Odometer' },
      },
      // User management
      {
        path: 'users',
        name: 'UserList',
        component: () => import('@/views/users/UserListView.vue'),
        meta: { title: '用户管理', icon: 'User' },
      },
      {
        path: 'users/:id',
        name: 'UserDetail',
        component: () => import('@/views/users/UserDetailView.vue'),
        meta: { title: '用户详情', hidden: true },
      },
      // Order management
      {
        path: 'orders',
        name: 'OrderList',
        component: () => import('@/views/orders/OrderListView.vue'),
        meta: { title: '订单管理', icon: 'ShoppingCart' },
      },
      {
        path: 'orders/:id',
        name: 'OrderDetail',
        component: () => import('@/views/orders/OrderDetailView.vue'),
        meta: { title: '订单详情', hidden: true },
      },
      // Profile
      {
        path: 'profile',
        name: 'Profile',
        component: () => import('@/views/profile/ProfileView.vue'),
        meta: { title: '个人中心', hidden: true },
      },
    ],
  },
  {
    path: '/:pathMatch(.*)*',
    name: 'NotFound',
    component: () => import('@/views/error/NotFoundView.vue'),
  },
]

const router = createRouter({
  history: createWebHistory(),
  routes,
  scrollBehavior() {
    return { top: 0 }
  },
})

// ===========================
// Navigation Guard
// ===========================

router.beforeEach((to, _from, next) => {
  const authStore = useAuthStore()

  // Set page title
  if (to.meta?.title) {
    document.title = `${to.meta.title} - 参考管理系统`
  }

  const requiresAuth = to.meta?.requiresAuth !== false

  if (requiresAuth && !authStore.isLoggedIn) {
    next({ name: 'Login', query: { redirect: to.fullPath } })
    return
  }

  if (!requiresAuth && authStore.isLoggedIn && (to.name === 'Login' || to.name === 'Register')) {
    next({ name: 'Dashboard' })
    return
  }

  next()
})

export default router
