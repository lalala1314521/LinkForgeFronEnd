<template>
  <el-tag :type="current.type" :size="size" :round="round" disable-transitions>
    {{ current.label }}
  </el-tag>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { StatusMap, TagType } from '@/types'

const props = withDefaults(defineProps<{
  status: string
  /** 状态映射表；不传则从 constants/statusMaps 按业务约定查（由调用方传入） */
  map?: Record<string, StatusMap>
  size?: 'large' | 'default' | 'small'
  round?: boolean
}>(), {
  map: undefined,
  size: 'default',
  round: true,
})

const current = computed<StatusMap>(() => {
  const entry = props.map?.[props.status]
  if (entry) return entry
  // fallback：未知状态时展示原始状态值，避免空白
  return { label: props.status || '未知', type: 'info' as TagType }
})
</script>
