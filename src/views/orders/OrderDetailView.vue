<template>
  <div class="order-detail-page">
    <div class="back-nav">
      <el-button :icon="ArrowLeft" link @click="$router.back()">返回订单列表</el-button>
    </div>

    <div v-if="loading">
      <el-skeleton :rows="10" animated style="padding: 20px; background: var(--bg-card); border-radius: var(--radius-md)" />
    </div>

    <template v-else-if="order">
      <div class="detail-grid">
        <!-- Order Info Card -->
        <div class="app-card order-info-card">
          <!-- Status Header -->
          <div class="order-status-header" :class="`status-${order.status.toLowerCase()}`">
            <div class="status-icon-wrap">
              <el-icon size="32"><component :is="getStatusIcon(order.status)" /></el-icon>
            </div>
            <div class="status-text-wrap">
              <div class="status-label">{{ orderStatusMap[order.status] }}</div>
              <div class="status-desc">{{ getStatusDesc(order.status) }}</div>
            </div>
          </div>

          <!-- Order Details -->
          <div class="info-section">
            <div class="info-title">订单信息</div>
            <div class="info-grid">
              <div class="info-item">
                <span class="info-label">订单号</span>
                <span class="info-value mono">{{ order.orderNo }}</span>
              </div>
              <div class="info-item">
                <span class="info-label">订单 ID</span>
                <span class="info-value">#{{ order.id }}</span>
              </div>
              <div class="info-item">
                <span class="info-label">关联用户</span>
                <el-button link type="primary" @click="$router.push(`/users/${order.userId}`)">
                  用户 #{{ order.userId }}
                </el-button>
              </div>
              <div class="info-item">
                <span class="info-label">订单金额</span>
                <span class="info-value amount">¥ {{ Number(order.totalAmount).toFixed(2) }}</span>
              </div>
              <div class="info-item">
                <span class="info-label">备注</span>
                <span class="info-value">{{ order.remark || '—' }}</span>
              </div>
              <div class="info-item">
                <span class="info-label">创建时间</span>
                <span class="info-value">{{ formatDate(order.createdAt) }}</span>
              </div>
              <div class="info-item">
                <span class="info-label">最后更新</span>
                <span class="info-value">{{ formatDate(order.updatedAt) }}</span>
              </div>
            </div>
          </div>

          <!-- Action Buttons -->
          <div class="order-actions">
            <el-button
              v-if="order.status === 'PENDING'"
              type="success"
              :icon="CreditCard"
              @click="handlePay"
            >
              立即支付
            </el-button>
            <el-button
              v-if="canCancel(order.status)"
              type="danger"
              plain
              :icon="CircleClose"
              @click="handleCancel"
            >
              取消订单
            </el-button>
            <el-tag
              v-if="order.status === 'COMPLETED' || order.status === 'CANCELLED'"
              :type="order.status === 'COMPLETED' ? 'success' : 'info'"
              size="large"
            >
              {{ order.status === 'COMPLETED' ? '订单已完成' : '订单已取消' }}
            </el-tag>
          </div>
        </div>

        <!-- Timeline Card -->
        <div class="app-card timeline-card">
          <div class="info-title" style="margin-bottom: 20px">订单状态流转</div>
          <el-timeline>
            <el-timeline-item
              v-for="(step, i) in statusTimeline"
              :key="i"
              :type="getTimelineType(step.status, order.status)"
              :hollow="!isStatusReached(step.status, order.status)"
              :timestamp="step.time"
            >
              <div class="timeline-content">
                <span class="timeline-title">{{ step.label }}</span>
                <span v-if="isStatusReached(step.status, order.status)" class="timeline-badge reached">
                  已完成
                </span>
                <span v-else-if="step.status === order.status" class="timeline-badge current">
                  当前
                </span>
                <span v-else class="timeline-badge pending">
                  待处理
                </span>
              </div>
            </el-timeline-item>
          </el-timeline>

          <!-- Cancelled notice -->
          <el-alert
            v-if="order.status === 'CANCELLED'"
            type="error"
            :closable="false"
            title="此订单已被取消"
            show-icon
            style="margin-top: 16px"
          />
        </div>
      </div>
    </template>

    <el-result
      v-else
      icon="error"
      title="订单不存在"
      sub-title="该订单可能已被删除"
    >
      <template #extra>
        <el-button type="primary" @click="$router.push('/orders')">返回列表</el-button>
      </template>
    </el-result>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { ArrowLeft, CreditCard, CircleClose } from '@element-plus/icons-vue'
import dayjs from 'dayjs'
import { useOrderApi } from '@/api/orders'
import type { Order } from '@/types'

const route = useRoute()
const router = useRouter()
const { getOrderById, payOrder, cancelOrder } = useOrderApi()

const orderId = Number(route.params.id)
const loading = ref(true)
const order = ref<Order | null>(null)

const orderStatusMap: Record<string, string> = {
  PENDING: '待支付', PAID: '已支付', SHIPPED: '已发货', COMPLETED: '已完成', CANCELLED: '已取消'
}

const statusFlowOrder = ['PENDING', 'PAID', 'SHIPPED', 'COMPLETED']

const statusTimeline = computed(() => [
  { status: 'PENDING', label: '订单创建', time: order.value ? formatDate(order.value.createdAt) : '' },
  { status: 'PAID', label: '支付完成', time: '' },
  { status: 'SHIPPED', label: '商品发货', time: '' },
  { status: 'COMPLETED', label: '订单完成', time: order.value && order.value.status === 'COMPLETED' ? formatDate(order.value.updatedAt) : '' },
])

function getStatusIcon(status: string) {
  const map: Record<string, string> = {
    PENDING: 'Clock',
    PAID: 'CreditCard',
    SHIPPED: 'Van',
    COMPLETED: 'CircleCheck',
    CANCELLED: 'CircleClose',
  }
  return map[status] || 'InfoFilled'
}

function getStatusDesc(status: string) {
  const map: Record<string, string> = {
    PENDING: '等待买家支付',
    PAID: '买家已完成支付',
    SHIPPED: '商品正在运输中',
    COMPLETED: '交易已成功完成',
    CANCELLED: '订单已被取消',
  }
  return map[status] || ''
}

function getTimelineType(stepStatus: string, currentStatus: string) {
  if (currentStatus === 'CANCELLED') return 'danger' as const
  if (isStatusReached(stepStatus, currentStatus)) return 'success' as const
  if (stepStatus === currentStatus) return 'primary' as const
  return 'info' as const
}

function isStatusReached(stepStatus: string, currentStatus: string) {
  if (currentStatus === 'CANCELLED') return false
  const stepIdx = statusFlowOrder.indexOf(stepStatus)
  const currentIdx = statusFlowOrder.indexOf(currentStatus)
  return stepIdx < currentIdx
}

function canCancel(status: string) {
  return status !== 'COMPLETED' && status !== 'CANCELLED'
}

function formatDate(d: string) {
  return dayjs(d).format('YYYY-MM-DD HH:mm:ss')
}

async function fetchOrder() {
  loading.value = true
  try {
    order.value = await getOrderById(orderId)
  } catch {
    order.value = null
  } finally {
    loading.value = false
  }
}

async function handlePay() {
  if (!order.value) return
  await ElMessageBox.confirm(
    `确定支付订单 ${order.value.orderNo}？\n金额：¥${Number(order.value.totalAmount).toFixed(2)}`,
    '确认支付',
    { type: 'warning', confirmButtonText: '确认支付' }
  )
  await payOrder(orderId)
  ElMessage.success('支付成功')
  fetchOrder()
}

async function handleCancel() {
  if (!order.value) return
  await ElMessageBox.confirm(
    `确定取消订单 ${order.value.orderNo}？此操作不可撤销。`,
    '确认取消',
    { type: 'error', confirmButtonText: '确认取消' }
  )
  await cancelOrder(orderId)
  ElMessage.success('订单已取消')
  fetchOrder()
}

onMounted(fetchOrder)
</script>

<style scoped>
.order-detail-page {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.detail-grid {
  display: grid;
  grid-template-columns: 1.6fr 1fr;
  gap: 20px;
  align-items: start;
}

@media (max-width: 960px) {
  .detail-grid {
    grid-template-columns: 1fr;
  }
}

/* Status Header */
.order-status-header {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 20px;
  border-radius: var(--radius-sm);
  margin-bottom: 20px;
}

.status-pending { background: #fdf6ec; }
.status-paid { background: #ecf5ff; }
.status-shipped { background: #f4f4f5; }
.status-completed { background: #f0f9eb; }
.status-cancelled { background: #fef0f0; }

.dark .status-pending { background: rgba(230, 162, 60, 0.1); }
.dark .status-paid { background: rgba(64, 158, 255, 0.1); }
.dark .status-shipped { background: rgba(144, 147, 153, 0.1); }
.dark .status-completed { background: rgba(103, 194, 58, 0.1); }
.dark .status-cancelled { background: rgba(245, 108, 108, 0.1); }

.status-icon-wrap {
  width: 56px;
  height: 56px;
  border-radius: 50%;
  background: white;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: var(--shadow-sm);
  flex-shrink: 0;
}

.dark .status-icon-wrap {
  background: var(--bg-page);
}

.status-label {
  font-size: 18px;
  font-weight: 700;
  color: var(--text-primary);
}

.status-desc {
  font-size: 13px;
  color: var(--text-secondary);
  margin-top: 2px;
}

/* Info Section */
.info-section {
  margin-bottom: 24px;
}

.info-title {
  font-size: 14px;
  font-weight: 600;
  color: var(--text-secondary);
  text-transform: uppercase;
  letter-spacing: 0.5px;
  margin-bottom: 12px;
  padding-bottom: 8px;
  border-bottom: 1px solid var(--border-color);
}

.info-grid {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.info-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 14px;
}

.info-label {
  color: var(--text-secondary);
}

.info-value {
  font-weight: 500;
  color: var(--text-primary);
  text-align: right;
}

.info-value.mono {
  font-family: monospace;
  font-size: 12px;
}

.info-value.amount {
  font-size: 20px;
  font-weight: 700;
  color: var(--danger);
}

/* Actions */
.order-actions {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
}

/* Timeline */
.timeline-card {}

.timeline-content {
  display: flex;
  align-items: center;
  gap: 8px;
}

.timeline-title {
  font-size: 14px;
  color: var(--text-primary);
  font-weight: 500;
}

.timeline-badge {
  font-size: 11px;
  padding: 1px 8px;
  border-radius: 10px;
}

.timeline-badge.reached {
  background: #f0f9eb;
  color: #67C23A;
}

.timeline-badge.current {
  background: #ecf5ff;
  color: #409EFF;
}

.timeline-badge.pending {
  background: var(--bg-page);
  color: var(--text-secondary);
}
</style>
