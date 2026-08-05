<template>
  <div class="product-image" :style="{ width: size + 'px', height: size + 'px' }">
    <el-image
      v-if="resolvedSrc"
      :src="resolvedSrc"
      :style="{ width: size + 'px', height: size + 'px' }"
      fit="cover"
      :preview-src-list="resolvedSrc ? [resolvedSrc] : []"
      preview-teleported
      class="product-image-el"
      @error="onError"
    >
      <template #error>
        <div class="image-placeholder">
          <el-icon :size="Math.round(size / 3)"><Picture /></el-icon>
          <span class="placeholder-text">无图</span>
        </div>
      </template>
    </el-image>
    <div v-else class="image-placeholder" :style="{ width: size + 'px', height: size + 'px' }">
      <el-icon :size="Math.round(size / 3)"><Picture /></el-icon>
      <span class="placeholder-text">无图</span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { Picture } from '@element-plus/icons-vue'
import { resolveImageUrl } from '@/utils/format'

const props = withDefaults(defineProps<{
  /** 图片 URL（可为空/相对路径） */
  src?: string
  /** 展示尺寸（px，正方形） */
  size?: number
}>(), {
  src: '',
  size: 48,
})

const loadFailed = ref(false)

const resolvedSrc = computed(() => {
  if (loadFailed.value) return ''
  return resolveImageUrl(props.src)
})

watch(
  () => props.src,
  () => {
    loadFailed.value = false
  }
)

function onError() {
  loadFailed.value = true
}
</script>

<style scoped>
.product-image {
  border-radius: 8px;
  overflow: hidden;
  background: var(--bg-page);
  border: 1px solid var(--border-color);
  flex-shrink: 0;
  display: inline-flex;
}

.product-image-el {
  display: block;
}

.image-placeholder {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 2px;
  color: var(--text-secondary);
  background: var(--bg-page);
  font-size: 12px;
}

.placeholder-text {
  font-size: 11px;
  line-height: 1;
  color: var(--text-secondary);
}
</style>
