<template>
  <div class="user-detail-page">
    <!-- Back Button -->
    <div class="back-nav">
      <el-button :icon="ArrowLeft" link @click="$router.back()">返回用户列表</el-button>
    </div>

    <div v-if="loading" class="loading-wrapper">
      <el-skeleton :rows="8" animated />
    </div>

    <template v-else-if="user">
      <div class="detail-grid">
        <!-- Profile Card -->
        <div class="app-card profile-card">
          <div class="profile-avatar-wrap">
            <el-avatar :size="80" :style="{ background: avatarColor, fontSize: '32px' }">
              {{ user.username[0].toUpperCase() }}
            </el-avatar>
            <div class="profile-info">
              <h2 class="profile-name">{{ user.nickname || user.username }}</h2>
              <span class="profile-username">@{{ user.username }}</span>
            </div>
          </div>

          <el-tag :type="getStatusType(user.status)" class="status-tag" round>
            {{ statusMap[user.status] }}
          </el-tag>

          <el-divider />

          <div class="detail-fields">
            <div class="detail-field">
              <span class="field-label">用户 ID</span>
              <span class="field-value">#{{ user.id }}</span>
            </div>
            <div class="detail-field">
              <span class="field-label">手机号</span>
              <span class="field-value">{{ user.phone || '未设置' }}</span>
            </div>
            <div class="detail-field">
              <span class="field-label">邮箱</span>
              <span class="field-value">{{ user.email || '未设置' }}</span>
            </div>
            <div class="detail-field">
              <span class="field-label">注册时间</span>
              <span class="field-value">{{ formatDate(user.createdAt) }}</span>
            </div>
            <div class="detail-field">
              <span class="field-label">最后更新</span>
              <span class="field-value">{{ formatDate(user.updatedAt) }}</span>
            </div>
          </div>

          <!-- Action Buttons -->
          <div class="action-buttons">
            <el-button type="primary" :icon="Edit" @click="openEditDialog">编辑信息</el-button>
            <el-button
              v-if="user.status === 'ACTIVE'"
              type="warning"
              :icon="CircleClose"
              @click="handleStatusChange('DISABLED')"
            >
              禁用账户
            </el-button>
            <el-button
              v-else-if="user.status === 'DISABLED'"
              type="success"
              :icon="CircleCheck"
              @click="handleStatusChange('ACTIVE')"
            >
              启用账户
            </el-button>
            <el-button
              type="danger"
              :icon="Delete"
              plain
              @click="handleDelete"
            >
              删除用户
            </el-button>
          </div>
        </div>

        <!-- Orders Card -->
        <div class="app-card orders-card">
          <div class="card-header">
            <span class="card-title">相关订单</span>
            <el-button
              link
              type="primary"
              @click="$router.push(`/orders?userId=${user.id}`)"
            >
              查看全部
            </el-button>
          </div>

          <el-table
            v-loading="ordersLoading"
            :data="userOrders"
            stripe
          >
            <el-table-column prop="orderNo" label="订单号" min-width="150">
              <template #default="{ row }">
                <el-button link type="primary" @click="$router.push(`/orders/${row.id}`)">
                  {{ row.orderNo }}
                </el-button>
              </template>
            </el-table-column>
            <el-table-column prop="totalAmount" label="金额" width="120">
              <template #default="{ row }">
                <span class="amount">¥ {{ Number(row.totalAmount).toFixed(2) }}</span>
              </template>
            </el-table-column>
            <el-table-column prop="status" label="状态" width="100">
              <template #default="{ row }">
                <el-tag :type="getOrderStatusType(row.status)" size="small" round>
                  {{ orderStatusMap[row.status] }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="createdAt" label="时间" width="140">
              <template #default="{ row }">
                {{ formatDate(row.createdAt) }}
              </template>
            </el-table-column>
          </el-table>

          <el-empty v-if="!ordersLoading && userOrders.length === 0" description="该用户暂无订单" />

          <el-pagination
            v-if="orderTotal > orderPageSize"
            v-model:current-page="orderPage"
            :page-size="orderPageSize"
            :total="orderTotal"
            layout="prev, pager, next"
            @current-change="fetchUserOrders"
            style="margin-top: 12px"
          />
        </div>
      </div>
    </template>

    <el-result
      v-else
      icon="error"
      title="用户不存在"
      sub-title="该用户可能已被删除"
    >
      <template #extra>
        <el-button type="primary" @click="$router.push('/users')">返回列表</el-button>
      </template>
    </el-result>

    <!-- Edit Dialog -->
    <el-dialog
      v-model="editDialogVisible"
      title="编辑用户信息"
      width="480px"
      destroy-on-close
    >
      <el-form ref="formRef" :model="editForm" :rules="editRules" label-width="80px">
        <el-form-item label="昵称" prop="nickname">
          <el-input v-model="editForm.nickname" placeholder="显示名称" />
        </el-form-item>
        <el-form-item label="手机号" prop="phone">
          <el-input v-model="editForm.phone" placeholder="可选" />
        </el-form-item>
        <el-form-item label="邮箱" prop="email">
          <el-input v-model="editForm.email" placeholder="可选" />
        </el-form-item>
        <el-form-item label="新密码" prop="password">
          <el-input v-model="editForm.password" type="password" show-password placeholder="不填则不修改" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="editDialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="editSubmitting" @click="handleEditSubmit">保存</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, reactive, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { ArrowLeft, Edit, Delete, CircleCheck, CircleClose } from '@element-plus/icons-vue'
import type { FormInstance, FormRules } from 'element-plus'
import dayjs from 'dayjs'
import { useUserApi } from '@/api/users'
import { useOrderApi } from '@/api/orders'
import type { User, Order, UserStatus } from '@/types'

const route = useRoute()
const router = useRouter()
const { getUserById, updateUser, updateUserStatus, deleteUser } = useUserApi()
const { getOrders } = useOrderApi()

const userId = Number(route.params.id)
const loading = ref(true)
const user = ref<User | null>(null)
const ordersLoading = ref(false)
const userOrders = ref<Order[]>([])
const orderTotal = ref(0)
const orderPage = ref(1)
const orderPageSize = 5

const editDialogVisible = ref(false)
const editSubmitting = ref(false)
const formRef = ref<FormInstance>()

const editForm = reactive({
  nickname: '',
  phone: '',
  email: '',
  password: '',
})

const editRules: FormRules = {
  phone: [{ pattern: /^1[3-9]\d{9}$/, message: '请输入正确的手机号格式', trigger: 'blur' }],
  email: [{ type: 'email', message: '请输入正确的邮箱格式', trigger: 'blur' }],
  password: [
    {
      validator: (_r, v: string, cb) => {
        if (v && v.length < 8) cb(new Error('密码至少8位'))
        else if (v && !/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(v)) cb(new Error('必须含大小写字母和数字'))
        else cb()
      },
      trigger: 'blur',
    },
  ],
}

const statusMap: Record<string, string> = { ACTIVE: '活跃', DISABLED: '禁用', DELETED: '已删除' }
const orderStatusMap: Record<string, string> = {
  PENDING: '待支付', PAID: '已支付', SHIPPED: '已发货', COMPLETED: '已完成', CANCELLED: '已取消'
}

const avatarColors = ['#409EFF', '#67C23A', '#E6A23C', '#F56C6C', '#6554C0', '#00B4D8']
const avatarColor = computed(() => {
  if (!user.value) return '#409EFF'
  return avatarColors[user.value.username.charCodeAt(0) % avatarColors.length]
})

function getStatusType(s: string) {
  return ({ ACTIVE: 'success', DISABLED: 'warning', DELETED: 'danger' }[s] || 'info') as 'success' | 'warning' | 'danger' | 'info'
}

function getOrderStatusType(s: string) {
  return ({ PENDING: 'warning', PAID: 'primary', SHIPPED: 'info', COMPLETED: 'success', CANCELLED: 'danger' }[s] || 'info') as 'warning' | 'primary' | 'info' | 'success' | 'danger'
}

function formatDate(d: string) {
  return dayjs(d).format('YYYY-MM-DD HH:mm')
}

async function fetchUser() {
  loading.value = true
  try {
    user.value = await getUserById(userId)
  } catch {
    user.value = null
  } finally {
    loading.value = false
  }
}

async function fetchUserOrders() {
  ordersLoading.value = true
  try {
    const res = await getOrders({ userId, page: orderPage.value, size: orderPageSize })
    userOrders.value = res.records
    orderTotal.value = res.total
  } finally {
    ordersLoading.value = false
  }
}

function openEditDialog() {
  if (!user.value) return
  Object.assign(editForm, {
    nickname: user.value.nickname || '',
    phone: user.value.phone || '',
    email: user.value.email || '',
    password: '',
  })
  editDialogVisible.value = true
}

async function handleEditSubmit() {
  if (!formRef.value) return
  const valid = await formRef.value.validate().catch(() => false)
  if (!valid) return

  editSubmitting.value = true
  try {
    const payload: Record<string, string> = {}
    if (editForm.nickname) payload.nickname = editForm.nickname
    if (editForm.phone) payload.phone = editForm.phone
    if (editForm.email) payload.email = editForm.email
    if (editForm.password) payload.password = editForm.password

    await updateUser(userId, payload)
    ElMessage.success('用户信息已更新')
    editDialogVisible.value = false
    fetchUser()
  } finally {
    editSubmitting.value = false
  }
}

async function handleStatusChange(status: UserStatus) {
  const actionMap = { ACTIVE: '启用', DISABLED: '禁用' }
  const action = actionMap[status] || '修改'
  await ElMessageBox.confirm(`确定要${action}该账户吗？`, '确认操作', { type: 'warning' })
  await updateUserStatus(userId, status)
  ElMessage.success(`账户已${action}`)
  fetchUser()
}

async function handleDelete() {
  await ElMessageBox.confirm(
    '删除后将无法恢复，确定要删除此用户吗？',
    '危险操作',
    { type: 'error', confirmButtonText: '确认删除', confirmButtonClass: 'el-button--danger' }
  )
  await deleteUser(userId)
  ElMessage.success('用户已删除')
  router.push('/users')
}

onMounted(async () => {
  await fetchUser()
  if (user.value) fetchUserOrders()
})
</script>

<style scoped>
.user-detail-page {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.back-nav {
  display: flex;
  align-items: center;
}

.loading-wrapper {
  padding: 20px;
  background: var(--bg-card);
  border-radius: var(--radius-md);
}

.detail-grid {
  display: grid;
  grid-template-columns: 300px 1fr;
  gap: 20px;
  align-items: start;
}

@media (max-width: 900px) {
  .detail-grid {
    grid-template-columns: 1fr;
  }
}

.profile-card {
  display: flex;
  flex-direction: column;
  gap: 0;
}

.profile-avatar-wrap {
  display: flex;
  align-items: center;
  gap: 16px;
  margin-bottom: 16px;
}

.profile-info {}

.profile-name {
  font-size: 18px;
  font-weight: 700;
  margin: 0 0 4px;
}

.profile-username {
  font-size: 13px;
  color: var(--text-secondary);
}

.status-tag {
  align-self: flex-start;
}

.detail-fields {
  display: flex;
  flex-direction: column;
  gap: 12px;
  margin-bottom: 20px;
}

.detail-field {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 13px;
}

.field-label {
  color: var(--text-secondary);
}

.field-value {
  color: var(--text-primary);
  font-weight: 500;
}

.action-buttons {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.action-buttons .el-button {
  width: 100%;
  justify-content: center;
}

.orders-card {}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.card-title {
  font-size: 15px;
  font-weight: 600;
}

.amount {
  color: var(--danger);
  font-weight: 600;
}
</style>
