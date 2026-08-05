<template>
  <div class="profile-page">
    <PageHeader title="个人中心" />

    <div class="profile-grid">
      <!-- Profile Info Card -->
      <div class="app-card profile-card">
        <div class="profile-hero">
          <div class="avatar-container">
            <AppAvatar :name="authStore.nickname || authStore.username" :size="90" />
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

      <div class="settings-column">
        <!-- 修改密码已下线：后端 UserUpdateRequest 无 password 字段（已核实），
             PUT /users 传 password 无效；待后端提供独立改密接口后恢复 -->
        <el-alert
          type="info"
          :closable="false"
          show-icon
          title="修改密码暂不可用"
          description="后端暂未提供独立的修改密码接口，请等待后续版本支持。"
          style="border-radius: var(--radius-md)"
        />

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
              active-color="var(--primary)"
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
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { User, SwitchButton } from '@element-plus/icons-vue'
import PageHeader from '@/components/PageHeader.vue'
import AppAvatar from '@/components/AppAvatar.vue'
import { useAuthStore } from '@/stores/auth'
import { useAppStore } from '@/stores/app'

const router = useRouter()
const authStore = useAuthStore()
const appStore = useAppStore()

const isDark = computed(() => appStore.theme === 'dark')

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
  border: 1px solid var(--color-danger-border) !important;
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
