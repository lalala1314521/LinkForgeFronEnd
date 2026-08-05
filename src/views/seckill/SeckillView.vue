<template>
  <div class="seckill-page">
    <PageHeader title="秒杀活动">
      <template #actions>
        <el-tag type="danger" round>限时抢购</el-tag>
      </template>
    </PageHeader>

    <div v-loading="loading" class="activity-list">
      <template v-if="!loading && activities.length === 0">
        <EmptyState description="暂无可参与的秒杀活动" />
      </template>
      <template v-else>
        <div
          v-for="act in activities"
          :key="act.id"
          class="app-card activity-card"
        >
          <div class="activity-info">
            <div class="activity-name">{{ act.name }}</div>
            <div class="activity-meta">商品 ID：{{ act.productId }}</div>
            <div class="activity-meta">
              秒杀价 <span class="price">{{ formatAmount(act.seckillPrice) }}</span>
              · 剩余 {{ act.availableStock }}/{{ act.totalStock }} 件
            </div>
            <div class="activity-meta">
              时间：{{ formatDate(act.startTime) }} ~ {{ formatDate(act.endTime) }}
            </div>
          </div>

          <div class="activity-side">
            <StatusTag :status="act.status" :map="SECKILL_STATUS" size="large" />
            <el-button
              type="danger"
              round
              :disabled="!canSeckill(act)"
              :loading="seckillingId === act.id"
              @click="handleSeckill(act)"
            >
              {{ seckillButtonText(act) }}
            </el-button>
          </div>
        </div>
      </template>
    </div>

    <!-- 抢购结果弹窗 -->
    <el-dialog
      v-model="resultVisible"
      title="抢购结果"
      width="420px"
      :close-on-click-modal="false"
    >
      <template v-if="result">
        <div class="result-block">
          <div class="result-status">
            <StatusTag :status="result.status" :map="SECKILL_ORDER_STATUS" size="large" />
          </div>
          <div class="result-field">
            <span class="result-label">秒杀订单号</span>
            <span class="result-value mono">{{ result.orderNo }}</span>
          </div>
          <div class="result-field">
            <span class="result-label">商品 ID</span>
            <span class="result-value">#{{ result.productId }}</span>
          </div>
          <div class="result-field">
            <span class="result-label">秒杀价格</span>
            <span class="result-value price">{{ formatAmount(result.seckillPrice) }}</span>
          </div>
          <div class="result-field">
            <span class="result-label">订单状态</span>
            <span class="result-value">{{ seckillOrderLabel(result.status) }}</span>
          </div>
        </div>
      </template>
      <template #footer>
        <el-button @click="resultVisible = false">关闭</el-button>
        <el-button
          v-if="result && result.status === 'PENDING'"
          type="primary"
          :loading="polling"
          @click="handlePoll"
        >
          查询订单状态
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import PageHeader from '@/components/PageHeader.vue'
import StatusTag from '@/components/StatusTag.vue'
import EmptyState from '@/components/EmptyState.vue'
import { useSeckillApi } from '@/api/seckill'
import { SECKILL_STATUS, SECKILL_ORDER_STATUS } from '@/constants/statusMaps'
import { formatAmount, formatDate } from '@/utils/format'
import type { SeckillActivity, SeckillResult } from '@/types'

const { listActivities, doSeckill, getOrderStatus } = useSeckillApi()

const loading = ref(false)
const activities = ref<SeckillActivity[]>([])
const seckillingId = ref<number | null>(null)
const polling = ref(false)

const resultVisible = ref(false)
const result = ref<SeckillResult | null>(null)

function canSeckill(act: SeckillActivity) {
  return act.status === 'ACTIVE' && act.availableStock > 0
}

function seckillButtonText(act: SeckillActivity) {
  if (act.status === 'CREATED') return '未开始'
  if (act.status === 'ENDED') return '已结束'
  if (act.availableStock <= 0) return '已抢光'
  return '立即抢购'
}

function seckillOrderLabel(status: string) {
  return SECKILL_ORDER_STATUS[status]?.label ?? status
}

async function fetchActivities() {
  loading.value = true
  try {
    activities.value = await listActivities()
  } catch {
    activities.value = []
  } finally {
    loading.value = false
  }
}

async function handleSeckill(act: SeckillActivity) {
  await ElMessageBox.confirm(
    `确定以 ${formatAmount(act.seckillPrice)} 抢购「${act.name}」吗？`,
    '确认抢购',
    { type: 'warning', confirmButtonText: '立即抢购', cancelButtonText: '再想想' }
  )

  seckillingId.value = act.id
  try {
    const res = await doSeckill(act.id)
    result.value = res
    resultVisible.value = true
    // 刷新剩余库存
    fetchActivities()
    if (res.status === 'PENDING') {
      ElMessage.success('抢购成功，请尽快完成支付')
    }
  } catch {
    // 错误提示（未开始/已结束/售罄/重复）由 request.ts 拦截器统一处理
    fetchActivities()
  } finally {
    seckillingId.value = null
  }
}

/** 轮询秒杀订单状态（异步落库，PENDING -> PAID/FAILED） */
async function handlePoll() {
  if (!result.value) return
  polling.value = true
  try {
    const res = await getOrderStatus(result.value.orderNo)
    result.value = res
    if (res.status !== 'PENDING') {
      ElMessage.success(`订单状态已更新：${seckillOrderLabel(res.status)}`)
    }
  } finally {
    polling.value = false
  }
}

onMounted(fetchActivities)
</script>

<style scoped>
.seckill-page {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.activity-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
  min-height: 120px;
}

.activity-card {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  flex-wrap: wrap;
}

.activity-info {
  display: flex;
  flex-direction: column;
  gap: 4px;
  min-width: 0;
}

.activity-name {
  font-size: 16px;
  font-weight: 600;
  color: var(--text-primary);
}

.activity-meta {
  font-size: 13px;
  color: var(--text-secondary);
}

.price {
  color: var(--danger);
  font-weight: 700;
}

.activity-side {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 10px;
}

/* Result Dialog */
.result-block {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.result-status {
  margin-bottom: 4px;
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
</style>
