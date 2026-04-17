<template>
  <div class="profile-page">
    <div class="page-header">
      <h2 class="page-title">个人中心</h2>
    </div>

    <div class="profile-grid">
      <!-- Profile Info Card -->
      <div class="app-card profile-card">
        <div class="profile-hero">
          <div class="avatar-container">
            <el-avatar :size="90" :style="{ background: avatarColor, fontSize: '36px' }">
              {{ avatarLetter }}
            </el-avatar>
          </div>
          <div class="profile-meta">
            <h3 class="profile-name">{{ authStore.nickname || authStore.username }}</h3>
            <p class="profile-username">@{{ authStore.username }}</p>
            <el-tag type="success" size="small" round>活跃账户</el-tag>
          </div>
        </div>

        <el-divider />

        <div class="account-info">
          <div class="info-title">账户信息</div>
          <div class="info-item">
            <el-icon><User /></el-icon>
            <span class="label">用户 ID</span>
            <span class="value">#{{ authStore.userId }}</span>
          </div>
          <div class="info-item">
            <el-icon><User /></el-icon>
            <span class="label">用户名</span>
            <span class="value">{{ authStore.username }}</span>
          </div>
        </div>
      </div>

      <!-- Settings Card -->
      <div class="settings-column">
        <!-- Change Password -->
        <div class="app-card">
          <div class="card-title" style="margin-bottom: 20px">修改密码</div>
          <el-form ref="pwFormRef" :model="pwForm" :rules="pwRules" label-width="100px">
            <el-form-item label="当前密码" prop="currentPassword">
              <el-input
                v-model="pwForm.currentPassword"
                type="password"
                show-password
                placeholder="请输入当前密码"
              />
            </el-form-item>
            <el-form-item label="新密码" prop="newPassword">
              <el-input
                v-model="pwForm.newPassword"
                type="password"
                show-password
                placeholder="8位以上，含大小写字母和数字"
              />
            </el-form-item>
            <el-form-item label="确认新密码" prop="confirmPassword">
              <el-input
                v-model="pwForm.confirmPassword"
                type="password"
                show-password
                placeholder="再次输入新密码"
              />
            </el-form-item>
            <el-form-item>
              <el-button type="primary" :loading="pwLoading" @click="handleChangePassword">
                修改密码
              </el-button>
            </el-form-item>
          </el-form>
        </div>

        <!-- Appearance Settings -->
        <div class="app-card">
          <div class="card-title" style="margin-bottom: 20px">外观设置</div>

          <div class="setting-item">
            <div class="setting-info">
              <div class="setting-name">深色模式</div>
              <div class="setting-desc">切换界面主题风格</div>
            </div>
            <el-switch
              :model-value="isDark"
              active-color="#409EFF"
              @change="appStore.toggleTheme"
            />
          </div>

          <div class="setting-item">
            <div class="setting-info">
              <div class="setting-name">收起侧边栏</div>
              <div class="setting-desc">折叠左侧导航菜单</div>
            </div>
            <el-switch
              :model-value="appStore.sidebarCollapsed"
              @change="appStore.toggleSidebar"
            />
          </div>
        </div>

        <!-- Danger Zone -->
        <div class="app-card danger-zone">
          <div class="card-title danger-title" style="margin-bottom: 12px">退出登录</div>
          <p class="danger-desc">退出后需要重新输入账号密码登录</p>
          <el-button type="danger" plain :icon="SwitchButton" @click="handleLogout">
            退出登录
          </el-button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { User, SwitchButton } from '@element-plus/icons-vue'
import type { FormInstance, FormRules } from 'element-plus'
import { useAuthStore } from '@/stores/auth'
import { useAppStore } from '@/stores/app'
import { useUserApi } from '@/api/users'

const router = useRouter()
const authStore = useAuthStore()
const appStore = useAppStore()
const { updateUser } = useUserApi()

const isDark = computed(() => appStore.theme === 'dark')

const pwFormRef = ref<FormInstance>()
const pwLoading = ref(false)

const pwForm = reactive({
  currentPassword: '',
  newPassword: '',
  confirmPassword: '',
})

const pwRules: FormRules = {
  currentPassword: [{ required: true, message: '请输入当前密码', trigger: 'blur' }],
  newPassword: [
    { required: true, message: '请输入新密码', trigger: 'blur' },
    { min: 8, message: '密码至少8位', trigger: 'blur' },
    { pattern: /(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, message: '必须含大小写字母和数字', trigger: 'blur' },
  ],
  confirmPassword: [
    { required: true, message: '请确认新密码', trigger: 'blur' },
    {
      validator: (_r, v: string, cb) => {
        if (v !== pwForm.newPassword) cb(new Error('两次输入密码不一致'))
        else cb()
      },
      trigger: 'blur',
    },
  ],
}

// Avatar
const avatarColors = ['#409EFF', '#67C23A', '#E6A23C', '#F56C6C', '#6554C0', '#00B4D8']
const avatarColor = computed(() =>
  avatarColors[(authStore.username || '').charCodeAt(0) % avatarColors.length]
)
const avatarLetter = computed(() =>
  (authStore.nickname || authStore.username || 'U')[0].toUpperCase()
)

async function handleChangePassword() {
  if (!pwFormRef.value) return
  const valid = await pwFormRef.value.validate().catch(() => false)
  if (!valid) return

  if (!authStore.userId) return

  pwLoading.value = true
  try {
    await updateUser(authStore.userId, { password: pwForm.newPassword })
    ElMessage.success('密码修改成功，请重新登录')
    authStore.logout()
    router.push('/login')
  } finally {
    pwLoading.value = false
  }
}

async function handleLogout() {
  await ElMessageBox.confirm('确定要退出登录吗？', '提示', {
    confirmButtonText: '确定退出',
    type: 'warning',
  })
  authStore.logout()
  ElMessage.success('已安全退出')
  router.push('/login')
}
</script>

<style scoped>
.profile-page {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.profile-grid {
  display: grid;
  grid-template-columns: 280px 1fr;
  gap: 20px;
  align-items: start;
}

@media (max-width: 900px) {
  .profile-grid {
    grid-template-columns: 1fr;
  }
}

/* Profile Card */
.profile-hero {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  gap: 12px;
  padding-bottom: 4px;
}

.avatar-container {
  position: relative;
}

.profile-name {
  font-size: 20px;
  font-weight: 700;
  margin: 0;
}

.profile-username {
  font-size: 13px;
  color: var(--text-secondary);
  margin: 0;
}

.account-info {
  margin-top: 4px;
}

.info-title {
  font-size: 12px;
  font-weight: 600;
  color: var(--text-secondary);
  text-transform: uppercase;
  letter-spacing: 0.5px;
  margin-bottom: 12px;
}

.info-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 0;
  border-bottom: 1px solid var(--border-color);
  font-size: 13px;
}

.info-item .el-icon {
  color: var(--text-secondary);
}

.info-item .label {
  flex: 1;
  color: var(--text-secondary);
}

.info-item .value {
  font-weight: 600;
  color: var(--text-primary);
}

/* Settings Column */
.settings-column {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.card-title {
  font-size: 15px;
  font-weight: 600;
  color: var(--text-primary);
}

/* Setting Item */
.setting-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 0;
  border-bottom: 1px solid var(--border-color);
}

.setting-item:last-child {
  border-bottom: none;
}

.setting-name {
  font-weight: 500;
  font-size: 14px;
  color: var(--text-primary);
}

.setting-desc {
  font-size: 12px;
  color: var(--text-secondary);
  margin-top: 2px;
}

/* Danger Zone */
.danger-zone {
  border: 1px solid #fde2e2 !important;
}

.dark .danger-zone {
  border-color: rgba(245, 108, 108, 0.3) !important;
}

.danger-title {
  color: var(--danger);
}

.danger-desc {
  font-size: 13px;
  color: var(--text-secondary);
  margin-bottom: 12px;
}
</style>
