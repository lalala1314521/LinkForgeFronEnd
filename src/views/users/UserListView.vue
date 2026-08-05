<template>
  <div class="user-list-page">
    <!-- Page Header -->
    <PageHeader title="用户管理">
      <template #actions>
        <el-tag type="info" round>共 {{ total }} 位用户</el-tag>
        <el-button type="primary" :icon="Plus" @click="openCreateDialog">
          添加用户
        </el-button>
      </template>
    </PageHeader>

    <!-- Filter Bar -->
    <div class="app-card filter-card">
      <el-form :model="queryForm" inline>
        <el-form-item label="关键词">
          <el-input
            v-model="queryForm.keyword"
            placeholder="用户名 / 昵称"
            clearable
            :prefix-icon="Search"
            style="width: 200px"
            @keyup.enter="handleSearch"
          />
        </el-form-item>
        <el-form-item label="状态">
          <el-select v-model="queryForm.status" clearable placeholder="全部状态" style="width: 130px">
            <el-option label="活跃" value="ACTIVE" />
            <el-option label="禁用" value="DISABLED" />
            <el-option label="已删除" value="DELETED" />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" :icon="Search" @click="handleSearch">查询</el-button>
          <el-button :icon="Refresh" @click="handleReset">重置</el-button>
        </el-form-item>
      </el-form>
    </div>

    <!-- Table -->
    <div class="app-card">
      <template v-if="!loading && users.length === 0">
        <EmptyState description="暂无用户数据" />
      </template>
      <template v-else>
        <el-table
          v-loading="loading"
          :data="users"
          stripe
          row-key="id"
          @sort-change="handleSortChange"
        >
          <el-table-column type="index" label="#" width="60" />

          <el-table-column prop="username" label="用户名" min-width="130" sortable="custom">
            <template #default="{ row }">
              <div class="user-cell">
                <AppAvatar :name="row.nickname || row.username" :size="32" />
                <div class="user-cell-info">
                  <span class="user-cell-name">{{ row.username }}</span>
                  <span class="user-cell-nick">{{ row.nickname || '—' }}</span>
                </div>
              </div>
            </template>
          </el-table-column>

          <el-table-column prop="role" label="角色" width="100">
            <template #default="{ row }">
              <el-tag :type="row.role === 'ADMIN' ? 'warning' : 'info'" size="small" round>
                {{ row.role === 'ADMIN' ? '管理员' : '普通用户' }}
              </el-tag>
            </template>
          </el-table-column>

          <el-table-column prop="phone" label="手机号" width="140">
            <template #default="{ row }">{{ row.phone || '—' }}</template>
          </el-table-column>

          <el-table-column prop="email" label="邮箱" min-width="160">
            <template #default="{ row }">{{ row.email || '—' }}</template>
          </el-table-column>

          <el-table-column prop="status" label="状态" width="100">
            <template #default="{ row }">
              <StatusTag :status="row.status" :map="USER_STATUS" size="small" />
            </template>
          </el-table-column>

          <el-table-column prop="createdAt" label="注册时间" width="170" sortable="custom">
            <template #default="{ row }">
              {{ formatDate(row.createdAt) }}
            </template>
          </el-table-column>

          <el-table-column label="操作" width="200" fixed="right">
            <template #default="{ row }">
              <el-button link type="primary" size="small" @click="viewDetail(row.id)">
                详情
              </el-button>
              <el-button link type="primary" size="small" @click="openEditDialog(row)">
                编辑
              </el-button>
              <el-dropdown size="small" @command="(cmd: string) => handleMoreAction(cmd, row)">
                <el-button link type="primary" size="small">
                  更多 <el-icon><ArrowDown /></el-icon>
                </el-button>
                <template #dropdown>
                  <el-dropdown-menu>
                    <el-dropdown-item
                      v-if="row.status !== 'ACTIVE'"
                      command="enable"
                      :icon="CircleCheck"
                    >
                      启用账户
                    </el-dropdown-item>
                    <el-dropdown-item
                      v-if="row.status === 'ACTIVE'"
                      command="disable"
                      :icon="CircleClose"
                    >
                      禁用账户
                    </el-dropdown-item>
                    <el-dropdown-item command="delete" :icon="Delete" class="danger-item">
                      删除用户
                    </el-dropdown-item>
                  </el-dropdown-menu>
                </template>
              </el-dropdown>
            </template>
          </el-table-column>
        </el-table>

        <!-- Pagination -->
        <el-pagination
          v-model:current-page="queryForm.page"
          v-model:page-size="queryForm.size"
          :page-sizes="[10, 20, 50, 100]"
          :total="total"
          layout="total, sizes, prev, pager, next, jumper"
          background
          @size-change="fetchUsers"
          @current-change="fetchUsers"
        />
      </template>
    </div>

    <!-- Create / Edit Dialog（编辑不传 password，后端 UserUpdateRequest 无该字段） -->
    <el-dialog
      v-model="dialogVisible"
      :title="isEdit ? '编辑用户' : '添加用户'"
      width="500px"
      destroy-on-close
    >
      <el-form
        ref="formRef"
        :model="userForm"
        :rules="formRules"
        label-width="80px"
      >
        <el-form-item label="用户名" prop="username">
          <el-input v-model="userForm.username" :disabled="isEdit" placeholder="3-50位，字母数字下划线" />
        </el-form-item>
        <el-form-item v-if="!isEdit" label="密码" prop="password">
          <el-input
            v-model="userForm.password"
            type="password"
            show-password
            placeholder="8位以上，含大小写字母和数字"
          />
        </el-form-item>
        <el-form-item label="昵称" prop="nickname">
          <el-input v-model="userForm.nickname" placeholder="可选" />
        </el-form-item>
        <el-form-item v-if="!isEdit && authStore.isAdmin" label="角色" prop="role">
          <el-select v-model="userForm.role" style="width: 100%">
            <el-option label="普通用户" value="USER" />
            <el-option label="管理员" value="ADMIN" />
          </el-select>
        </el-form-item>
        <el-form-item label="手机号" prop="phone">
          <el-input v-model="userForm.phone" placeholder="可选" />
        </el-form-item>
        <el-form-item label="邮箱" prop="email">
          <el-input v-model="userForm.email" placeholder="可选" />
        </el-form-item>
      </el-form>

      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="submitting" @click="handleSubmit">
          {{ isEdit ? '保存修改' : '创建用户' }}
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Plus, Search, Refresh, Delete, CircleCheck, CircleClose, ArrowDown } from '@element-plus/icons-vue'
import type { FormInstance, FormRules } from 'element-plus'
import PageHeader from '@/components/PageHeader.vue'
import StatusTag from '@/components/StatusTag.vue'
import AppAvatar from '@/components/AppAvatar.vue'
import EmptyState from '@/components/EmptyState.vue'
import { useUserApi } from '@/api/users'
import { useAuthStore } from '@/stores/auth'
import { USER_STATUS } from '@/constants/statusMaps'
import { formatDate } from '@/utils/format'
import type { User, UserStatus, UserRole, UpdateUserRequest, CreateUserRequest } from '@/types'

const router = useRouter()
const authStore = useAuthStore()
const { getUsers, createUser, updateUser, updateUserStatus, deleteUser } = useUserApi()

const loading = ref(false)
const submitting = ref(false)
const dialogVisible = ref(false)
const isEdit = ref(false)
const editId = ref<number | null>(null)
const users = ref<User[]>([])
const total = ref(0)

const queryForm = reactive({
  keyword: '',
  status: '' as UserStatus | '',
  page: 1,
  size: 20,
})

const userForm = reactive({
  username: '',
  password: '',
  nickname: '',
  role: 'USER' as UserRole,
  phone: '',
  email: '',
})

const formRef = ref<FormInstance>()

const formRules: FormRules = {
  username: [
    { required: true, message: '请输入用户名', trigger: 'blur' },
    { min: 3, max: 50, message: '长度为3-50个字符', trigger: 'blur' },
    { pattern: /^[a-zA-Z0-9_]+$/, message: '只能包含字母、数字和下划线', trigger: 'blur' },
  ],
  password: [
    {
      validator: (_rule, value: string, callback) => {
        if (!isEdit.value && !value) {
          callback(new Error('请输入密码'))
        } else if (value && value.length < 8) {
          callback(new Error('密码至少8位'))
        } else if (value && !/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(value)) {
          callback(new Error('必须包含大小写字母和数字'))
        } else {
          callback()
        }
      },
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

async function fetchUsers() {
  loading.value = true
  try {
    const params: Record<string, unknown> = {
      page: queryForm.page,
      size: queryForm.size,
    }
    if (queryForm.keyword) params.keyword = queryForm.keyword
    if (queryForm.status) params.status = queryForm.status

    const res = await getUsers(params as Parameters<typeof getUsers>[0])
    users.value = res.records
    total.value = res.total
  } finally {
    loading.value = false
  }
}

function handleSearch() {
  queryForm.page = 1
  fetchUsers()
}

function handleReset() {
  queryForm.keyword = ''
  queryForm.status = ''
  queryForm.page = 1
  fetchUsers()
}

function handleSortChange() {
  fetchUsers()
}

function viewDetail(id: number) {
  router.push(`/users/${id}`)
}

function openCreateDialog() {
  isEdit.value = false
  editId.value = null
  Object.assign(userForm, { username: '', password: '', nickname: '', role: 'USER', phone: '', email: '' })
  dialogVisible.value = true
}

function openEditDialog(user: User) {
  isEdit.value = true
  editId.value = user.id
  Object.assign(userForm, {
    username: user.username,
    password: '',
    nickname: user.nickname || '',
    phone: user.phone || '',
    email: user.email || '',
  })
  dialogVisible.value = true
}

async function handleSubmit() {
  if (!formRef.value) return
  const valid = await formRef.value.validate().catch(() => false)
  if (!valid) return

  submitting.value = true
  try {
    if (isEdit.value && editId.value) {
      // 编辑：仅提交昵称/手机号/邮箱（后端 UserUpdateRequest 无 password）
      const payload: UpdateUserRequest = {}
      if (userForm.nickname) payload.nickname = userForm.nickname
      if (userForm.phone) payload.phone = userForm.phone
      if (userForm.email) payload.email = userForm.email
      await updateUser(editId.value, payload)
      ElMessage.success('用户信息已更新')
    } else {
      const payload: CreateUserRequest = {
        username: userForm.username,
        password: userForm.password,
        role: userForm.role,
      }
      if (userForm.nickname) payload.nickname = userForm.nickname
      if (userForm.phone) payload.phone = userForm.phone
      if (userForm.email) payload.email = userForm.email
      await createUser(payload)
      ElMessage.success('用户创建成功')
    }
    dialogVisible.value = false
    fetchUsers()
  } finally {
    submitting.value = false
  }
}

async function handleMoreAction(command: string, user: User) {
  if (command === 'enable') {
    await ElMessageBox.confirm(`确定要启用用户 "${user.username}" 吗？`, '确认操作', {
      type: 'warning',
      confirmButtonText: '确认启用',
    })
    await updateUserStatus(user.id, 'ACTIVE')
    ElMessage.success('账户已启用')
    fetchUsers()
  } else if (command === 'disable') {
    await ElMessageBox.confirm(`确定要禁用用户 "${user.username}" 吗？`, '确认操作', {
      type: 'warning',
      confirmButtonText: '确认禁用',
    })
    await updateUserStatus(user.id, 'DISABLED')
    ElMessage.success('账户已禁用')
    fetchUsers()
  } else if (command === 'delete') {
    await ElMessageBox.confirm(
      `删除用户 "${user.username}" 后将无法恢复，确定要删除吗？`,
      '危险操作',
      {
        type: 'error',
        confirmButtonText: '确认删除',
        confirmButtonClass: 'el-button--danger',
      }
    )
    await deleteUser(user.id)
    ElMessage.success('用户已删除')
    fetchUsers()
  }
}

onMounted(fetchUsers)
</script>

<style scoped>
.user-list-page {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.filter-card {
  padding: 16px 20px 0;
}

.user-cell {
  display: flex;
  align-items: center;
  gap: 10px;
}

.user-cell-info {
  display: flex;
  flex-direction: column;
  gap: 1px;
}

.user-cell-name {
  font-weight: 500;
  font-size: 14px;
}

.user-cell-nick {
  font-size: 12px;
  color: var(--text-secondary);
}

:deep(.danger-item) {
  color: var(--danger) !important;
}
</style>
