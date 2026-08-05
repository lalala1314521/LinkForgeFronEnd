<template>
  <div class="checkout-page">
    <PageHeader title="结算确认" :back="true" />

    <template v-if="!loading">
      <!-- 商品清单 -->
      <div class="app-card">
        <h3 class="section-title">商品清单</h3>
        <template v-if="items.length === 0">
          <EmptyState description="没有可结算的商品">
            <el-button type="primary" @click="router.push('/mall/home')">去商城逛逛</el-button>
          </EmptyState>
        </template>
        <template v-else>
          <div v-for="row in items" :key="row.productId" class="checkout-item">
            <ProductImage :src="row.imageUrl" :size="52" />
            <div class="item-name" :title="row.productName">{{ row.productName }}</div>
            <div class="item-price">{{ formatAmount(row.price) }} × {{ row.quantity }}</div>
            <div class="item-subtotal amount strong">{{ formatAmount(row.price * row.quantity) }}</div>
          </div>
        </template>
      </div>

      <!-- 优惠券 -->
      <div class="app-card">
        <h3 class="section-title">优惠券</h3>
        <el-select v-model="couponId" placeholder="不使用优惠券" clearable style="width: 100%">
          <el-option
            v-for="c in usableCoupons"
            :key="c.id"
            :value="c.id"
            :label="`${c.name}（满 ${formatAmount(c.minAmount)} 减 ${formatAmount(c.discount)}）`"
            :disabled="totalAmount < c.minAmount"
          />
        </el-select>
        <div v-if="selectedCoupon" class="coupon-tip">
          预估优惠 <b class="primary-text">-{{ formatAmount(selectedCoupon.discount) }}</b>
          （最终金额以服务端计算为准）
        </div>
      </div>

      <!-- 金额汇总 -->
      <div class="app-card summary-card">
        <div class="summary-row">
          <span>商品合计</span>
          <span class="amount">{{ formatAmount(totalAmount) }}</span>
        </div>
        <div v-if="selectedCoupon" class="summary-row">
          <span>优惠券抵扣</span>
          <span class="amount discount">-{{ formatAmount(selectedCoupon.discount) }}</span>
        </div>
        <div class="summary-row total-row">
          <span>应付（服务端核算）</span>
          <span class="amount strong lg">{{ formatAmount(estimatePay) }}</span>
        </div>
      </div>

      <div class="checkout-actions">
        <el-button size="large" @click="router.back()">返回</el-button>
        <el-button
          type="primary"
          size="large"
          class="submit-btn"
          :loading="submitting"
          :disabled="items.length === 0"
          @click="handleSubmit"
        >
          提交订单
        </el-button>
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import PageHeader from '@/components/PageHeader.vue'
import EmptyState from '@/components/EmptyState.vue'
import ProductImage from '@/components/ProductImage.vue'
import { useCartApi } from '@/api/cart'
import { useProductApi } from '@/api/products'
import { useCouponApi } from '@/api/coupons'
import { useOrderApi } from '@/api/orders'
import { formatAmount } from '@/utils/format'
import type { Product, CartItemResponse, UserCoupon } from '@/types'

interface CheckoutItem {
  productId: number
  productName: string
  imageUrl?: string
  price: number
  quantity: number
}

const route = useRoute()
const router = useRouter()
const { getCart, removeItem } = useCartApi()
const { getProducts } = useProductApi()
const { myCoupons } = useCouponApi()
const { createOrder } = useOrderApi()

const loading = ref(true)
const submitting = ref(false)
const items = ref<CheckoutItem[]>([])
const couponId = ref<number | null>(null)
const usableCoupons = ref<UserCoupon[]>([])

const totalAmount = computed(() => items.value.reduce((sum, i) => sum + i.price * i.quantity, 0))
const selectedCoupon = computed(() =>
  usableCoupons.value.find((c) => c.id === couponId.value) ?? null
)
/** 前端预估应付（服务端最终核算为准） */
const estimatePay = computed(() => {
  const total = totalAmount.value
  if (!selectedCoupon.value || total < selectedCoupon.value.minAmount) return total
  return Math.max(0, total - selectedCoupon.value.discount)
})

/** 结算来源：from=cart&ids=1,2,3（购物车）或 productId=1&qty=1（立即购买） */
async function loadItems() {
  const from = route.query.from
  if (from === 'cart') {
    const ids = String(route.query.ids ?? '')
      .split(',')
      .filter(Boolean)
      .map(Number)
    const cart = await getCart()
    const selected = cart.filter((c: CartItemResponse) => ids.includes(c.id))
    items.value = selected.map((c: CartItemResponse) => ({
      productId: c.productId,
      productName: c.productName,
      imageUrl: c.imageUrl,
      price: c.price,
      quantity: c.quantity,
    }))
  } else {
    const productId = Number(route.query.productId)
    const qty = Number(route.query.qty ?? 1)
    if (productId) {
      const res = await getProducts({ page: 1, size: 100 })
      const p = res.records.find((x: Product) => x.id === productId)
      if (p) {
        items.value = [{ productId: p.id, productName: p.name, imageUrl: p.imageUrl, price: p.price, quantity: qty }]
      }
    }
  }
}

async function loadCoupons() {
  try {
    usableCoupons.value = (await myCoupons('UNUSED')) ?? []
  } catch {
    usableCoupons.value = []
  }
}

async function handleSubmit() {
  if (items.value.length === 0) return
  submitting.value = true
  try {
    const payload = {
      items: items.value.map((i) => ({ productId: i.productId, quantity: i.quantity })),
    } as { items: { productId: number; quantity: number }[]; couponId?: number }
    if (couponId.value) payload.couponId = couponId.value

    const orderId = await createOrder(payload)

    // 购物车结算：移除已结算条目
    if (route.query.from === 'cart') {
      const ids = String(route.query.ids ?? '')
        .split(',')
        .filter(Boolean)
        .map(Number)
      const cart = await getCart()
      for (const c of cart) {
        if (ids.includes(c.id)) await removeItem(c.id)
      }
    }

    ElMessage.success('订单创建成功')
    router.push(`/mall/orders/${orderId}`)
  } catch {
    // 错误提示已由 request 拦截器统一处理
  } finally {
    submitting.value = false
  }
}

onMounted(async () => {
  try {
    await Promise.all([loadItems(), loadCoupons()])
  } finally {
    loading.value = false
  }
})
</script>

<style scoped>
.section-title {
  margin: 0 0 12px;
  font-size: 15px;
  font-weight: 600;
}

.checkout-item {
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 10px 0;
  border-bottom: 1px solid var(--border-color, rgba(128, 128, 128, 0.15));
}

.checkout-item:last-child {
  border-bottom: none;
}

.item-name {
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.item-price {
  color: var(--text-secondary, #666);
  font-size: 13px;
}

.item-subtotal {
  width: 100px;
  text-align: right;
}

.coupon-tip {
  margin-top: 10px;
  font-size: 13px;
  color: var(--text-secondary, #666);
}

.summary-card {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.summary-row {
  display: flex;
  justify-content: space-between;
  font-size: 14px;
}

.total-row {
  border-top: 1px dashed var(--border-color, rgba(128, 128, 128, 0.2));
  padding-top: 10px;
  font-weight: 600;
}

.discount {
  color: #f56c6c;
}

.checkout-actions {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  margin-top: 16px;
}

.submit-btn {
  min-width: 160px;
}

.amount.strong {
  font-weight: 600;
}

.amount.lg {
  font-size: 20px;
}

.primary-text {
  color: var(--primary, #4f6bff);
}
</style>
