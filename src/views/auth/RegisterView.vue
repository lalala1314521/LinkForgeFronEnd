<template>
  <div class="auth-page">
    <div class="auth-bg">
      <div class="circle circle-1"></div>
      <div class="circle circle-2"></div>
    </div>

    <div class="auth-container">
      <div class="auth-header">
        <div class="auth-logo">
          <el-icon size="36" color="#409EFF"><DocumentChecked /></el-icon>
        </div>
        <h1 class="auth-title">创建账户</h1>
        <p class="auth-subtitle">加入参考管理系统</p>
      </div>

      <el-card class="auth-card" shadow="always">
        <h2 class="form-title">注册新账户</h2>

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
            <el-col :span="12">
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
            <el-col :span="12">
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
</template>

<script setup lang="ts">
import { ref, reactive } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { User, Lock, EditPen, Phone, Message, Timer } from '@element-plus/icons-vue'
import type { FormInstance, FormRules } from 'element-plus'
import { useUserApi } from '@/api/users'
import { useRateLimit } from '@/composables/useRateLimit'

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
    const payload: Record<string, string> = {
      username: form.username,
      password: form.password,
    }
    if (form.nickname) payload.nickname = form.nickname
    if (form.phone) payload.phone = form.phone
    if (form.email) payload.email = form.email

    await createUser(payload as Parameters<typeof createUser>[0])
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
  align-items: center;
  justify-content: center;
  position: relative;
  overflow: hidden;
  background: linear-gradient(135deg, #e8f4fd 0%, #f0f9ff 50%, #fef9f0 100%);
}

.dark .auth-page {
  background: linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #0f172a 100%);
}

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
  background: radial-gradient(circle, #409EFF, transparent);
  top: -100px;
  left: -100px;
}

.circle-2 {
  width: 300px;
  height: 300px;
  background: radial-gradient(circle, #67C23A, transparent);
  bottom: -80px;
  right: -80px;
}

.auth-container {
  width: 100%;
  max-width: 480px;
  padding: 20px;
  position: relative;
  z-index: 1;
}

.auth-header {
  text-align: center;
  margin-bottom: 28px;
}

.auth-logo {
  width: 72px;
  height: 72px;
  background: white;
  border-radius: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto 16px;
  box-shadow: 0 8px 24px rgba(64, 158, 255, 0.2);
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

.form-title {
  font-size: 20px;
  font-weight: 600;
  color: var(--text-primary);
  margin: 0 0 20px;
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
</style>
