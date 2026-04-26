<template>
  <div class="order-list-page">
    <!-- Page Header -->
    <div class="page-header">
      <div class="header-left">
        <h2 class="page-title">订单管理</h2>
        <el-tag type="info" round>共 {{ total }} 笔订单</el-tag>
      </div>
      <el-button type="primary" :icon="Plus" @click="openCreateDialog">
        创建订单
      </el-button>
    </div>

    <!-- Filter Bar -->
    <div class="app-card filter-card">
      <el-form :model="queryForm" inline>
        <el-form-item label="用户 ID">
          <el-input
            v-model.number="queryForm.userId"
            placeholder="按用户ID筛选"
            clearable
            type="number"
            style="width: 140px"
          />
        </el-form-item>
        <el-form-item label="状态">
          <el-select v-model="queryForm.status" clearable placeholder="全部状态" style="width: 130px">
            <el-option v-for="s in orderStatuses" :key="s.value" :label="s.label" :value="s.value" />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" :icon="Search" @click="handleSearch">查询</el-button>
          <el-button :icon="Refresh" @click="handleReset">重置</el-button>
        </el-form-item>
      </el-form>
    </div>

    <!-- Status Quick Filter Tabs -->
    <div class="status-tabs">
      <div
        v-for="tab in statusTabs"
        :key="tab.value"
        class="status-tab"
        :class="{ active: queryForm.status === tab.value }"
        @click="quickFilter(tab.value)"
      >
        <span class="tab-label">{{ tab.label }}</span>
        <span class="tab-dot" :style="{ background: tab.color }"></span>
      </div>
    </div>

    <!-- Table -->
    <div class="app-card">
      <el-table
        v-loading="loading"
        :data="orders"
        stripe
        row-key="id"
      >
        <el-table-column type="index" label="#" width="60" />

        <el-table-column prop="orderNo" label="订单号" min-width="180">
          <template #default="{ row }">
            <el-button link type="primary" @click="viewDetail(row.id)">
              {{ row.orderNo }}
            </el-button>
          </template>
        </el-table-column>

        <el-table-column prop="userId" label="用户 ID" width="90">
          <template #default="{ row }">
            <el-tag size="small" @click="$router.push(`/users/${row.userId}`)" style="cursor:pointer">
              #{{ row.userId }}
            </el-tag>
          </template>
        </el-table-column>

        <el-table-column prop="totalAmount" label="订单金额" width="130">
          <template #default="{ row }">
            <span class="amount">¥ {{ Number(row.totalAmount).toFixed(2) }}</span>
          </template>
        </el-table-column>

        <el-table-column prop="status" label="状态" width="110">
          <template #default="{ row }">
            <el-tag :type="getStatusType(row.status)" size="small" round>
              {{ orderStatusMap[row.status] }}
            </el-tag>
          </template>
        </el-table-column>

        <el-table-column prop="remark" label="备注" min-width="150">
          <template #default="{ row }">
            <span style="color: var(--text-secondary)">{{ row.remark || '—' }}</span>
          </template>
        </el-table-column>

        <el-table-column prop="createdAt" label="创建时间" width="170">
          <template #default="{ row }">{{ formatDate(row.createdAt) }}</template>
        </el-table-column>

        <el-table-column label="操作" width="200" fixed="right">
          <template #default="{ row }">
            <el-button link type="primary" size="small" @click="viewDetail(row.id)">
              详情
            </el-button>
            <el-button
              v-if="row.status === 'PENDING'"
              link
              type="success"
              size="small"
              @click="handlePay(row)"
            >
              支付
            </el-button>
            <el-button
              v-if="canCancel(row.status)"
              link
              type="danger"
              size="small"
              @click="handleCancel(row)"
            >
              取消
            </el-button>
          </template>
        </el-table-column>
      </el-table>

      <el-pagination
        v-model:current-page="queryForm.page"
        v-model:page-size="queryForm.size"
        :page-sizes="[10, 20, 50, 100]"
        :total="total"
        layout="total, sizes, prev, pager, next, jumper"
        background
        @size-change="fetchOrders"
        @current-change="fetchOrders"
      />
    </div>

    <!-- Create Order Dialog -->
    <el-dialog
      v-model="dialogVisible"
      title="创建订单"
      width="460px"
      destroy-on-close
    >
      <el-form ref="formRef" :model="orderForm" :rules="formRules" label-width="90px">
        <el-form-item label="用户 ID" prop="userId">
          <el-input-number
            v-model="orderForm.userId"
            :min="1"
            placeholder="请输入用户ID"
            style="width: 100%"
          />
        </el-form-item>
        <el-form-item label="订单金额" prop="totalAmount">
          <el-input-number
            v-model="orderForm.totalAmount"
            :min="0.01"
            :precision="2"
            :step="1"
            placeholder="请输入金额"
            style="width: 100%"
          />
        </el-form-item>
        <el-form-item label="备注" prop="remark">
          <el-input
            v-model="orderForm.remark"
            type="textarea"
            :rows="3"
            placeholder="可选备注信息"
            :maxlength="500"
            show-word-limit
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button
          type="primary"
          :loading="submitting"
          :disabled="orderCreateLimited"
          @click="handleCreateOrder"
        >
          <template v-if="orderCreateLimited">
            <el-icon class="is-loading"><Timer /></el-icon>
            请 {{ orderCreateCountdown }} 秒后重试
          </template>
          <template v-else>
            创建订单
          </template>
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Plus, Search, Refresh, Timer } from '@element-plus/icons-vue'
import type { FormInstance, FormRules } from 'element-plus'
import dayjs from 'dayjs'
import { useOrderApi } from '@/api/orders'
import { useRateLimit } from '@/composables/useRateLimit'
import type { Order, OrderStatus } from '@/types'

const route = useRoute()
const router = useRouter()
const { getOrders, createOrder, payOrder, cancelOrder } = useOrderApi()

// 订单创建防重复提交（对应后端 Redisson 分布式锁：同一用户5秒内禁止重复提交）
const { isLimited: orderCreateLimited, countdown: orderCreateCountdown, startCountdown: startOrderLock } = useRateLimit()

const loading = ref(false)
const submitting = ref(false)
const dialogVisible = ref(false)
const orders = ref<Order[]>([])
const total = ref(0)

const queryForm = reactive({
  userId: undefined as number | undefined,
  status: '' as OrderStatus | '',
  page: 1,
  size: 20,
})

// Pre-fill userId from URL query param
if (route.query.userId) {
  queryForm.userId = Number(route.query.userId)
}

const orderForm = reactive({
  userId: undefined as number | undefined,
  totalAmount: undefined as number | undefined,
  remark: '',
})

const formRef = ref<FormInstance>()

const formRules: FormRules = {
  userId: [{ required: true, message: '请输入用户ID', trigger: 'blur' }],
  totalAmount: [{ required: true, message: '请输入订单金额', trigger: 'blur' }],
}

const orderStatusMap: Record<string, string> = {
  PENDING: '待支付', PAID: '已支付', SHIPPED: '已发货', COMPLETED: '已完成', CANCELLED: '已取消'
}

const orderStatuses = [
  { label: '待支付', value: 'PENDING' },
  { label: '已支付', value: 'PAID' },
  { label: '已发货', value: 'SHIPPED' },
  { label: '已完成', value: 'COMPLETED' },
  { label: '已取消', value: 'CANCELLED' },
]

const statusTabs = [
  { label: '全部', value: '', color: '#909399' },
  { label: '待支付', value: 'PENDING', color: '#E6A23C' },
  { label: '已支付', value: 'PAID', color: '#409EFF' },
  { label: '已发货', value: 'SHIPPED', color: '#909399' },
  { label: '已完成', value: 'COMPLETED', color: '#67C23A' },
  { label: '已取消', value: 'CANCELLED', color: '#F56C6C' },
]

function getStatusType(status: string) {
  const map: Record<string, string> = {
    PENDING: 'warning', PAID: 'primary', SHIPPED: 'info', COMPLETED: 'success', CANCELLED: 'danger'
  }
  return (map[status] || 'info') as 'warning' | 'primary' | 'info' | 'success' | 'danger'
}

function canCancel(status: string) {
  return status !== 'COMPLETED' && status !== 'CANCELLED'
}

function formatDate(d: string) {
  return dayjs(d).format('YYYY-MM-DD HH:mm')
}

async function fetchOrders() {
  loading.value = true
  try {
    const params: Record<string, unknown> = {
      page: queryForm.page,
      size: queryForm.size,
    }
    if (queryForm.userId) params.userId = queryForm.userId
    if (queryForm.status) params.status = queryForm.status

    const res = await getOrders(params as Parameters<typeof getOrders>[0])
    orders.value = res.records
    total.value = res.total
  } finally {
    loading.value = false
  }
}

function handleSearch() {
  queryForm.page = 1
  fetchOrders()
}

function handleReset() {
  queryForm.userId = undefined
  queryForm.status = ''
  queryForm.page = 1
  fetchOrders()
}

function quickFilter(status: OrderStatus | '') {
  queryForm.status = status
  queryForm.page = 1
  fetchOrders()
}

function viewDetail(id: number) {
  router.push(`/orders/${id}`)
}

function openCreateDialog() {
  Object.assign(orderForm, { userId: undefined, totalAmount: undefined, remark: '' })
  dialogVisible.value = true
}

async function handleCreateOrder() {
  if (orderCreateLimited.value) return
  if (!formRef.value) return
  const valid = await formRef.value.validate().catch(() => false)
  if (!valid) return

  submitting.value = true
  try {
    await createOrder({
      userId: orderForm.userId!,
      totalAmount: orderForm.totalAmount!,
      remark: orderForm.remark || undefined,
    })
    ElMessage.success('订单创建成功')
    dialogVisible.value = false
    fetchOrders()
  } catch (err: unknown) {
    // 后端 Redisson 分布式锁触发：同一用户5秒内禁止重复提交
    if ((err as { isRateLimit?: boolean })?.isRateLimit) {
      startOrderLock(5)
    }
  } finally {
    submitting.value = false
  }
}

async function handlePay(order: Order) {
  await ElMessageBox.confirm(
    `确定要支付订单 ${order.orderNo} 吗？金额：¥${Number(order.totalAmount).toFixed(2)}`,
    '确认支付',
    { type: 'warning', confirmButtonText: '确认支付' }
  )
  await payOrder(order.id)
  ElMessage.success('订单支付成功')
  fetchOrders()
}

async function handleCancel(order: Order) {
  await ElMessageBox.confirm(
    `确定要取消订单 ${order.orderNo} 吗？此操作不可撤销。`,
    '确认取消',
    { type: 'error', confirmButtonText: '确认取消' }
  )
  await cancelOrder(order.id)
  ElMessage.success('订单已取消')
  fetchOrders()
}

onMounted(fetchOrders)
</script>

<style scoped>
.order-list-page {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 12px;
}

.filter-card {
  padding: 16px 20px 0;
}

.status-tabs {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.status-tab {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 6px 16px;
  border-radius: 20px;
  cursor: pointer;
  background: var(--bg-card);
  border: 1px solid var(--border-color);
  font-size: 13px;
  color: var(--text-regular);
  transition: var(--transition);
}

.status-tab:hover {
  border-color: var(--primary);
  color: var(--primary);
}

.status-tab.active {
  background: var(--primary-light);
  border-color: var(--primary);
  color: var(--primary);
  font-weight: 600;
}

.tab-dot {
  width: 7px;
  height: 7px;
  border-radius: 50%;
  flex-shrink: 0;
}

.amount {
  color: var(--danger);
  font-weight: 600;
}
</style>
