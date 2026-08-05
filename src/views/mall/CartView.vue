<template>
  <div class="cart-page">
    <PageHeader title="购物车">
      <template #actions>
        <el-button :icon="Refresh" @click="fetchCart">刷新</el-button>
      </template>
    </PageHeader>

    <div class="app-card">
      <template v-if="!loading && cartItems.length === 0">
        <EmptyState description="购物车还是空的，去商城逛逛吧">
          <el-button type="primary" @click="router.push('/mall/home')">去逛逛</el-button>
        </EmptyState>
      </template>

      <template v-else>
        <el-table
          v-loading="loading"
          :data="cartItems"
          stripe
          row-key="id"
          @selection-change="onSelectionChange"
        >
          <el-table-column type="selection" width="50" />
          <el-table-column label="商品" min-width="220">
            <template #default="{ row }">
              <div class="cart-product">
                <ProductImage :src="row.imageUrl" :size="52" />
                <div class="cart-product-name" :title="row.productName">{{ row.productName }}</div>
              </div>
            </template>
          </el-table-column>
          <el-table-column label="单价" width="110">
            <template #default="{ row }">
              <span class="amount">{{ formatAmount(row.price) }}</span>
            </template>
          </el-table-column>
          <el-table-column label="数量" width="150">
            <template #default="{ row }">
              <el-input-number
                v-model="row.quantity"
                :min="1"
                :max="999"
                size="small"
                @change="(val: number | undefined) => handleQuantityChange(row, val ?? 1)"
              />
            </template>
          </el-table-column>
          <el-table-column label="小计" width="120">
            <template #default="{ row }">
              <span class="amount strong">{{ formatAmount(row.subtotal) }}</span>
            </template>
          </el-table-column>
          <el-table-column label="操作" width="80" align="center">
            <template #default="{ row }">
              <el-button link type="danger" size="small" @click="handleRemove(row)">删除</el-button>
            </template>
          </el-table-column>
        </el-table>

        <div class="cart-footer">
          <div class="cart-summary">
            <span class="summary-label">
              已选 <b class="primary-text">{{ selectedIds.length }}</b> 种商品
            </span>
            <span class="summary-label">
              合计：<span class="amount strong lg">{{ formatAmount(selectedTotal) }}</span>
            </span>
            <el-button
              type="primary"
              size="large"
              class="checkout-btn"
              :disabled="selectedIds.length === 0"
              @click="goCheckout"
            >
              去结算
            </el-button>
          </div>
        </div>
      </template>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Refresh } from '@element-plus/icons-vue'
import PageHeader from '@/components/PageHeader.vue'
import EmptyState from '@/components/EmptyState.vue'
import ProductImage from '@/components/ProductImage.vue'
import { useCartApi } from '@/api/cart'
import { formatAmount } from '@/utils/format'
import type { CartItemResponse } from '@/types'

const router = useRouter()
const { getCart, updateQuantity, removeItem } = useCartApi()

const loading = ref(false)
const cartItems = ref<CartItemResponse[]>([])
const selectedRows = ref<CartItemResponse[]>([])

const selectedIds = computed(() => selectedRows.value.map((r) => r.id))
const selectedTotal = computed(() =>
  selectedRows.value.reduce((sum, r) => sum + r.price * r.quantity, 0)
)

async function fetchCart() {
  loading.value = true
  try {
    cartItems.value = await getCart()
  } catch {
    cartItems.value = []
  } finally {
    loading.value = false
  }
}

function onSelectionChange(rows: CartItemResponse[]) {
  selectedRows.value = rows
}

async function handleQuantityChange(row: CartItemResponse, val: number) {
  try {
    await updateQuantity(row.id, val)
    row.subtotal = row.price * val
  } catch {
    await fetchCart() // 失败回滚为服务端状态
  }
}

async function handleRemove(row: CartItemResponse) {
  await ElMessageBox.confirm(`确定从购物车移除「${row.productName}」吗？`, '移除商品', {
    type: 'warning',
    confirmButtonText: '移除',
    cancelButtonText: '保留',
  })
  await removeItem(row.id)
  ElMessage.success('已移除')
  await fetchCart()
}

function goCheckout() {
  router.push({ path: '/mall/checkout', query: { from: 'cart', ids: selectedIds.value.join(',') } })
}

onMounted(fetchCart)
</script>

<style scoped>
.cart-product {
  display: flex;
  align-items: center;
  gap: 12px;
}

.cart-product-name {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  max-width: 260px;
}

.cart-footer {
  margin-top: 16px;
  padding-top: 16px;
  border-top: 1px solid var(--border-color, rgba(128, 128, 128, 0.2));
}

.cart-summary {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 20px;
}

.summary-label {
  font-size: 14px;
  color: var(--text-secondary, #666);
}

.checkout-btn {
  min-width: 140px;
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
