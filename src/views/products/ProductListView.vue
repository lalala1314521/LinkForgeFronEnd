<template>
  <div class="product-list-page">
    <!-- Page Header -->
    <PageHeader title="商品管理">
      <template #actions>
        <el-tag type="info" round>共 {{ total }} 件商品</el-tag>
        <el-button type="primary" :icon="Plus" @click="openCreateDialog">
          新增商品
        </el-button>
      </template>
    </PageHeader>

    <!-- Filter Bar -->
    <div class="app-card filter-card">
      <el-form :model="queryForm" inline>
        <el-form-item label="关键词">
          <el-input
            v-model="queryForm.keyword"
            placeholder="商品名称模糊搜索"
            clearable
            :prefix-icon="Search"
            style="width: 220px"
            @keyup.enter="handleSearch"
          />
        </el-form-item>
        <el-form-item label="状态">
          <el-select v-model="queryForm.status" clearable placeholder="全部状态" style="width: 130px">
            <el-option label="在售" value="ON_SALE" />
            <el-option label="已下架" value="OFF_SALE" />
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
      <template v-if="!loading && products.length === 0">
        <EmptyState description="暂无商品数据" />
      </template>
      <template v-else>
        <el-table
          v-loading="loading"
          :data="products"
          stripe
          row-key="id"
        >
          <el-table-column type="index" label="#" width="60" />

          <el-table-column prop="name" label="商品名称" min-width="180">
            <template #default="{ row }">
              <span class="product-name">{{ row.name }}</span>
            </template>
          </el-table-column>

          <el-table-column prop="price" label="价格" width="120">
            <template #default="{ row }">
              <span class="amount">{{ formatAmount(row.price) }}</span>
            </template>
          </el-table-column>

          <el-table-column prop="stock" label="库存" width="100">
            <template #default="{ row }">
              <el-tag :type="row.stock > 0 ? 'info' : 'danger'" size="small" effect="plain">
                {{ row.stock }}
              </el-tag>
            </template>
          </el-table-column>

          <el-table-column prop="status" label="状态" width="110">
            <template #default="{ row }">
              <StatusTag :status="row.status" :map="PRODUCT_STATUS" size="small" />
            </template>
          </el-table-column>

          <el-table-column prop="createdAt" label="创建时间" width="170">
            <template #default="{ row }">{{ formatDate(row.createdAt) }}</template>
          </el-table-column>

          <el-table-column label="操作" width="160" fixed="right">
            <template #default="{ row }">
              <el-button link type="primary" size="small" @click="openEditDialog(row)">
                编辑
              </el-button>
              <el-button link type="danger" size="small" @click="handleDelete(row)">
                删除
              </el-button>
            </template>
          </el-table-column>
        </el-table>

        <el-pagination
          v-model:current-page="queryForm.page"
          v-model:page-size="queryForm.size"
          :page-sizes="[10, 20, 50, 100]"
          :total="total"
          layout="total, sizes, prev, pager, next, jumper"
          background
          @size-change="fetchProducts"
          @current-change="fetchProducts"
        />
      </template>
    </div>

    <!-- Create / Edit Dialog -->
    <ProductFormDialog
      v-model="dialogVisible"
      :product="editingProduct"
      :submitting="submitting"
      @submit="handleSubmit"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Plus, Search, Refresh } from '@element-plus/icons-vue'
import PageHeader from '@/components/PageHeader.vue'
import StatusTag from '@/components/StatusTag.vue'
import EmptyState from '@/components/EmptyState.vue'
import ProductFormDialog from '@/components/ProductFormDialog.vue'
import { useProductApi } from '@/api/products'
import { PRODUCT_STATUS } from '@/constants/statusMaps'
import { formatAmount, formatDate } from '@/utils/format'
import type { Product, ProductStatus } from '@/types'

const { getProducts, createProduct, updateProduct, deleteProduct } = useProductApi()

const loading = ref(false)
const submitting = ref(false)
const products = ref<Product[]>([])
const total = ref(0)

const queryForm = reactive({
  keyword: '',
  status: '' as ProductStatus | '',
  page: 1,
  size: 10,
})

const dialogVisible = ref(false)
const editingProduct = ref<Product | null>(null)

async function fetchProducts() {
  loading.value = true
  try {
    const params: Record<string, unknown> = {
      page: queryForm.page,
      size: queryForm.size,
    }
    if (queryForm.keyword) params.keyword = queryForm.keyword
    if (queryForm.status) params.status = queryForm.status

    const res = await getProducts(params as Parameters<typeof getProducts>[0])
    products.value = res.records
    total.value = res.total
  } finally {
    loading.value = false
  }
}

function handleSearch() {
  queryForm.page = 1
  fetchProducts()
}

function handleReset() {
  queryForm.keyword = ''
  queryForm.status = ''
  queryForm.page = 1
  fetchProducts()
}

function openCreateDialog() {
  editingProduct.value = null
  dialogVisible.value = true
}

function openEditDialog(product: Product) {
  editingProduct.value = product
  dialogVisible.value = true
}

async function handleSubmit(payload: { name: string; price: number; stock: number; status: ProductStatus }) {
  submitting.value = true
  try {
    if (editingProduct.value) {
      await updateProduct(editingProduct.value.id, payload)
      ElMessage.success('商品已更新')
    } else {
      await createProduct(payload)
      ElMessage.success('商品创建成功')
    }
    dialogVisible.value = false
    fetchProducts()
  } finally {
    submitting.value = false
  }
}

async function handleDelete(product: Product) {
  await ElMessageBox.confirm(
    `确定要删除商品 "${product.name}" 吗？删除后商品将下架（逻辑删除，不可恢复在售状态）。`,
    '危险操作',
    {
      type: 'error',
      confirmButtonText: '确认删除',
      confirmButtonClass: 'el-button--danger',
    }
  )
  await deleteProduct(product.id)
  ElMessage.success('商品已删除')
  fetchProducts()
}

onMounted(fetchProducts)
</script>

<style scoped>
.product-list-page {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.filter-card {
  padding: 16px 20px 0;
}

.product-name {
  font-weight: 500;
}

.amount {
  color: var(--danger);
  font-weight: 600;
}
</style>
