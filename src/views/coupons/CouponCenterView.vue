<template>
  <div class="coupon-center-page">
    <PageHeader title="优惠券中心">
      <template #actions>
        <el-tag type="info" round>可领 {{ availableCoupons.length }} 张</el-tag>
      </template>
    </PageHeader>

    <el-tabs v-model="activeTab">
      <!-- 可领取列表 -->
      <el-tab-pane label="可领取" name="available">
        <div v-loading="loadingAvailable" class="coupon-list">
          <template v-if="!loadingAvailable && availableCoupons.length === 0">
            <EmptyState description="暂无可领取的优惠券" />
          </template>
          <template v-else>
            <div v-for="c in availableCoupons" :key="c.id" class="app-card coupon-card">
              <div class="coupon-main">
                <div class="coupon-value">
                  <span class="coupon-currency">¥</span>
                  <span class="coupon-number">{{ Number(c.discount).toFixed(2) }}</span>
                </div>
                <div class="coupon-info">
                  <div class="coupon-name">{{ c.name }}</div>
                  <div class="coupon-meta">
                    满 {{ formatAmount(c.minAmount) }} 可用 · 已领 {{ c.usedCount }}/{{ c.totalCount }} 张
                  </div>
                  <div class="coupon-meta">有效期至 {{ formatDate(c.expireAt) }}</div>
                </div>
                <el-button
                  type="primary"
                  round
                  :loading="claimingId === c.id"
                  :disabled="c.usedCount >= c.totalCount"
                  @click="handleClaim(c)"
                >
                  {{ c.usedCount >= c.totalCount ? '已领完' : '立即领取' }}
                </el-button>
              </div>
            </div>
          </template>
        </div>
      </el-tab-pane>

      <!-- 我的优惠券 -->
      <el-tab-pane label="我的优惠券" name="mine">
        <div class="app-card mine-filter">
          <el-radio-group v-model="mineStatus" @change="fetchMyCoupons">
            <el-radio-button value="">全部</el-radio-button>
            <el-radio-button value="UNUSED">未使用</el-radio-button>
            <el-radio-button value="FROZEN">使用中</el-radio-button>
            <el-radio-button value="USED">已使用</el-radio-button>
            <el-radio-button value="EXPIRED">已过期</el-radio-button>
          </el-radio-group>
        </div>

        <div v-loading="loadingMine" class="coupon-list">
          <template v-if="!loadingMine && myCouponList.length === 0">
            <EmptyState description="暂无优惠券" />
          </template>
          <template v-else>
            <div v-for="c in myCouponList" :key="c.id" class="app-card coupon-card mine-card">
              <div class="coupon-main">
                <div class="coupon-value">
                  <span class="coupon-currency">¥</span>
                  <span class="coupon-number">{{ Number(c.discount).toFixed(2) }}</span>
                </div>
                <div class="coupon-info">
                  <div class="coupon-name">{{ c.name }}</div>
                  <div class="coupon-meta">
                    满 {{ formatAmount(c.minAmount) }} 可用 · 有效期至 {{ formatDate(c.expireAt) }}
                  </div>
                  <div v-if="c.orderNo" class="coupon-meta">关联订单：{{ c.orderNo }}</div>
                </div>
                <StatusTag :status="c.status" :map="COUPON_STATUS" />
              </div>
            </div>
          </template>
        </div>
      </el-tab-pane>
    </el-tabs>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import PageHeader from '@/components/PageHeader.vue'
import StatusTag from '@/components/StatusTag.vue'
import EmptyState from '@/components/EmptyState.vue'
import { useCouponApi } from '@/api/coupons'
import { COUPON_STATUS } from '@/constants/statusMaps'
import { formatAmount, formatDate } from '@/utils/format'
import type { CouponTemplate, UserCoupon, UserCouponStatus } from '@/types'

const { listAvailable, claim, myCoupons } = useCouponApi()

const activeTab = ref('available')
const loadingAvailable = ref(false)
const loadingMine = ref(false)
const availableCoupons = ref<CouponTemplate[]>([])
const myCouponList = ref<UserCoupon[]>([])
const claimingId = ref<number | null>(null)

// 我的券状态筛选（'' = 全部）
const mineStatus = ref<UserCouponStatus | ''>('')

async function fetchAvailable() {
  loadingAvailable.value = true
  try {
    availableCoupons.value = await listAvailable()
  } catch {
    availableCoupons.value = []
  } finally {
    loadingAvailable.value = false
  }
}

async function fetchMyCoupons() {
  loadingMine.value = true
  try {
    myCouponList.value = await myCoupons(mineStatus.value)
  } catch {
    myCouponList.value = []
  } finally {
    loadingMine.value = false
  }
}

async function handleClaim(coupon: CouponTemplate) {
  if (claimingId.value !== null) return
  claimingId.value = coupon.id
  try {
    await claim(coupon.id)
    ElMessage.success(`领取成功：${coupon.name}`)
    // 刷新可领列表（数量变化）与我的券
    await Promise.all([fetchAvailable(), fetchMyCoupons()])
  } catch {
    // 错误提示由 request.ts 拦截器统一处理（重复领取 1305 / 领完 1306）
  } finally {
    claimingId.value = null
  }
}

onMounted(() => {
  fetchAvailable()
  fetchMyCoupons()
})
</script>

<style scoped>
.coupon-center-page {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.coupon-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
  min-height: 120px;
}

.coupon-card {
  padding: 16px 20px;
}

.coupon-main {
  display: flex;
  align-items: center;
  gap: 20px;
}

.coupon-value {
  display: flex;
  align-items: baseline;
  color: var(--danger);
  min-width: 90px;
}

.coupon-currency {
  font-size: 16px;
  font-weight: 700;
}

.coupon-number {
  font-size: 32px;
  font-weight: 800;
  line-height: 1;
}

.coupon-info {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 4px;
  min-width: 0;
}

.coupon-name {
  font-size: 15px;
  font-weight: 600;
  color: var(--text-primary);
}

.coupon-meta {
  font-size: 12px;
  color: var(--text-secondary);
}

.mine-filter {
  padding: 12px 16px;
  margin-bottom: 12px;
}
</style>
