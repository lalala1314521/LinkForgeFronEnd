<template>
  <div class="not-found-page">
    <div class="not-found-content">
      <div class="error-code">404</div>
      <div class="error-illustration">
        <el-icon size="80" color="#c0c4cc"><DocumentDelete /></el-icon>
      </div>
      <h2 class="error-title">页面不存在</h2>
      <p class="error-desc">您访问的页面已被删除或从未存在</p>
      <div class="error-actions">
        <el-button type="primary" size="large" @click="$router.push('/')">
          返回首页
        </el-button>
        <el-button size="large" @click="$router.back()">
          返回上一页
        </el-button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
</script>

<style scoped>
.not-found-page {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--bg-page);
}

.not-found-content {
  text-align: center;
  padding: 40px;
}

.error-code {
  font-size: 100px;
  font-weight: 900;
  background: linear-gradient(135deg, #409EFF, #6554C0);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  line-height: 1;
  margin-bottom: 16px;
}

.error-illustration {
  margin: 20px 0;
}

.error-title {
  font-size: 24px;
  font-weight: 600;
  color: var(--text-primary);
  margin: 0 0 8px;
}

.error-desc {
  color: var(--text-secondary);
  margin: 0 0 32px;
}

.error-actions {
  display: flex;
  gap: 12px;
  justify-content: center;
}
</style>
