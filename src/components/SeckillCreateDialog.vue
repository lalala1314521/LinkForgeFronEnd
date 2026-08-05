<template>
  <el-dialog
    :model-value="modelValue"
    title="创建秒杀活动"
    width="520px"
    destroy-on-close
    @update:model-value="emit('update:modelValue', $event)"
    @open="handleOpen"
  >
    <el-form ref="formRef" :model="form" :rules="rules" label-width="90px">
      <el-form-item label="活动名称" prop="name">
        <el-input
          v-model="form.name"
          placeholder="请输入活动名称"
          :maxlength="100"
          show-word-limit
        />
      </el-form-item>

      <el-form-item label="选择商品" prop="productId">
        <el-select
          v-model="form.productId"
          filterable
          placeholder="选择在售商品"
          style="width: 100%"
          :loading="productsLoading"
        >
          <el-option
            v-for="p in productOptions"
            :key="p.id"
            :value="p.id"
            :label="`${p.name}（¥${Number(p.price).toFixed(2)}，库存 ${p.stock}）`"
          />
        </el-select>
      </el-form-item>

      <el-form-item label="秒杀价" prop="seckillPrice">
        <el-input-number
          v-model="form.seckillPrice"
          :min="0.01"
          :precision="2"
          :step="1"
          style="width: 100%"
        />
      </el-form-item>

      <el-form-item label="库存" prop="totalStock">
        <el-input-number
          v-model="form.totalStock"
          :min="1"
          :precision="0"
          :step="1"
          style="width: 100%"
        />
      </el-form-item>

      <el-form-item label="开始时间" prop="startTime">
        <el-date-picker
          v-model="form.startTime"
          type="datetime"
          placeholder="选择开始时间"
          style="width: 100%"
          :default-time="new Date(2000, 0, 1, 0, 0, 0)"
          value-format="YYYY-MM-DDTHH:mm:ss"
        />
      </el-form-item>

      <el-form-item label="结束时间" prop="endTime">
        <el-date-picker
          v-model="form.endTime"
          type="datetime"
          placeholder="选择结束时间"
          style="width: 100%"
          :default-time="new Date(2000, 0, 1, 23, 59, 59)"
          value-format="YYYY-MM-DDTHH:mm:ss"
        />
      </el-form-item>

      <el-alert
        type="info"
        :closable="false"
        show-icon
        title="创建后活动为「未开始」状态，可在列表中点击「启动」上架"
        style="margin-top: 4px"
      />
    </el-form>

    <template #footer>
      <el-button @click="emit('update:modelValue', false)">取消</el-button>
      <el-button type="primary" :loading="submitting" @click="handleSubmit">
        创建活动
      </el-button>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { ref, reactive } from 'vue'
import { ElMessage } from 'element-plus'
import type { FormInstance, FormRules } from 'element-plus'
import { useProductApi } from '@/api/products'
import { useSeckillApi } from '@/api/seckill'
import type { Product } from '@/types'

const props = withDefaults(defineProps<{
  modelValue: boolean
}>(), {
  modelValue: false,
})

const emit = defineEmits<{
  (e: 'update:modelValue', value: boolean): void
  (e: 'created'): void
}>()

const { getProducts } = useProductApi()
const { createActivity } = useSeckillApi()

const formRef = ref<FormInstance>()
const submitting = ref(false)
const productsLoading = ref(false)
const productOptions = ref<Product[]>([])

const form = reactive<{
  name: string
  productId: number | undefined
  seckillPrice: number | undefined
  totalStock: number | undefined
  startTime: string
  endTime: string
}>({
  name: '',
  productId: undefined,
  seckillPrice: undefined,
  totalStock: undefined,
  startTime: '',
  endTime: '',
})

const rules: FormRules = {
  name: [
    { required: true, message: '请输入活动名称', trigger: 'blur' },
    { max: 100, message: '活动名称最多100个字符', trigger: 'blur' },
  ],
  productId: [{ required: true, message: '请选择商品', trigger: 'change' }],
  seckillPrice: [
    { required: true, message: '请输入秒杀价', trigger: 'blur' },
    {
      validator: (_rule, value: number, callback) => {
        if (value !== undefined && value !== null && Number(value) <= 0) {
          callback(new Error('秒杀价必须大于0'))
        } else {
          callback()
        }
      },
      trigger: 'blur',
    },
  ],
  totalStock: [
    { required: true, message: '请输入库存', trigger: 'blur' },
    {
      validator: (_rule, value: number, callback) => {
        if (value !== undefined && value !== null && Number(value) < 1) {
          callback(new Error('库存至少为1'))
        } else {
          callback()
        }
      },
      trigger: 'blur',
    },
  ],
  startTime: [{ required: true, message: '请选择开始时间', trigger: 'change' }],
  endTime: [
    { required: true, message: '请选择结束时间', trigger: 'change' },
    {
      validator: (_rule, value: string, callback) => {
        if (form.startTime && value && value <= form.startTime) {
          callback(new Error('结束时间必须晚于开始时间'))
        } else {
          callback()
        }
      },
      trigger: 'change',
    },
  ],
}

async function loadProducts() {
  productsLoading.value = true
  try {
    const res = await getProducts({ status: 'ON_SALE', page: 1, size: 100 })
    productOptions.value = res.records
  } catch {
    productOptions.value = []
  } finally {
    productsLoading.value = false
  }
}

function handleOpen() {
  form.name = ''
  form.productId = undefined
  form.seckillPrice = undefined
  form.totalStock = undefined
  form.startTime = ''
  form.endTime = ''
  formRef.value?.clearValidate()
  loadProducts()
}

async function handleSubmit() {
  if (!formRef.value) return
  const valid = await formRef.value.validate().catch(() => false)
  if (!valid) return

  submitting.value = true
  try {
    await createActivity({
      name: form.name,
      seckillPrice: Number(form.seckillPrice ?? 0),
      productId: Number(form.productId),
      totalStock: Number(form.totalStock ?? 0),
      startTime: form.startTime,
      endTime: form.endTime,
    })
    ElMessage.success('秒杀活动创建成功')
    emit('update:modelValue', false)
    emit('created')
  } finally {
    submitting.value = false
  }
}
</script>
