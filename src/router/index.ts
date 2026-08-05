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
      // Product management
      {
        path: 'products',
        name: 'ProductList',
        component: () => import('@/views/products/ProductListView.vue'),
        meta: { title: '商品管理', icon: 'Goods' },
      },
      // Coupon center
      {
        path: 'coupons',
        name: 'CouponCenter',
        component: () => import('@/views/coupons/CouponCenterView.vue'),
        meta: { title: '优惠券中心', icon: 'Ticket' },
      },
      // Seckill
      {
        path: 'seckill',
        name: 'Seckill',
        component: () => import('@/views/seckill/SeckillView.vue'),
        meta: { title: '秒杀活动', icon: 'Clock' },
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
    // 修复功能 bug：未登录访问任意错误 URL 应显示 404，而不是被弹回登录页
    meta: { requiresAuth: false, title: '页面不存在' },
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
