<template>
  <div class="order-list-page">
    <el-tabs v-model="activeTab" class="order-tabs">
      <!-- ============ 订单列表 ============ -->
      <el-tab-pane label="订单列表" name="orders">
        <!-- Page Header -->
        <PageHeader title="订单管理">
          <template #actions>
            <el-tag type="info" round>共 {{ total }} 笔订单</el-tag>
            <el-button v-if="authStore.isAdmin" type="primary" :icon="Plus" @click="openCreateDialog">
              创建订单
            </el-button>
          </template>
        </PageHeader>

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

        <!-- Status Quick Filter Tabs (component language) -->
        <el-radio-group v-model="queryForm.status" class="status-tabs" @change="quickFilter">
          <el-radio-button v-for="tab in statusTabs" :key="tab.value" :value="tab.value">
            {{ tab.label }}
          </el-radio-button>
        </el-radio-group>

        <!-- Table -->
        <div class="app-card">
          <template v-if="!loading && orders.length === 0">
            <EmptyState description="暂无订单数据" />
          </template>
          <template v-else>
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
                  <el-tag size="small" style="cursor:pointer" @click="$router.push(`/users/${row.userId}`)">
                    #{{ row.userId }}
                  </el-tag>
                </template>
              </el-table-column>

              <el-table-column prop="finalAmount" label="实付金额" width="130">
                <template #default="{ row }">
                  <span class="amount">{{ formatAmount(row.finalAmount ?? row.totalAmount) }}</span>
                </template>
              </el-table-column>

              <el-table-column prop="status" label="状态" width="110">
                <template #default="{ row }">
                  <StatusTag :status="row.status" :map="ORDER_STATUS" size="small" />
                </template>
              </el-table-column>

              <el-table-column prop="remark" label="备注" min-width="150">
                <template #default="{ row }">
                  <span class="text-secondary">{{ row.remark || '—' }}</span>
                </template>
              </el-table-column>

              <el-table-column prop="createdAt" label="创建时间" width="170">
                <template #default="{ row }">{{ formatDate(row.createdAt) }}</template>
              </el-table-column>

              <el-table-column label="操作" width="260" fixed="right">
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
                  <el-button
                    v-if="authStore.isAdmin && row.status === 'PAID'"
                    link
                    type="primary"
                    size="small"
                    :loading="shippingId === row.id"
                    @click="handleShipOrder(row)"
                  >
                    发货
                  </el-button>
                  <el-button
                    v-if="row.status === 'SHIPPED'"
                    link
                    type="success"
                    size="small"
                    @click="handleConfirmReceipt(row)"
                  >
                    确认收货
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
          </template>
        </div>
      </el-tab-pane>

      <!-- ============ 我的秒杀 ============ -->
      <el-tab-pane label="我的秒杀" name="seckill">
        <PageHeader title="我的秒杀">
          <template #actions>
            <el-tag type="danger" round>共 {{ mySeckillOrders.length }} 笔秒杀单</el-tag>
            <el-button :icon="Refresh" @click="fetchMySeckill">刷新</el-button>
          </template>
        </PageHeader>

        <div class="app-card">
          <template v-if="!seckillLoading && mySeckillOrders.length === 0">
            <EmptyState description="暂无秒杀订单，快去秒杀专区抢购吧" />
          </template>
          <template v-else>
            <el-table
              v-loading="seckillLoading"
              :data="mySeckillOrders"
              stripe
              row-key="orderNo"
            >
              <el-table-column type="index" label="#" width="60" />

              <el-table-column prop="orderNo" label="秒杀订单号" min-width="180">
                <template #default="{ row }">
                  <span class="mono">{{ row.orderNo }}</span>
                </template>
              </el-table-column>

              <el-table-column prop="activityName" label="活动名称" min-width="160">
                <template #default="{ row }">
                  <span>{{ row.activityName || '—' }}</span>
                </template>
              </el-table-column>

              <el-table-column prop="productName" label="商品名称" min-width="160">
                <template #default="{ row }">
                  <span>{{ row.productName || '—' }}</span>
                </template>
              </el-table-column>

              <el-table-column prop="seckillPrice" label="秒杀价" width="110">
                <template #default="{ row }">
                  <span class="amount">{{ formatAmount(row.seckillPrice) }}</span>
                </template>
              </el-table-column>

              <el-table-column prop="status" label="状态" width="110">
                <template #default="{ row }">
                  <StatusTag :status="row.status" :map="SECKILL_ORDER_STATUS" size="small" />
                </template>
              </el-table-column>

              <el-table-column prop="createdAt" label="创建时间" width="170">
                <template #default="{ row }">{{ formatDate(row.createdAt) }}</template>
              </el-table-column>

              <el-table-column label="操作" width="230" fixed="right">
                <template #default="{ row }">
                  <template v-if="row.status === 'PENDING'">
                    <el-button link type="success" size="small" :loading="seckillActioning === row.orderNo" @click="handleSeckillPay(row)">
                      支付
                    </el-button>
                    <el-button link type="danger" size="small" :disabled="seckillActioning === row.orderNo" @click="handleSeckillCancel(row)">
                      取消
                    </el-button>
                  </template>
                  <template v-else-if="row.status === 'PAID'">
                    <el-button link type="warning" size="small" :loading="seckillActioning === row.orderNo" @click="handleSeckillRefund(row)">
                      退款
                    </el-button>
                  </template>
                  <el-button v-else link type="primary" size="small" @click="viewSeckillDetail(row)">
                    详情
                  </el-button>
                </template>
              </el-table-column>
            </el-table>
          </template>
        </div>
      </el-tab-pane>
    </el-tabs>

    <!-- Create Order Dialog (商品明细 + 可选券 + 备注) -->
    <el-dialog
      v-model="dialogVisible"
      title="创建订单"
      width="560px"
      destroy-on-close
    >
      <el-form ref="formRef" :model="orderForm" :rules="formRules" label-width="90px">
        <el-form-item
          v-for="(row, index) in orderForm.items"
          :key="index"
          :label="index === 0 ? '商品明细' : ''"
          prop="items"
        >
          <div class="item-row">
            <el-select
              v-model="row.productId"
              filterable
              placeholder="选择商品"
              style="flex: 1"
              @change="validateForm"
            >
              <el-option
                v-for="p in productOptions"
                :key="p.id"
                :value="p.id"
                :label="`${p.name}（¥${Number(p.price).toFixed(2)}，库存 ${p.stock}）`"
                :disabled="p.status !== 'ON_SALE'"
              />
            </el-select>
            <el-input-number v-model="row.quantity" :min="1" :max="9999" />
            <el-button
              :icon="Delete"
              circle
              plain
              type="danger"
              size="small"
              :disabled="orderForm.items.length <= 1"
              @click="removeItem(index)"
            />
          </div>
        </el-form-item>
        <el-form-item label=" ">
          <div class="item-toolbar">
            <el-button :icon="Plus" @click="addItem">添加商品</el-button>
            <span class="estimate-text">预估金额：<b class="amount">{{ formatAmount(estimatedAmount) }}</b></span>
          </div>
        </el-form-item>

        <el-form-item label="优惠券" prop="couponId">
          <el-select
            v-model="orderForm.couponId"
            clearable
            placeholder="选择优惠券（可选）"
            style="width: 100%"
          >
            <el-option
              v-for="c in unusedCoupons"
              :key="c.id"
              :value="c.id"
              :label="`${c.name}（减 ¥${Number(c.discount).toFixed(2)}，满 ¥${Number(c.minAmount).toFixed(2)}）`"
            />
          </el-select>
          <div class="coupon-hint">最终金额以服务端结算为准</div>
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

    <!-- 秒杀订单详情弹窗 -->
    <el-dialog
      v-model="seckillDetailVisible"
      title="秒杀订单详情"
      width="460px"
      :close-on-click-modal="false"
    >
      <div v-if="seckillDetail" class="seckill-detail-block">
        <div class="result-status">
          <StatusTag :status="seckillDetail.status" :map="SECKILL_ORDER_STATUS" size="large" />
          <span v-if="seckillDetail.status === 'PENDING'" class="pending-hint">待支付</span>
        </div>
        <div class="result-field">
          <span class="result-label">秒杀订单号</span>
          <span class="result-value mono">{{ seckillDetail.orderNo }}</span>
        </div>
        <div class="result-field">
          <span class="result-label">活动名称</span>
          <span class="result-value">{{ currentSeckillOrder?.activityName || '—' }}</span>
        </div>
        <div class="result-field">
          <span class="result-label">商品名称</span>
          <span class="result-value">{{ currentSeckillOrder?.productName || '—' }}</span>
        </div>
        <div class="result-field">
          <span class="result-label">秒杀价格</span>
          <span class="result-value price">{{ formatAmount(seckillDetail.seckillPrice) }}</span>
        </div>
        <div class="result-field">
          <span class="result-label">订单状态</span>
          <span class="result-value">{{ seckillOrderLabel(seckillDetail.status) }}</span>
        </div>
        <div class="result-field">
          <span class="result-label">创建时间</span>
          <span class="result-value">{{ formatDate(currentSeckillOrder?.createdAt) }}</span>
        </div>
      </div>
      <template #footer>
        <el-button @click="seckillDetailVisible = false">关闭</el-button>
        <el-button
          v-if="seckillDetail && seckillDetail.status === 'PENDING'"
          type="primary"
          :loading="seckillPolling"
          @click="handlePollSeckill"
        >
          查询订单状态
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Plus, Search, Refresh, Timer, Delete } from '@element-plus/icons-vue'
import type { FormInstance, FormRules } from 'element-plus'
import PageHeader from '@/components/PageHeader.vue'
import StatusTag from '@/components/StatusTag.vue'
import EmptyState from '@/components/EmptyState.vue'
import { useAuthStore } from '@/stores/auth'
import { useOrderApi } from '@/api/orders'
import { useProductApi } from '@/api/products'
import { useCouponApi } from '@/api/coupons'
import { useSeckillApi } from '@/api/seckill'
import { useRateLimit } from '@/composables/useRateLimit'
import { ORDER_STATUS, SECKILL_ORDER_STATUS } from '@/constants/statusMaps'
import { formatAmount, formatDate } from '@/utils/format'
import type { Order, OrderStatus, Product, UserCoupon, SeckillOrder, SeckillResult } from '@/types'

const route = useRoute()
const router = useRouter()
const authStore = useAuthStore()
const { getOrders, createOrder, payOrder, cancelOrder, shipOrder, confirmReceipt } = useOrderApi()
const { getProducts } = useProductApi()
const { myCoupons } = useCouponApi()
const { getMyOrders, getOrderStatus, payOrder: paySeckillOrder, cancelOrder: cancelSeckillOrder, refundOrder: refundSeckillOrder } = useSeckillApi()

// 订单创建防重复提交（对应后端 Redisson 分布式锁：同一用户5秒内禁止重复提交）
const { isLimited: orderCreateLimited, countdown: orderCreateCountdown, startCountdown: startOrderLock } = useRateLimit()

const activeTab = ref('orders')

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

// 商品选项（创建订单弹窗用，最多加载 100 条）
const productOptions = ref<Product[]>([])
const unusedCoupons = ref<UserCoupon[]>([])
const loadingOptions = ref(false)

const productMap = computed(() => {
  const m = new Map<number, Product>()
  productOptions.value.forEach(p => m.set(p.id, p))
  return m
})

interface OrderItemRow {
  productId: number | undefined
  quantity: number
}

const orderForm = reactive<{
  items: OrderItemRow[]
  couponId: number | undefined
  remark: string
}>({
  items: [{ productId: undefined, quantity: 1 }],
  couponId: undefined,
  remark: '',
})

const formRef = ref<FormInstance>()

const formRules: FormRules = {
  items: [
    {
      validator: (_rule, value: OrderItemRow[], callback) => {
        if (!value || value.length === 0) {
          callback(new Error('请至少添加一种商品'))
          return
        }
        const invalid = value.some(row => !row.productId)
        if (invalid) {
          callback(new Error('请为每一行选择商品'))
          return
        }
        callback()
      },
      trigger: 'change',
    },
  ],
}

const orderStatuses = [
  { label: '待支付', value: 'PENDING' },
  { label: '已支付', value: 'PAID' },
  { label: '已发货', value: 'SHIPPED' },
  { label: '已完成', value: 'COMPLETED' },
  { label: '已取消', value: 'CANCELLED' },
]

const statusTabs: { label: string; value: OrderStatus | '' }[] = [
  { label: '全部', value: '' },
  { label: '待支付', value: 'PENDING' },
  { label: '已支付', value: 'PAID' },
  { label: '已发货', value: 'SHIPPED' },
  { label: '已完成', value: 'COMPLETED' },
  { label: '已取消', value: 'CANCELLED' },
]

// ============ 我的秒杀 ============
const seckillLoading = ref(false)
const mySeckillOrders = ref<SeckillOrder[]>([])
const seckillDetailVisible = ref(false)
const seckillDetail = ref<SeckillResult | null>(null)
const currentSeckillOrder = ref<SeckillOrder | null>(null)
const seckillPolling = ref(false)

function seckillOrderLabel(status: string) {
  return SECKILL_ORDER_STATUS[status]?.label ?? status
}

async function fetchMySeckill() {
  seckillLoading.value = true
  try {
    mySeckillOrders.value = await getMyOrders()
  } catch {
    mySeckillOrders.value = []
  } finally {
    seckillLoading.value = false
  }
}

/** 秒杀单支付/取消操作中标记（防连点） */
const seckillActioning = ref<string | null>(null)
/** 普通订单发货中标记 */
const shippingId = ref<number | null>(null)

async function handleSeckillPay(order: SeckillOrder) {
  seckillActioning.value = order.orderNo
  try {
    await paySeckillOrder(order.orderNo)
    ElMessage.success('秒杀订单支付成功')
    await fetchMySeckill()
  } catch {
    // 错误提示已由 request 拦截器统一处理
  } finally {
    seckillActioning.value = null
  }
}

async function handleSeckillCancel(order: SeckillOrder) {
  await ElMessageBox.confirm(
    `确定取消秒杀订单「${order.orderNo}」吗？取消后将释放秒杀名额与库存。`,
    '确认取消',
    { type: 'warning', confirmButtonText: '确认取消', cancelButtonText: '再想想' }
  )
  seckillActioning.value = order.orderNo
  try {
    await cancelSeckillOrder(order.orderNo)
    ElMessage.success('秒杀订单已取消，名额已释放')
    await fetchMySeckill()
  } catch {
    // 错误提示已由 request 拦截器统一处理
  } finally {
    seckillActioning.value = null
  }
}

async function handleSeckillRefund(order: SeckillOrder) {
  await ElMessageBox.confirm(
    `确定对秒杀订单「${order.orderNo}」申请退款吗？退款后秒杀名额与库存将释放、积分退回。`,
    '确认退款',
    { type: 'warning', confirmButtonText: '确认退款', cancelButtonText: '再想想' }
  )
  seckillActioning.value = order.orderNo
  try {
    await refundSeckillOrder(order.orderNo)
    ElMessage.success('退款成功，库存与名额已释放')
    await fetchMySeckill()
  } catch {
    // 错误提示已由 request 拦截器统一处理
  } finally {
    seckillActioning.value = null
  }
}

async function handleShipOrder(order: Order) {
  shippingId.value = order.id
  try {
    await shipOrder(order.id)
    ElMessage.success(`订单 ${order.orderNo} 已发货`)
    await fetchOrders()
  } catch {
    // 错误提示已由 request 拦截器统一处理
  } finally {
    shippingId.value = null
  }
}

async function handleConfirmReceipt(order: Order) {
  await ElMessageBox.confirm(
    `确认已收到订单「${order.orderNo}」的商品吗？确认后订单完成。`,
    '确认收货',
    { type: 'warning', confirmButtonText: '确认收货', cancelButtonText: '再等等' }
  )
  try {
    await confirmReceipt(order.id)
    ElMessage.success('确认收货成功，订单已完成')
    await fetchOrders()
  } catch {
    // 错误提示已由 request 拦截器统一处理
  }
}

function viewSeckillDetail(order: SeckillOrder) {
  currentSeckillOrder.value = order
  seckillDetail.value = {
    orderNo: order.orderNo,
    activityId: order.activityId,
    productId: order.productId,
    seckillPrice: order.seckillPrice,
    status: order.status,
  }
  seckillDetailVisible.value = true
}

/** 查询最新秒杀订单状态（异步落库，PENDING -> PAID/FAILED） */
async function handlePollSeckill() {
  if (!seckillDetail.value) return
  seckillPolling.value = true
  try {
    const res = await getOrderStatus(seckillDetail.value.orderNo)
    seckillDetail.value = res
    // 同步列表行状态
    const row = mySeckillOrders.value.find(o => o.orderNo === res.orderNo)
    if (row) row.status = res.status
    if (res.status !== 'PENDING') {
      ElMessage.success(`订单状态已更新：${seckillOrderLabel(res.status)}`)
    }
  } finally {
    seckillPolling.value = false
  }
}

// ============ 订单列表逻辑 ============

/** 前端预估金额 = Σ price × qty（仅预览，最终以服务端结算为准） */
const estimatedAmount = computed(() =>
  orderForm.items.reduce((sum, row) => {
    const p = row.productId ? productMap.value.get(row.productId) : undefined
    return sum + (p ? Number(p.price) * (row.quantity || 0) : 0)
  }, 0)
)

function canCancel(status: string) {
  return status !== 'COMPLETED' && status !== 'CANCELLED'
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

function quickFilter() {
  queryForm.page = 1
  fetchOrders()
}

/** 详情跳转：USER 商城上下文走 /mall/orders/:id，避免被角色守卫弹回 */
function viewDetail(id: number) {
  const base = route.path.startsWith('/mall') ? '/mall/orders' : '/orders'
  router.push(`${base}/${id}`)
}

async function loadProducts() {
  try {
    const res = await getProducts({ page: 1, size: 100 })
    productOptions.value = res.records
  } catch {
    productOptions.value = []
  }
}

async function loadMyCoupons() {
  loadingOptions.value = true
  try {
    unusedCoupons.value = await myCoupons('UNUSED')
  } catch {
    unusedCoupons.value = []
  } finally {
    loadingOptions.value = false
  }
}

/** 打开创建订单弹窗：支持 ?productId=N 预选商品（商城首页「立即购买」跳转） */
async function openCreateDialog() {
  const preselectId = route.query.productId ? Number(route.query.productId) : undefined
  orderForm.items = [{ productId: preselectId || undefined, quantity: 1 }]
  orderForm.couponId = undefined
  orderForm.remark = ''
  dialogVisible.value = true
  if (productOptions.value.length === 0) {
    await loadProducts()
  }
  // 预选商品可能不在已加载列表，补一次精确加载
  if (preselectId && !productMap.value.has(preselectId)) {
    await loadProducts()
  }
  await loadMyCoupons()
}

function addItem() {
  if (orderForm.items.length >= 50) {
    ElMessage.warning('单笔订单最多 50 种商品')
    return
  }
  orderForm.items.push({ productId: undefined, quantity: 1 })
}

function removeItem(index: number) {
  if (orderForm.items.length <= 1) return
  orderForm.items.splice(index, 1)
  validateForm()
}

function validateForm() {
  formRef.value?.validate().catch(() => undefined)
}

async function handleCreateOrder() {
  if (orderCreateLimited.value) return
  if (!formRef.value) return
  const valid = await formRef.value.validate().catch(() => false)
  if (!valid) return

  submitting.value = true
  try {
    const items = orderForm.items
      .filter(row => row.productId !== undefined)
      .map(row => ({ productId: row.productId!, quantity: row.quantity }))

    // Idempotency-Key 请求级幂等（同 key 重复请求返回 1103）
    await createOrder(
      {
        items,
        couponId: orderForm.couponId || undefined,
        remark: orderForm.remark || undefined,
      },
      { headers: { 'Idempotency-Key': crypto.randomUUID() } }
    )
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
    `确定要支付订单 ${order.orderNo} 吗？金额：${formatAmount(order.finalAmount ?? order.totalAmount)}`,
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

onMounted(() => {
  fetchOrders()
  fetchMySeckill()
})
</script>

<style scoped>
.order-list-page {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.order-tabs :deep(.el-tabs__header) {
  margin-bottom: 16px;
}

.filter-card {
  padding: 16px 20px 0;
}

.status-tabs {
  display: flex;
  flex-wrap: wrap;
}

.item-row {
  display: flex;
  align-items: center;
  gap: 8px;
  width: 100%;
}

.item-toolbar {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
}

.estimate-text {
  font-size: 13px;
  color: var(--text-secondary);
}

.coupon-hint {
  font-size: 12px;
  color: var(--text-secondary);
  line-height: 1.4;
  margin-top: 4px;
}

.amount {
  color: var(--danger);
  font-weight: 600;
}

.text-secondary {
  color: var(--text-secondary);
}

.mono {
  font-family: monospace;
  font-size: 12px;
}

/* Seckill Detail Dialog */
.seckill-detail-block {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.result-status {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 4px;
}

.pending-hint {
  font-size: 12px;
  color: var(--warning);
  font-weight: 600;
}

.result-field {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 14px;
}

.result-label {
  color: var(--text-secondary);
}

.result-value {
  font-weight: 500;
  color: var(--text-primary);
}

.result-value.mono {
  font-family: monospace;
  font-size: 12px;
}

.result-value.price {
  color: var(--danger);
  font-weight: 700;
}
</style>
