<template>
  <div class="mall-home">
    <!-- Hero Banner -->
    <section class="hero">
      <div class="hero-glow glow-1"></div>
      <div class="hero-glow glow-2"></div>
      <div class="hero-content">
        <h1 class="hero-title">LinkForge 品质好物</h1>
        <p class="hero-sub">精选商品 · 限时秒杀 · 一站式购物体验</p>
        <div class="hero-actions">
          <el-button type="primary" size="large" round @click="$router.push('/mall/seckill')">
            去秒杀
          </el-button>
          <el-button size="large" round plain class="hero-btn-plain" @click="scrollToProducts">
            逛商品
          </el-button>
        </div>
      </div>
    </section>

    <!-- Seckill Zone -->
    <section class="home-section">
      <div class="section-header">
        <h2 class="section-title">
          <el-icon color="var(--danger)"><Clock /></el-icon>
          限时秒杀
        </h2>
        <el-button link type="danger" @click="$router.push('/mall/seckill')">查看全部 →</el-button>
      </div>

      <div v-if="seckillLoading" v-loading="seckillLoading" class="seckill-grid seckill-loading" />
      <template v-else-if="seckillActs.length > 0">
        <div class="seckill-grid">
          <div
            v-for="act in seckillActs"
            :key="act.id"
            class="app-card seckill-card"
          >
            <div class="seckill-badge">秒杀</div>
            <div class="seckill-name">{{ act.name }}</div>
            <div class="seckill-price">
              <span class="price-symbol">¥</span>
              <span class="price-value">{{ formatAmountPlain(act.seckillPrice) }}</span>
              <span class="price-origin">{{ formatAmount(act.seckillPrice * 2) }}</span>
            </div>
            <div class="seckill-meta">
              剩余 <b>{{ act.availableStock }}</b> / {{ act.totalStock }} 件
            </div>
            <div class="seckill-meta">{{ countdownText(act.endTime) }}</div>
            <el-button type="danger" round class="seckill-btn" @click="$router.push('/mall/seckill')">
              立即抢购
            </el-button>
          </div>
        </div>
      </template>
      <template v-else>
        <EmptyState description="暂无进行中的秒杀活动" />
      </template>
    </section>

    <!-- Product Grid -->
    <section id="products" class="home-section">
      <div class="section-header">
        <h2 class="section-title">
          <el-icon color="var(--primary)"><Goods /></el-icon>
          精选商品
        </h2>
      </div>

      <div v-if="productsLoading" v-loading="productsLoading" class="product-grid product-loading" />
      <template v-else-if="products.length > 0">
        <div class="product-grid">
          <div
            v-for="p in products"
            :key="p.id"
            class="app-card product-card"
          >
            <div class="product-thumb">
              <ProductImage :src="p.imageUrl" :size="160" />
            </div>
            <div class="product-info">
              <div class="product-name" :title="p.name">{{ p.name }}</div>
              <div class="product-price">{{ formatAmount(p.price) }}</div>
              <div class="product-meta">库存 {{ p.stock }} 件</div>
              <el-button type="primary" round class="buy-btn" @click="buyNow(p)">
                立即购买
              </el-button>
            </div>
          </div>
        </div>
      </template>
      <template v-else>
        <EmptyState description="暂无在售商品" />
      </template>
    </section>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import dayjs from 'dayjs'
import { Clock, Goods } from '@element-plus/icons-vue'
import EmptyState from '@/components/EmptyState.vue'
import ProductImage from '@/components/ProductImage.vue'
import { useProductApi } from '@/api/products'
import { useSeckillApi } from '@/api/seckill'
import { formatAmount, formatAmountPlain } from '@/utils/format'
import type { Product, SeckillActivity } from '@/types'

const router = useRouter()
const { getProducts } = useProductApi()
const { listActivities } = useSeckillApi()

const productsLoading = ref(false)
const seckillLoading = ref(false)
const products = ref<Product[]>([])
const seckillActs = ref<SeckillActivity[]>([])

/** 秒杀倒计时（简单展示：剩余 X天X小时 / X小时X分 / 已结束） */
function countdownText(endTime: string): string {
  const diffMs = dayjs(endTime).diff(dayjs())
  if (diffMs <= 0) return '已结束'
  const diffMin = Math.floor(diffMs / 60000)
  if (diffMin <= 0) return '即将开始'
  const days = Math.floor(diffMin / (60 * 24))
  const hours = Math.floor((diffMin % (60 * 24)) / 60)
  const mins = diffMin % 60
  if (days > 0) return `距结束 ${days}天${hours}小时`
  if (hours > 0) return `距结束 ${hours}小时${mins}分`
  return `距结束 ${mins}分钟`
}

async function fetchData() {
  seckillLoading.value = true
  productsLoading.value = true
  try {
    const [acts, prods] = await Promise.all([
      listActivities(),
      getProducts({ status: 'ON_SALE', page: 1, size: 12 }),
    ])
    seckillActs.value = acts.slice(0, 3)
    products.value = prods.records
  } catch {
    seckillActs.value = []
    products.value = []
  } finally {
    seckillLoading.value = false
    productsLoading.value = false
  }
}

/** 立即购买：跳 /mall/orders?productId=N，创建订单弹窗按 query 预选商品 */
function buyNow(p: Product) {
  router.push({ path: '/mall/orders', query: { productId: p.id } })
}

function scrollToProducts() {
  document.getElementById('products')?.scrollIntoView({ behavior: 'smooth' })
}

onMounted(fetchData)
</script>

<style scoped>
.mall-home {
  display: flex;
  flex-direction: column;
  gap: 32px;
}

/* Hero */
.hero {
  position: relative;
  background: var(--gradient-brand);
  border-radius: var(--radius-lg);
  padding: 56px 40px;
  overflow: hidden;
  color: #fff;
}

.hero-glow {
  position: absolute;
  border-radius: 50%;
  background: radial-gradient(circle, rgba(255, 255, 255, 0.25), transparent);
  pointer-events: none;
}

.glow-1 {
  width: 320px;
  height: 320px;
  top: -120px;
  right: 10%;
}

.glow-2 {
  width: 220px;
  height: 220px;
  bottom: -90px;
  left: 15%;
}

.hero-content {
  position: relative;
  z-index: 1;
}

.hero-title {
  font-size: 34px;
  font-weight: 800;
  margin: 0 0 10px;
}

.hero-sub {
  font-size: 15px;
  color: rgba(255, 255, 255, 0.85);
  margin: 0 0 28px;
}

.hero-actions {
  display: flex;
  gap: 12px;
}

.hero-btn-plain {
  border-color: rgba(255, 255, 255, 0.6) !important;
  color: #fff !important;
  background: transparent !important;
}

/* Section */
.home-section {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.section-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.section-title {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 20px;
  font-weight: 700;
  color: var(--text-primary);
  margin: 0;
}

/* Seckill Grid */
.seckill-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
  gap: 16px;
}

.seckill-loading,
.product-loading {
  min-height: 160px;
}

.seckill-card {
  position: relative;
  padding: 20px;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.seckill-badge {
  position: absolute;
  top: 0;
  right: 0;
  background: var(--danger);
  color: #fff;
  font-size: 12px;
  font-weight: 600;
  padding: 4px 14px;
  border-radius: 0 var(--radius-md) 0 var(--radius-md);
}

.seckill-name {
  font-size: 15px;
  font-weight: 600;
  color: var(--text-primary);
  min-height: 40px;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.seckill-price {
  display: flex;
  align-items: baseline;
  gap: 6px;
}

.price-symbol {
  color: var(--danger);
  font-size: 14px;
  font-weight: 700;
}

.price-value {
  color: var(--danger);
  font-size: 28px;
  font-weight: 800;
}

.price-origin {
  color: var(--text-secondary);
  font-size: 13px;
  text-decoration: line-through;
}

.seckill-meta {
  font-size: 13px;
  color: var(--text-secondary);
}

.seckill-meta b {
  color: var(--danger);
}

.seckill-btn {
  margin-top: 6px;
}

/* Product Grid */
.product-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
  gap: 16px;
}

.product-card {
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 12px;
  transition: var(--transition);
}

.product-card:hover {
  box-shadow: var(--shadow-md);
  transform: translateY(-2px);
}

.product-thumb {
  display: flex;
  justify-content: center;
  border-radius: var(--radius-md);
  overflow: hidden;
}

.product-info {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.product-name {
  font-size: 14px;
  font-weight: 600;
  color: var(--text-primary);
  min-height: 40px;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.product-price {
  color: var(--danger);
  font-size: 20px;
  font-weight: 700;
}

.product-meta {
  font-size: 12px;
  color: var(--text-secondary);
}

.buy-btn {
  margin-top: 6px;
  width: 100%;
}

@media (max-width: 768px) {
  .hero {
    padding: 36px 24px;
  }

  .hero-title {
    font-size: 26px;
  }
}
</style>
