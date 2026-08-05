<template>
  <div class="dashboard">
    <!-- Welcome Banner -->
    <div class="welcome-banner">
      <div class="banner-content">
        <div class="welcome-text">
          <h2 class="welcome-title">你好，{{ authStore.nickname }} 👋</h2>
          <p class="welcome-sub">{{ greeting }}，今天是 {{ today }}</p>
        </div>
        <div class="banner-icon">
          <el-icon size="64" color="rgba(255,255,255,0.3)"><DataAnalysis /></el-icon>
        </div>
      </div>
    </div>

    <!-- Stats Cards -->
    <div class="stats-grid">
      <div
        v-for="stat in stats"
        :key="stat.label"
        class="stat-card"
        @click="$router.push(stat.route)"
      >
        <div class="stat-icon" :style="{ background: stat.bgColor }">
          <el-icon size="28" :color="stat.color"><component :is="stat.icon" /></el-icon>
        </div>
        <div class="stat-info">
          <div v-if="!statsLoading" class="stat-value">{{ stat.value }}</div>
          <el-skeleton v-else animated :rows="0" style="width:60px;height:28px" />
          <div class="stat-label">{{ stat.label }}</div>
        </div>
        <el-icon class="stat-arrow"><ArrowRight /></el-icon>
      </div>
    </div>

    <!-- Content Grid -->
    <div class="content-grid">
      <!-- Recent Orders -->
      <div class="app-card content-card">
        <div class="card-header">
          <span class="card-title">最近订单</span>
          <el-button link type="primary" @click="$router.push('/orders')">查看全部</el-button>
        </div>
        <template v-if="!ordersLoading && recentOrders.length === 0">
          <EmptyState description="暂无订单数据" />
        </template>
        <template v-else>
          <el-table
            :data="recentOrders"
            v-loading="ordersLoading"
            stripe
            style="width: 100%"
          >
            <el-table-column prop="orderNo" label="订单号" min-width="160">
              <template #default="{ row }">
                <span class="order-no">{{ row.orderNo }}</span>
              </template>
            </el-table-column>
            <el-table-column prop="finalAmount" label="实付金额" width="120">
              <template #default="{ row }">
                <span class="amount">{{ formatAmount(row.finalAmount ?? row.totalAmount) }}</span>
              </template>
            </el-table-column>
            <el-table-column prop="status" label="状态" width="100">
              <template #default="{ row }">
                <StatusTag :status="row.status" :map="ORDER_STATUS" size="small" />
              </template>
            </el-table-column>
            <el-table-column prop="createdAt" label="创建时间" min-width="150">
              <template #default="{ row }">
                <span class="text-secondary">{{ formatDate(row.createdAt) }}</span>
              </template>
            </el-table-column>
          </el-table>
        </template>
      </div>

      <!-- User Status Distribution -->
      <div class="app-card content-card">
        <div class="card-header">
          <span class="card-title">用户状态分布</span>
          <el-button link type="primary" @click="$router.push('/users')">管理用户</el-button>
        </div>

        <div class="user-stats">
          <div
            v-for="item in userStatusStats"
            :key="item.status"
            class="user-stat-item"
          >
            <div class="user-stat-header">
              <div class="user-stat-dot" :style="{ background: item.color }"></div>
              <span class="user-stat-label">{{ item.label }}</span>
              <span class="user-stat-count">{{ item.count }}</span>
            </div>
            <el-progress
              :percentage="item.percentage"
              :color="item.color"
              :stroke-width="8"
              :show-text="false"
            />
          </div>
        </div>

        <div class="order-status-section">
          <div class="card-title" style="margin-bottom: 16px">订单状态概览</div>
          <div class="order-status-grid">
            <div
              v-for="item in orderStatusStats"
              :key="item.status"
              class="order-stat-item"
              :style="{ '--status-color': item.color }"
            >
              <span class="order-stat-value">{{ item.count }}</span>
              <span class="order-stat-label">{{ item.label }}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import dayjs from 'dayjs'
import type { Component } from 'vue'
import { DataAnalysis, ArrowRight, User, UserFilled, ShoppingCart, Clock } from '@element-plus/icons-vue'
import StatusTag from '@/components/StatusTag.vue'
import EmptyState from '@/components/EmptyState.vue'
import { useAuthStore } from '@/stores/auth'
import { useUserApi } from '@/api/users'
import { useOrderApi } from '@/api/orders'
import { ORDER_STATUS } from '@/constants/statusMaps'
import { formatAmount, formatDate } from '@/utils/format'
import type { Order } from '@/types'

const authStore = useAuthStore()
const { getUsers } = useUserApi()
const { getOrders } = useOrderApi()

const statsLoading = ref(true)
const ordersLoading = ref(true)

const today = dayjs().format('YYYY年MM月DD日')
const hour = dayjs().hour()
const greeting = computed(() => {
  if (hour < 6) return '凌晨好'
  if (hour < 12) return '早上好'
  if (hour < 14) return '中午好'
  if (hour < 18) return '下午好'
  return '晚上好'
})

const totalUsers = ref(0)
const activeUsers = ref(0)
const disabledUsers = ref(0)
const deletedUsers = ref(0)
const totalOrders = ref(0)
const pendingOrders = ref(0)
const paidOrders = ref(0)
const shippedOrders = ref(0)
const completedOrders = ref(0)
const cancelledOrders = ref(0)
const recentOrders = ref<Order[]>([])

interface StatItem {
  label: string
  value: number
  icon: Component
  color: string
  bgColor: string
  route: string
}

// 统计图标底色变量化（--color-*-bg），图标为组件对象（main.ts 已移除全量注册）
const stats = computed<StatItem[]>(() => [
  {
    label: '总用户数',
    value: totalUsers.value,
    icon: User,
    color: 'var(--primary)',
    bgColor: 'var(--color-info-bg)',
    route: '/users',
  },
  {
    label: '活跃用户',
    value: activeUsers.value,
    icon: UserFilled,
    color: 'var(--success)',
    bgColor: 'var(--color-success-bg)',
    route: '/users',
  },
  {
    label: '总订单数',
    value: totalOrders.value,
    icon: ShoppingCart,
    color: 'var(--warning)',
    bgColor: 'var(--color-warning-bg)',
    route: '/orders',
  },
  {
    label: '待处理订单',
    value: pendingOrders.value,
    icon: Clock,
    color: 'var(--danger)',
    bgColor: 'var(--color-danger-bg)',
    route: '/orders',
  },
])

const userStatusStats = computed(() => {
  const total = totalUsers.value || 1
  return [
    { status: 'ACTIVE', label: '活跃', count: activeUsers.value, color: '#67C23A', percentage: Math.round((activeUsers.value / total) * 100) },
    { status: 'DISABLED', label: '禁用', count: disabledUsers.value, color: '#E6A23C', percentage: Math.round((disabledUsers.value / total) * 100) },
    { status: 'DELETED', label: '已删除', count: deletedUsers.value, color: '#F56C6C', percentage: Math.round((deletedUsers.value / total) * 100) },
  ]
})

const orderStatusStats = computed(() => [
  { status: 'PENDING', label: '待支付', count: pendingOrders.value, color: '#E6A23C' },
  { status: 'PAID', label: '已支付', count: paidOrders.value, color: '#4F6BFF' },
  { status: 'SHIPPED', label: '已发货', count: shippedOrders.value, color: '#909399' },
  { status: 'COMPLETED', label: '已完成', count: completedOrders.value, color: '#67C23A' },
  { status: 'CANCELLED', label: '已取消', count: cancelledOrders.value, color: '#F56C6C' },
])

async function fetchData() {
  try {
    // Fetch users by status（后端无聚合接口，保持 size=1 并发统计）
    const [allUsers, activeRes, disabledRes, deletedRes] = await Promise.all([
      getUsers({ page: 1, size: 1 }),
      getUsers({ status: 'ACTIVE', page: 1, size: 1 }),
      getUsers({ status: 'DISABLED', page: 1, size: 1 }),
      getUsers({ status: 'DELETED', page: 1, size: 1 }),
    ])
    totalUsers.value = allUsers.total
    activeUsers.value = activeRes.total
    disabledUsers.value = disabledRes.total
    deletedUsers.value = deletedRes.total
  } catch (e) {
    console.error(e)
  } finally {
    statsLoading.value = false
  }

  try {
    // Fetch order stats
    const [allOrders, pendingRes, paidRes, shippedRes, completedRes, cancelledRes] = await Promise.all([
      getOrders({ page: 1, size: 5 }),
      getOrders({ status: 'PENDING', page: 1, size: 1 }),
      getOrders({ status: 'PAID', page: 1, size: 1 }),
      getOrders({ status: 'SHIPPED', page: 1, size: 1 }),
      getOrders({ status: 'COMPLETED', page: 1, size: 1 }),
      getOrders({ status: 'CANCELLED', page: 1, size: 1 }),
    ])
    totalOrders.value = allOrders.total
    recentOrders.value = allOrders.records
    pendingOrders.value = pendingRes.total
    paidOrders.value = paidRes.total
    shippedOrders.value = shippedRes.total
    completedOrders.value = completedRes.total
    cancelledOrders.value = cancelledRes.total
  } catch (e) {
    console.error(e)
  } finally {
    ordersLoading.value = false
  }
}

onMounted(fetchData)
</script>

<style scoped>
.dashboard {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

/* Welcome Banner */
.welcome-banner {
  background: var(--gradient-brand);
  border-radius: var(--radius-lg);
  padding: 28px 32px;
  overflow: hidden;
  position: relative;
}

.banner-content {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.welcome-title {
  font-size: 24px;
  font-weight: 700;
  color: white;
  margin: 0 0 6px;
}

.welcome-sub {
  color: rgba(255, 255, 255, 0.85);
  margin: 0;
  font-size: 14px;
}

.banner-icon {
  opacity: 0.6;
}

/* Stats Grid */
.stats-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 16px;
}

@media (max-width: 1200px) {
  .stats-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

.stat-card {
  background: var(--bg-card);
  border-radius: var(--radius-md);
  padding: 20px;
  display: flex;
  align-items: center;
  gap: 16px;
  cursor: pointer;
  box-shadow: var(--shadow-sm);
  transition: var(--transition);
  position: relative;
  overflow: hidden;
}

.stat-card:hover {
  box-shadow: var(--shadow-md);
  transform: translateY(-2px);
}

.stat-icon {
  width: 52px;
  height: 52px;
  border-radius: 14px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.stat-info {
  flex: 1;
}

.stat-value {
  font-size: 26px;
  font-weight: 700;
  color: var(--text-primary);
  line-height: 1.2;
}

.stat-label {
  font-size: 13px;
  color: var(--text-secondary);
  margin-top: 2px;
}

.stat-arrow {
  color: var(--text-secondary);
  flex-shrink: 0;
}

/* Content Grid */
.content-grid {
  display: grid;
  grid-template-columns: 1.4fr 1fr;
  gap: 20px;
}

@media (max-width: 1200px) {
  .content-grid {
    grid-template-columns: 1fr;
  }
}

.content-card {
  min-height: 300px;
}

.card-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 16px;
}

.card-title {
  font-size: 15px;
  font-weight: 600;
  color: var(--text-primary);
}

.order-no {
  font-family: monospace;
  font-size: 12px;
  color: var(--text-secondary);
}

.amount {
  font-weight: 600;
  color: var(--danger);
}

.text-secondary {
  color: var(--text-secondary);
  font-size: 12px;
}

/* User Stats */
.user-stats {
  display: flex;
  flex-direction: column;
  gap: 14px;
  margin-bottom: 24px;
}

.user-stat-header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 6px;
}

.user-stat-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  flex-shrink: 0;
}

.user-stat-label {
  flex: 1;
  font-size: 13px;
  color: var(--text-regular);
}

.user-stat-count {
  font-weight: 600;
  font-size: 14px;
  color: var(--text-primary);
}

/* Order Status Grid */
.order-status-grid {
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  gap: 8px;
}

.order-stat-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 12px 8px;
  border-radius: var(--radius-sm);
  background: var(--bg-page);
  border: 1px solid var(--border-color);
  transition: var(--transition);
}

.order-stat-item:hover {
  border-color: var(--status-color, var(--primary));
}

.order-stat-value {
  font-size: 20px;
  font-weight: 700;
  color: var(--status-color, var(--text-primary));
}

.order-stat-label {
  font-size: 11px;
  color: var(--text-secondary);
  margin-top: 2px;
}
</style>
