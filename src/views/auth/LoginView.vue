<template>
  <div class="auth-page">
    <!-- Left Hero（<768px 折叠为顶部窄横幅） -->
    <div class="auth-hero">
      <div class="hero-glow glow-1"></div>
      <div class="hero-glow glow-2"></div>
      <div class="hero-inner">
        <div class="hero-brand">
          <el-icon size="30" color="#fff"><Link /></el-icon>
          <span class="hero-brand-name">LinkForge</span>
        </div>
        <h1 class="hero-title">让链接创造价值</h1>
        <p class="hero-desc">一站式商城与秒杀管理平台，高效、安全、开箱即用</p>
        <ul class="hero-points">
          <li><el-icon><CircleCheckFilled /></el-icon>商品管理 · 图片上传 · 库存实时可控</li>
          <li><el-icon><CircleCheckFilled /></el-icon>限时秒杀 · 高并发防护 · 抢购即得</li>
          <li><el-icon><CircleCheckFilled /></el-icon>角色化界面 · 管理员与用户各司其职</li>
        </ul>
      </div>
    </div>

    <!-- Right Form -->
    <div class="auth-main">
      <div class="auth-container">
        <div class="auth-header">
          <div class="auth-logo">
            <el-icon size="36" color="var(--primary)"><Link /></el-icon>
          </div>
          <h1 class="auth-title">欢迎回来</h1>
          <p class="auth-subtitle">登录您的账户以继续</p>
        </div>

        <el-card class="auth-card" shadow="always">
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
  </div>
</template>

<script setup lang="ts">
import { ref, reactive } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { ElMessage } from 'element-plus'
import { User, Lock, Timer, Link, CircleCheckFilled } from '@element-plus/icons-vue'
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

    // 按角色跳转：ADMIN → 管理后台，USER → 商城首页
    const redirect = route.query.redirect as string
    router.push(redirect || (data.role === 'ADMIN' ? '/dashboard' : '/mall/home'))
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
  background-color: var(--bg-page);
  background-image: var(--gradient-page);
}

/* ============ Left Hero ============ */
.auth-hero {
  flex: 1.1;
  position: relative;
  overflow: hidden;
  background: var(--gradient-brand);
  color: #fff;
  display: flex;
  align-items: center;
  padding: 56px;
}

.hero-glow {
  position: absolute;
  border-radius: 50%;
  background: radial-gradient(circle, rgba(255, 255, 255, 0.2), transparent);
  pointer-events: none;
}

.glow-1 {
  width: 380px;
  height: 380px;
  top: -120px;
  right: -80px;
}

.glow-2 {
  width: 300px;
  height: 300px;
  bottom: -100px;
  left: 5%;
}

.hero-inner {
  position: relative;
  z-index: 1;
  max-width: 480px;
}

.hero-brand {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 40px;
}

.hero-brand-name {
  font-size: 22px;
  font-weight: 800;
  letter-spacing: 1px;
}

.hero-title {
  font-size: 36px;
  font-weight: 800;
  margin: 0 0 14px;
  line-height: 1.3;
}

.hero-desc {
  font-size: 15px;
  color: rgba(255, 255, 255, 0.85);
  margin: 0 0 32px;
}

.hero-points {
  list-style: none;
  padding: 0;
  margin: 0;
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.hero-points li {
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 14px;
  color: rgba(255, 255, 255, 0.92);
}

/* ============ Right Form ============ */
.auth-main {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 32px 20px;
  min-height: 100vh;
}

.auth-container {
  width: 100%;
  max-width: 420px;
}

.auth-header {
  text-align: center;
  margin-bottom: 24px;
}

.auth-logo {
  width: 64px;
  height: 64px;
  background: var(--bg-card);
  border-radius: 18px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto 14px;
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

.auth-card {
  border-radius: var(--radius-lg) !important;
  border: none !important;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.1) !important;
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

/* ============ Mobile（<768px hero 折叠为顶部窄横幅） ============ */
@media (max-width: 767px) {
  .auth-page {
    flex-direction: column;
  }

  .auth-hero {
    flex: none;
    width: 100%;
    padding: 28px 24px;
    min-height: auto;
  }

  .hero-inner {
    max-width: none;
  }

  .hero-brand {
    margin-bottom: 16px;
  }

  .hero-brand-name {
    font-size: 18px;
  }

  .hero-title {
    font-size: 24px;
    margin-bottom: 8px;
  }

  .hero-desc {
    font-size: 13px;
    margin-bottom: 0;
  }

  .hero-points {
    display: none;
  }

  .auth-main {
    min-height: auto;
    padding: 24px 16px;
  }

  .auth-container {
    max-width: 420px;
  }
}
</style>
