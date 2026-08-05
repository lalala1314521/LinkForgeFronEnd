<template>
  <div class="page-header">
    <div class="header-left">
      <el-button
        v-if="back"
        :icon="ArrowLeft"
        link
        @click="handleBack"
      >
        {{ backText }}
      </el-button>
      <h2 class="page-title">{{ title }}</h2>
    </div>
    <div class="header-actions">
      <slot name="actions" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { useRouter } from 'vue-router'
import { ArrowLeft } from '@element-plus/icons-vue'

const props = withDefaults(defineProps<{
  title: string
  back?: boolean
  backText?: string
}>(), {
  back: false,
  backText: '返回',
})

const router = useRouter()

function handleBack() {
  router.back()
}
</script>

<style scoped>
.page-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 20px;
  gap: 12px;
  flex-wrap: wrap;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 8px;
}

.header-actions {
  display: flex;
  align-items: center;
  gap: 8px;
}
</style>
