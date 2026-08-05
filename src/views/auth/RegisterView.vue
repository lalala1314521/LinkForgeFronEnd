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
        <h1 class="hero-title">开启你的 LinkForge 之旅</h1>
        <p class="hero-desc">注册账户，畅享商城购物与限时秒杀</p>
        <ul class="hero-points">
          <li><el-icon><CircleCheckFilled /></el-icon>注册即享商城浏览与下单能力</li>
          <li><el-icon><CircleCheckFilled /></el-icon>秒杀抢购 · 我的订单 · 优惠券中心</li>
          <li><el-icon><CircleCheckFilled /></el-icon>深色模式 · 响应式布局 · 多端适配</li>
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
          <h1 class="auth-title">创建账户</h1>
          <p class="auth-subtitle">加入 LinkForge</p>
        </div>

        <el-card class="auth-card" shadow="always">
          <el-form
            ref="formRef"
            :model="form"
            :rules="rules"
            label-position="top"
          >
            <el-form-item label="用户名" prop="username">
              <el-input
                v-model="form.username"
                placeholder="3-50位，字母数字下划线"
                size="large"
                :prefix-icon="User"
                clearable
              />
            </el-form-item>

            <el-form-item label="密码" prop="password">
              <el-input
                v-model="form.password"
                type="password"
                placeholder="8位以上，含大小写字母和数字"
                size="large"
                :prefix-icon="Lock"
                show-password
              />
            </el-form-item>

            <el-form-item label="昵称" prop="nickname">
              <el-input
                v-model="form.nickname"
                placeholder="可选，显示名称"
                size="large"
                :prefix-icon="EditPen"
                clearable
              />
            </el-form-item>

            <el-row :gutter="12">
              <el-col :xs="24" :sm="12">
                <el-form-item label="手机号" prop="phone">
                  <el-input
                    v-model="form.phone"
                    placeholder="可选"
                    size="large"
                    :prefix-icon="Phone"
                    clearable
                  />
                </el-form-item>
              </el-col>
              <el-col :xs="24" :sm="12">
                <el-form-item label="邮箱" prop="email">
                  <el-input
                    v-model="form.email"
                    placeholder="可选"
                    size="large"
                    :prefix-icon="Message"
                    clearable
                  />
                </el-form-item>
              </el-col>
            </el-row>

            <el-button
              type="primary"
              size="large"
              class="submit-btn"
              :loading="loading"
              :disabled="isLimited"
              @click="handleRegister"
            >
              <template v-if="isLimited">
                <el-icon class="is-loading"><Timer /></el-icon>
                {{ limitText }}
              </template>
              <template v-else>
                {{ loading ? '注册中...' : '立即注册' }}
              </template>
            </el-button>
          </el-form>

          <!-- 限流提示（后端注册接口：10次/小时/IP 限制） -->
          <el-alert
            v-if="isLimited"
            class="rate-limit-alert"
            type="warning"
            :closable="false"
            show-icon
            title="注册请求受限"
            :description="`注册接口限频 10次/小时，请勿频繁注册。${limitText}`"
          />

          <div class="form-footer">
            <span class="footer-text">已有账户？</span>
            <el-button link type="primary" @click="$router.push('/login')">
              立即登录
            </el-button>
          </div>
        </el-card>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { User, Lock, EditPen, Phone, Message, Timer, Link, CircleCheckFilled } from '@element-plus/icons-vue'
import type { FormInstance, FormRules } from 'element-plus'
import { useUserApi } from '@/api/users'
import { useRateLimit } from '@/composables/useRateLimit'
import type { CreateUserRequest } from '@/types'

const router = useRouter()
const { createUser } = useUserApi()

// 限流倒计时（后端注册接口：10次/小时/IP）
const { isLimited, limitText, startCountdown } = useRateLimit()

const formRef = ref<FormInstance>()
const loading = ref(false)

const form = reactive({
  username: '',
  password: '',
  nickname: '',
  phone: '',
  email: '',
})

const rules: FormRules = {
  username: [
    { required: true, message: '请输入用户名', trigger: 'blur' },
    { min: 3, max: 50, message: '用户名长度为3-50个字符', trigger: 'blur' },
    { pattern: /^[a-zA-Z0-9_]+$/, message: '只能包含字母、数字和下划线', trigger: 'blur' },
  ],
  password: [
    { required: true, message: '请输入密码', trigger: 'blur' },
    { min: 8, message: '密码至少8位', trigger: 'blur' },
    {
      pattern: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).+$/,
      message: '必须包含大小写字母和数字',
      trigger: 'blur',
    },
  ],
  phone: [
    { pattern: /^1[3-9]\d{9}$/, message: '请输入正确的手机号格式', trigger: 'blur' },
  ],
  email: [
    { type: 'email', message: '请输入正确的邮箱格式', trigger: 'blur' },
  ],
}

async function handleRegister() {
  if (isLimited.value) return
  if (!formRef.value) return
  const valid = await formRef.value.validate().catch(() => false)
  if (!valid) return

  loading.value = true
  try {
    const payload: CreateUserRequest = {
      username: form.username,
      password: form.password,
    }
    if (form.nickname) payload.nickname = form.nickname
    if (form.phone) payload.phone = form.phone
    if (form.email) payload.email = form.email

    await createUser(payload)
    ElMessage.success('注册成功，请登录')
    router.push('/login')
  } catch (err: unknown) {
    // 429 限流：启动3600秒倒计时（10次/小时）
    if ((err as { isRateLimit?: boolean })?.isRateLimit) {
      startCountdown(3600)
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
  max-width: 440px;
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

.rate-limit-alert {
  margin-top: 12px;
  border-radius: var(--radius-sm) !important;
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
    max-width: 440px;
  }
}
</style>
