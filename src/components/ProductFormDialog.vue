<template>
  <el-dialog
    :model-value="modelValue"
    :title="isEdit ? '编辑商品' : '新增商品'"
    width="480px"
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
    </el-form>

    <template #footer>
      <el-button @click="emit('update:modelValue', false)">取消</el-button>
      <el-button type="primary" :loading="submitting" @click="handleSubmit">
        确定
      </el-button>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { ref, reactive, computed } from 'vue'
import type { FormInstance, FormRules } from 'element-plus'
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
  (e: 'submit', payload: { name: string; price: number; stock: number; status: ProductStatus }): void
}>()

const isEdit = computed(() => !!props.product)

const form = reactive<{
  name: string
  price: number | undefined
  stock: number | undefined
  status: ProductStatus
}>({
  name: '',
  price: undefined,
  stock: undefined,
  status: 'ON_SALE',
})

const formRef = ref<FormInstance>()

const rules: FormRules = {
  name: [
    { required: true, message: '请输入商品名称', trigger: 'blur' },
    { max: 100, message: '商品名称最多100个字符', trigger: 'blur' },
  ],
  price: [{ required: true, message: '请输入商品价格', trigger: 'blur' }],
  stock: [{ required: true, message: '请输入库存', trigger: 'blur' }],
}

function handleOpen() {
  if (props.product) {
    form.name = props.product.name
    form.price = Number(props.product.price)
    form.stock = props.product.stock
    form.status = props.product.status
  } else {
    form.name = ''
    form.price = undefined
    form.stock = undefined
    form.status = 'ON_SALE'
  }
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
  })
}
</script>
