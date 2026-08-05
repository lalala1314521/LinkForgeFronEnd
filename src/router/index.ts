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
    // 管理后台：仅 ADMIN 可访问（USER 撞此树被守卫弹回商城）
    meta: { requiresAuth: true, roles: ['ADMIN'] },
    redirect: () => {
      const authStore = useAuthStore()
      return authStore.isAdmin ? '/dashboard' : '/mall/home'
    },
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
    path: '/mall',
    component: () => import('@/layouts/MallLayout.vue'),
    meta: { requiresAuth: true },
    redirect: '/mall/home',
    children: [
      {
        path: 'home',
        name: 'MallHome',
        component: () => import('@/views/mall/MallHomeView.vue'),
        meta: { title: '商城首页' },
      },
      // 购物车（USER 商城端）
      {
        path: 'cart',
        name: 'MallCart',
        component: () => import('@/views/mall/CartView.vue'),
        meta: { title: '购物车' },
      },
      // 结算确认（?from=cart 多商品 / ?productId=&qty= 立即购买单商品）
      {
        path: 'checkout',
        name: 'MallCheckout',
        component: () => import('@/views/mall/CheckoutView.vue'),
        meta: { title: '结算' },
      },
      // 秒杀（复用 SeckillView：USER 视角=抢购列表）
      {
        path: 'seckill',
        name: 'MallSeckill',
        component: () => import('@/views/seckill/SeckillView.vue'),
        meta: { title: '限时秒杀' },
      },
      // 订单（复用 OrderListView：USER 后端强制查本人单；含「我的秒杀」tab）
      {
        path: 'orders',
        name: 'MallOrderList',
        component: () => import('@/views/orders/OrderListView.vue'),
        meta: { title: '我的订单' },
      },
      {
        path: 'orders/:id',
        name: 'MallOrderDetail',
        component: () => import('@/views/orders/OrderDetailView.vue'),
        meta: { title: '订单详情' },
      },
      // 优惠券（复用 CouponCenterView）
      {
        path: 'coupons',
        name: 'MallCouponCenter',
        component: () => import('@/views/coupons/CouponCenterView.vue'),
        meta: { title: '优惠券中心' },
      },
      // 个人中心（复用 ProfileView）
      {
        path: 'profile',
        name: 'MallProfile',
        component: () => import('@/views/profile/ProfileView.vue'),
        meta: { title: '个人中心' },
      },
      // 智能客服（AI+RAG 演示）
      {
        path: 'support',
        name: 'MallSupport',
        component: () => import('@/views/mall/SupportView.vue'),
        meta: { title: '智能客服' },
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
// Navigation Guard（角色化）
// 1. requiresAuth && 未登录 → /login?redirect=...
// 2. meta.roles 与当前角色不符 → ADMIN 回 /dashboard，USER 回 /mall/home
// 3. 已登录访问 /login /register → 按角色跳首页
// 4. 其余放行
// ===========================

router.beforeEach((to, _from, next) => {
  const authStore = useAuthStore()

  // Set page title
  if (to.meta?.title) {
    document.title = `${to.meta.title} - LinkForge`
  }

  const requiresAuth = to.meta?.requiresAuth !== false

  if (requiresAuth && !authStore.isLoggedIn) {
    next({ name: 'Login', query: { redirect: to.fullPath } })
    return
  }

  // 角色校验（meta.roles 会合并父级路由的 roles）
  const requiredRoles = to.meta?.roles as string[] | undefined
  if (requiredRoles && requiredRoles.length > 0 && !requiredRoles.includes(authStore.role)) {
    // 角色不符：ADMIN 回后台，USER 回商城（等效 403）
    next(authStore.isAdmin ? { path: '/dashboard' } : { path: '/mall/home' })
    return
  }

  if (!requiresAuth && authStore.isLoggedIn && (to.name === 'Login' || to.name === 'Register')) {
    next(authStore.isAdmin ? { path: '/dashboard' } : { path: '/mall/home' })
    return
  }

  next()
})

export default router
