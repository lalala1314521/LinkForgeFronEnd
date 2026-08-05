<template>
  <div class="order-detail-page">
    <PageHeader title="订单详情" back back-text="返回订单列表" />

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
              <el-icon size="32" color="var(--primary)"><component :is="getStatusIcon(order.status)" /></el-icon>
            </div>
            <div class="status-text-wrap">
              <div class="status-label">
                <StatusTag :status="order.status" :map="ORDER_STATUS" size="large" />
              </div>
              <div class="status-desc">{{ getStatusDesc(order.status) }}</div>
            </div>
          </div>

          <!-- Amount Section (金额三栏) -->
          <div class="amount-section">
            <div class="amount-item">
              <span class="amount-label">订单金额</span>
              <span class="amount-value">{{ formatAmount(order.totalAmount) }}</span>
            </div>
            <div v-if="Number(order.couponDiscount) > 0" class="amount-item">
              <span class="amount-label">优惠券抵扣</span>
              <span class="amount-value discount">- {{ formatAmount(order.couponDiscount) }}</span>
            </div>
            <div class="amount-item">
              <span class="amount-label">实付金额</span>
              <span class="amount-value final">{{ formatAmount(order.finalAmount ?? order.totalAmount) }}</span>
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
                <span class="info-label">备注</span>
                <span class="info-value">{{ order.remark || '—' }}</span>
              </div>
              <div class="info-item">
                <span class="info-label">创建时间</span>
                <span class="info-value">{{ formatDateTime(order.createdAt) }}</span>
              </div>
              <div class="info-item">
                <span class="info-label">最后更新</span>
                <span class="info-value">{{ formatDateTime(order.updatedAt) }}</span>
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

        <!-- Timeline Card (只保留真实时间节点) -->
        <div class="app-card timeline-card">
          <div class="info-title" style="margin-bottom: 20px">订单状态流转</div>
          <el-timeline>
            <el-timeline-item
              v-for="(step, i) in statusTimeline"
              :key="i"
              :type="getTimelineType(step)"
              :hollow="step.state !== 'reached'"
              :timestamp="step.time || ''"
            >
              <div class="timeline-content">
                <span class="timeline-title">{{ step.label }}</span>
                <span v-if="step.state === 'reached'" class="timeline-badge reached">
                  已完成
                </span>
                <span v-else-if="step.state === 'current'" class="timeline-badge current">
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
import type { Component } from 'vue'
import { CreditCard, CircleClose, Clock, Van, CircleCheck, InfoFilled } from '@element-plus/icons-vue'
import PageHeader from '@/components/PageHeader.vue'
import StatusTag from '@/components/StatusTag.vue'
import { useOrderApi } from '@/api/orders'
import { ORDER_STATUS } from '@/constants/statusMaps'
import { formatAmount, formatDateTime } from '@/utils/format'
import type { Order, OrderStatus } from '@/types'

const route = useRoute()
const router = useRouter()
const { getOrderById, payOrder, cancelOrder } = useOrderApi()

const orderId = Number(route.params.id)
const loading = ref(true)
const order = ref<Order | null>(null)

interface TimelineStep {
  status: string
  label: string
  time: string
  state: 'reached' | 'current' | 'pending'
}

/** 时间线只保留真实节点：订单创建(createdAt) 与订单完成(updatedAt，仅 COMPLETED)；
 *  PAID/SHIPPED 显示 label 但不显示假时间（后端无状态流转时间字段，已核实） */
const statusTimeline = computed<TimelineStep[]>(() => {
  const o = order.value
  if (!o) return []
  const status: OrderStatus = o.status
  const steps: TimelineStep[] = [
    { status: 'PENDING', label: '订单创建', time: formatDateTime(o.createdAt), state: 'reached' },
  ]
  if (status === 'CANCELLED') return steps

  steps.push({
    status: 'PAID',
    label: '支付完成',
    time: '',
    state: status === 'PAID' ? 'current' : (status === 'SHIPPED' || status === 'COMPLETED' ? 'reached' : 'pending'),
  })
  if (status === 'PAID') return steps

  steps.push({
    status: 'SHIPPED',
    label: '商品发货',
    time: '',
    state: status === 'SHIPPED' ? 'current' : (status === 'COMPLETED' ? 'reached' : 'pending'),
  })
  if (status === 'SHIPPED') return steps

  steps.push({
    status: 'COMPLETED',
    label: '订单完成',
    time: formatDateTime(o.updatedAt),
    state: 'reached',
  })
  return steps
})

/** 返回组件对象（main.ts 已移除全量图标注册，必须局部引入） */
function getStatusIcon(status: string): Component {
  const map: Record<string, Component> = {
    PENDING: Clock,
    PAID: CreditCard,
    SHIPPED: Van,
    COMPLETED: CircleCheck,
    CANCELLED: CircleClose,
  }
  return map[status] || InfoFilled
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

function getTimelineType(step: TimelineStep) {
  if (step.state === 'reached') return 'success' as const
  if (step.state === 'current') return 'primary' as const
  return 'info' as const
}

function canCancel(status: string) {
  return status !== 'COMPLETED' && status !== 'CANCELLED'
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
    `确定支付订单 ${order.value.orderNo}？\n金额：${formatAmount(order.value.finalAmount ?? order.value.totalAmount)}`,
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

/* 状态底色变量化：深色不再需要单独 .dark 覆盖（变量已含深色值） */
.status-pending { background: var(--color-warning-bg); }
.status-paid { background: var(--color-info-bg); }
.status-shipped { background: var(--bg-page); }
.status-completed { background: var(--color-success-bg); }
.status-cancelled { background: var(--color-danger-bg); }

.status-icon-wrap {
  width: 56px;
  height: 56px;
  border-radius: 50%;
  background: var(--bg-card);
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: var(--shadow-sm);
  flex-shrink: 0;
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

/* Amount Section (金额三栏) */
.amount-section {
  display: flex;
  align-items: center;
  gap: 20px;
  flex-wrap: wrap;
  padding: 16px 20px;
  margin-bottom: 20px;
  border-radius: var(--radius-sm);
  border: 1px solid var(--border-color);
  background: var(--bg-page);
}

.amount-item {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.amount-label {
  font-size: 12px;
  color: var(--text-secondary);
}

.amount-value {
  font-size: 18px;
  font-weight: 700;
  color: var(--text-primary);
}

.amount-value.discount {
  color: var(--success);
}

.amount-value.final {
  color: var(--danger);
  font-size: 22px;
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

/* Actions */
.order-actions {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
}

/* Timeline */
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
  background: var(--color-success-bg);
  color: var(--success);
}

.timeline-badge.current {
  background: var(--color-info-bg);
  color: var(--primary);
}

.timeline-badge.pending {
  background: var(--bg-page);
  color: var(--text-secondary);
}
</style>
