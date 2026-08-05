<template>
  <div class="auth-page">
    <!-- Decorative Background -->
    <div class="auth-bg">
      <div class="circle circle-1"></div>
      <div class="circle circle-2"></div>
      <div class="circle circle-3"></div>
    </div>

    <div class="auth-container">
      <!-- Logo Area -->
      <div class="auth-header">
        <div class="auth-logo">
          <el-icon size="36" color="var(--primary)"><DocumentChecked /></el-icon>
        </div>
        <h1 class="auth-title">参考管理系统</h1>
        <p class="auth-subtitle">Reference Management System</p>
      </div>

      <!-- Login Card -->
      <el-card class="auth-card" shadow="always">
        <h2 class="form-title">欢迎回来</h2>
        <p class="form-desc">登录您的账户以继续</p>

        <el-form
          ref="formRef"
          :model="form"
          :rules="rules"
          label-position="top"
          @submit.prevent="handleLogin"
        >
          <el-form-item label="用户名" prop="username">
            <el-input
              v-model="form.username"
              placeholder="请输入用户名"
              size="large"
              :prefix-icon="User"
              clearable
              autocomplete="username"
            />
          </el-form-item>

          <el-form-item label="密码" prop="password">
            <el-input
              v-model="form.password"
              type="password"
              placeholder="请输入密码"
              size="large"
              :prefix-icon="Lock"
              show-password
              autocomplete="current-password"
              @keyup.enter="handleLogin"
            />
          </el-form-item>

          <el-button
            type="primary"
            size="large"
            class="submit-btn"
            :loading="loading"
            :disabled="isLimited"
            @click="handleLogin"
          >
            <template v-if="isLimited">
              <el-icon class="is-loading"><Timer /></el-icon>
              {{ limitText }}
            </template>
            <template v-else>
              {{ loading ? '登录中...' : '立即登录' }}
            </template>
          </el-button>
        </el-form>

        <!-- 限流提示（后端 5次/分钟/IP 限制） -->
        <el-alert
          v-if="isLimited"
          class="rate-limit-alert"
          type="warning"
          :closable="false"
          show-icon
          title="登录请求过于频繁"
          :description="`为保护账户安全，登录接口限频 5次/分钟。${limitText}`"
        />

        <div class="form-footer">
          <span class="footer-text">还没有账户？</span>
          <el-button link type="primary" @click="$router.push('/register')">
            立即注册
          </el-button>
        </div>

        <!-- Demo Account Hint -->
        <el-alert
          class="demo-hint"
          type="info"
          :closable="false"
          show-icon
        >
          <template #default>
            <div class="demo-accounts">
              <span class="hint-label">演示账户：</span>
              <el-button link size="small" @click="fillDemo('admin', 'Test@1234')">admin / Test@1234</el-button>
              <el-divider direction="vertical" />
              <el-button link size="small" @click="fillDemo('testuser', 'Test@1234')">testuser / Test@1234</el-button>
            </div>
          </template>
        </el-alert>
      </el-card>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { ElMessage } from 'element-plus'
import { User, Lock, Timer, DocumentChecked } from '@element-plus/icons-vue'
import type { FormInstance, FormRules } from 'element-plus'
import { useAuthApi } from '@/api/auth'
import { useAuthStore } from '@/stores/auth'
import { useRateLimit } from '@/composables/useRateLimit'

const router = useRouter()
const route = useRoute()
const authStore = useAuthStore()
const { login } = useAuthApi()

// 限流倒计时（后端登录接口：5次/分钟/IP）
const { isLimited, limitText, startCountdown } = useRateLimit()

const formRef = ref<FormInstance>()
const loading = ref(false)

const form = reactive({
  username: '',
  password: '',
})

const rules: FormRules = {
  username: [{ required: true, message: '请输入用户名', trigger: 'blur' }],
  password: [{ required: true, message: '请输入密码', trigger: 'blur' }],
}

function fillDemo(username: string, password: string) {
  form.username = username
  form.password = password
}

async function handleLogin() {
  if (isLimited.value) return
  if (!formRef.value) return
  const valid = await formRef.value.validate().catch(() => false)
  if (!valid) return

  loading.value = true
  try {
    const data = await login({ username: form.username, password: form.password })
    authStore.setAuth(data)
    ElMessage.success(`欢迎回来，${data.nickname || data.username}！`)

    const redirect = route.query.redirect as string
    router.push(redirect || '/dashboard')
  } catch (err: unknown) {
    // 429 限流：启动60秒倒计时（5次/分钟）
    if ((err as { isRateLimit?: boolean })?.isRateLimit) {
      startCountdown(60)
    }
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.auth-page {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  overflow: hidden;
  /* 背景收敛：--gradient-page 氛围光，替代写死渐变 */
  background-color: var(--bg-page);
  background-image: var(--gradient-page);
}

/* Decorative circles（颜色收敛为语义变量） */
.auth-bg {
  position: absolute;
  inset: 0;
  pointer-events: none;
}

.circle {
  position: absolute;
  border-radius: 50%;
  opacity: 0.12;
}

.circle-1 {
  width: 400px;
  height: 400px;
  background: radial-gradient(circle, var(--primary), transparent);
  top: -100px;
  right: -100px;
}

.circle-2 {
  width: 300px;
  height: 300px;
  background: radial-gradient(circle, var(--success), transparent);
  bottom: -80px;
  left: -80px;
}

.circle-3 {
  width: 200px;
  height: 200px;
  background: radial-gradient(circle, var(--warning), transparent);
  bottom: 40%;
  right: 10%;
}

/* Container（移动端 width: min(420px, 92vw)） */
.auth-container {
  width: 100%;
  max-width: 420px;
  padding: 20px;
  position: relative;
  z-index: 1;
}

@media (max-width: 480px) {
  .auth-container {
    max-width: none;
    width: min(420px, 92vw);
  }
}

/* Header */
.auth-header {
  text-align: center;
  margin-bottom: 28px;
}

.auth-logo {
  width: 72px;
  height: 72px;
  /* 深色下自动变深，避免白块刺眼 */
  background: var(--bg-card);
  border-radius: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto 16px;
  box-shadow: 0 8px 24px rgba(79, 107, 255, 0.2);
}

.auth-title {
  font-size: 24px;
  font-weight: 700;
  color: var(--text-primary);
  margin: 0 0 6px;
}

.auth-subtitle {
  font-size: 13px;
  color: var(--text-secondary);
  margin: 0;
}

/* Card */
.auth-card {
  border-radius: var(--radius-lg) !important;
  border: none !important;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.1) !important;
}

.form-title {
  font-size: 20px;
  font-weight: 600;
  color: var(--text-primary);
  margin: 0 0 4px;
}

.form-desc {
  font-size: 13px;
  color: var(--text-secondary);
  margin: 0 0 24px;
}

.submit-btn {
  width: 100%;
  height: 44px;
  font-size: 15px;
  border-radius: var(--radius-sm);
  margin-top: 8px;
}

.form-footer {
  display: flex;
  align-items: center;
  justify-content: center;
  margin-top: 16px;
  gap: 4px;
}

.footer-text {
  color: var(--text-secondary);
  font-size: 13px;
}

.demo-hint {
  margin-top: 16px;
  border-radius: var(--radius-sm) !important;
}

.rate-limit-alert {
  margin-top: 12px;
  border-radius: var(--radius-sm) !important;
}

.demo-accounts {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 4px;
  font-size: 12px;
}

.hint-label {
  color: var(--text-secondary);
}
</style>
