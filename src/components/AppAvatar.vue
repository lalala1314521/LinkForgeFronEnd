<template>
  <el-avatar
    :size="size"
    class="app-avatar"
    :style="{ '--avatar-bg': bgColor }"
  >
    {{ letter }}
  </el-avatar>
</template>

<script setup lang="ts">
import { computed } from 'vue'

const props = withDefaults(defineProps<{
  name: string
  size?: number
}>(), {
  size: 32,
})

const AVATAR_COLORS = ['#4F6BFF', '#67C23A', '#E6A23C', '#F56C6C', '#909399', '#7B5BFF', '#00B4D8']

const letter = computed(() => (props.name || 'U').trim().charAt(0).toUpperCase() || 'U')

const bgColor = computed(() => {
  const name = props.name || 'U'
  const base = AVATAR_COLORS[name.charCodeAt(0) % AVATAR_COLORS.length]
  return base
})
</script>

<style scoped>
.app-avatar {
  background: var(--avatar-bg);
  color: #fff;
  font-weight: 600;
  flex-shrink: 0;
}

/* 深色模式：同色 60% 透明度降饱和，避免高饱和刺眼 */
html.dark .app-avatar {
  background: color-mix(in srgb, var(--avatar-bg) 60%, transparent);
}
</style>
