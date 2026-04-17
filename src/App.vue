<template>
  <el-config-provider :locale="zhCn">
    <router-view />
  </el-config-provider>
</template>

<script setup lang="ts">
import zhCn from 'element-plus/es/locale/lang/zh-cn'
import { useAppStore } from '@/stores/app'
import { onMounted } from 'vue'

const appStore = useAppStore()

onMounted(() => {
  // Apply saved theme on startup
  appStore.initTheme()
})
</script>
