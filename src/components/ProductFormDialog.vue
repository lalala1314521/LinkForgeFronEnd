<template>
  <el-dialog
    :model-value="modelValue"
    :title="isEdit ? '编辑商品' : '新增商品'"
    width="520px"
    destroy-on-close
    @update:model-value="emit('update:modelValue', $event)"
    @open="handleOpen"
  >
    <el-form ref="formRef" :model="form" :rules="rules" label-width="80px">
      <el-form-item label="商品名称" prop="name">
        <el-input
          v-model="form.name"
          placeholder="请输入商品名称"
          :maxlength="100"
          show-word-limit
        />
      </el-form-item>
      <el-form-item label="价格" prop="price">
        <el-input-number
          v-model="form.price"
          :min="0.01"
          :precision="2"
          :step="1"
          style="width: 100%"
        />
      </el-form-item>
      <el-form-item label="库存" prop="stock">
        <el-input-number
          v-model="form.stock"
          :min="0"
          :precision="0"
          :step="1"
          style="width: 100%"
        />
      </el-form-item>
      <el-form-item label="状态" prop="status">
        <el-radio-group v-model="form.status">
          <el-radio-button value="ON_SALE">在售</el-radio-button>
          <el-radio-button value="OFF_SALE">下架</el-radio-button>
        </el-radio-group>
      </el-form-item>

      <el-form-item label="商品图片">
        <div class="upload-wrap">
          <el-upload
            v-model:file-list="fileList"
            list-type="picture-card"
            :limit="1"
            accept=".jpg,.jpeg,.png,.webp"
            :http-request="handleUpload"
            :before-upload="beforeUpload"
            :on-preview="handlePreview"
            :on-remove="handleRemove"
            :on-exceed="handleExceed"
          >
            <el-icon><Plus /></el-icon>
          </el-upload>
          <div class="upload-hint">支持 jpg/jpeg/png/webp，≤5MB；可点击图片预览</div>
        </div>
      </el-form-item>
    </el-form>

    <template #footer>
      <el-button @click="emit('update:modelValue', false)">取消</el-button>
      <el-button type="primary" :loading="submitting" @click="handleSubmit">
        确定
      </el-button>
    </template>

    <!-- 大图预览 -->
    <el-dialog v-model="previewVisible" title="图片预览" width="480px" append-to-body>
      <img v-if="previewUrl" :src="previewUrl" alt="商品图片预览" class="preview-img" />
    </el-dialog>
  </el-dialog>
</template>

<script setup lang="ts">
import { ref, reactive, computed } from 'vue'
import { ElMessage } from 'element-plus'
import { Plus } from '@element-plus/icons-vue'
import type { FormInstance, FormRules, UploadUserFile, UploadRequestOptions, UploadFile } from 'element-plus'
import { useFileApi } from '@/api/files'
import { resolveImageUrl } from '@/utils/format'
import type { Product, ProductStatus } from '@/types'

const props = withDefaults(defineProps<{
  modelValue: boolean
  /** 编辑回填；null/undefined 表示新增 */
  product?: Product | null
  /** 父组件提交中状态（扩展可选，用于按钮 loading） */
  submitting?: boolean
}>(), {
  product: null,
  submitting: false,
})

const emit = defineEmits<{
  (e: 'update:modelValue', value: boolean): void
  (e: 'submit', payload: { name: string; price: number; stock: number; status: ProductStatus; imageUrl?: string }): void
}>()

const { upload } = useFileApi()

const isEdit = computed(() => !!props.product)

const form = reactive<{
  name: string
  price: number | undefined
  stock: number | undefined
  status: ProductStatus
  imageUrl: string
}>({
  name: '',
  price: undefined,
  stock: undefined,
  status: 'ON_SALE',
  imageUrl: '',
})

const formRef = ref<FormInstance>()
const fileList = ref<UploadUserFile[]>([])
const previewVisible = ref(false)
const previewUrl = ref('')

const rules: FormRules = {
  name: [
    { required: true, message: '请输入商品名称', trigger: 'blur' },
    { max: 100, message: '商品名称最多100个字符', trigger: 'blur' },
  ],
  price: [{ required: true, message: '请输入商品价格', trigger: 'blur' }],
  stock: [{ required: true, message: '请输入库存', trigger: 'blur' }],
}

/** 上传前预校验：类型 + 大小（后端同规则兜底） */
function beforeUpload(file: File): boolean {
  const ext = file.name.toLowerCase().split('.').pop() || ''
  const allowedExt = ['jpg', 'jpeg', 'png', 'webp'].includes(ext)
  const allowedType = ['image/jpeg', 'image/png', 'image/webp'].includes(file.type)
  if (!allowedExt || !allowedType) {
    ElMessage.error('仅支持 jpg/jpeg/png/webp 图片')
    return false
  }
  if (file.size > 5 * 1024 * 1024) {
    ElMessage.error('图片大小不能超过 5MB')
    return false
  }
  return true
}

/** 覆盖默认上传：走 /api/files/upload（ADMIN），成功后回填 imageUrl */
async function handleUpload(options: UploadRequestOptions) {
  try {
    const url = await upload(options.file)
    form.imageUrl = url
    ElMessage.success('图片上传成功')
  } catch {
    // 错误提示由 request.ts 拦截器统一处理；移除失败的文件项
    fileList.value = fileList.value.filter(f => f.uid !== options.file.uid)
  }
}

function handlePreview(file: UploadFile) {
  previewUrl.value = file.url || resolveImageUrl(form.imageUrl)
  previewVisible.value = true
}

/** 删除图片：清空 imageUrl（提交时为空串=清空图片） */
function handleRemove() {
  form.imageUrl = ''
  fileList.value = []
}

function handleExceed() {
  ElMessage.warning('最多上传 1 张图片')
}

function handleOpen() {
  if (props.product) {
    form.name = props.product.name
    form.price = Number(props.product.price)
    form.stock = props.product.stock
    form.status = props.product.status
    form.imageUrl = props.product.imageUrl ?? ''
  } else {
    form.name = ''
    form.price = undefined
    form.stock = undefined
    form.status = 'ON_SALE'
    form.imageUrl = ''
  }
  // 回显已有图片（编辑场景）
  fileList.value = form.imageUrl
    ? [{ name: 'product-image', url: resolveImageUrl(form.imageUrl) }]
    : []
  // 下次打开前清除上一次的校验状态
  formRef.value?.clearValidate()
}

async function handleSubmit() {
  if (!formRef.value) return
  const valid = await formRef.value.validate().catch(() => false)
  if (!valid) return
  emit('submit', {
    name: form.name,
    price: Number(form.price ?? 0),
    stock: Number(form.stock ?? 0),
    status: form.status,
    imageUrl: form.imageUrl,
  })
}
</script>

<style scoped>
.upload-wrap {
  width: 100%;
}

.upload-hint {
  font-size: 12px;
  color: var(--text-secondary);
  margin-top: 8px;
  line-height: 1.4;
}

.preview-img {
  width: 100%;
  border-radius: var(--radius-sm);
  display: block;
}
</style>
