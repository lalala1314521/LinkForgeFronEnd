import axios, { type AxiosInstance, type AxiosRequestConfig, type InternalAxiosRequestConfig } from 'axios'
import { ElMessage, ElMessageBox, ElNotification } from 'element-plus'
import { useAuthStore } from '@/stores/auth'
import router from '@/router'
import type { ApiResponse } from '@/types'
import { ErrorCodes } from '@/types'

// ===========================
// Create Axios Instance
// ===========================

const request: AxiosInstance = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || '/api',
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
  },
})

// ===========================
// Request Interceptor
// ===========================

request.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const authStore = useAuthStore()
    if (authStore.token) {
      config.headers.Authorization = `Bearer ${authStore.token}`
    }
    return config
  },
  (error) => Promise.reject(error)
)

// ===========================
// Response Interceptor（升级版）
// 新增：429 限流处理、X-Trace-Id 提取、ORDER_CREATE_BUSY 专属提示
// ===========================

let isShowingSessionExpired = false

/** 从响应中提取 TraceId，用于排查问题 */
function getTraceId(error: unknown): string {
  const headers = (error as { response?: { headers?: Record<string, string> } })?.response?.headers
  return headers?.['x-trace-id'] || ''
}

/** 构建带 TraceId 的错误消息（方便排查） */
function withTraceId(msg: string, traceId: string): string {
  return traceId ? `${msg}（TraceId: ${traceId.slice(0, 8)}…）` : msg
}

request.interceptors.response.use(
  (response) => {
    const res = response.data as ApiResponse
    const traceId = response.headers?.['x-trace-id'] || ''

    // 业务层错误（HTTP 200 但 code !== 200）
    if (res.code !== undefined && res.code !== 200) {
      const errorMsg = res.message || '操作失败'

      // 分布式锁触发：订单5秒内重复提交，给专属提示
      if (res.code === ErrorCodes.ORDER_CREATE_BUSY) {
        ElMessage({
          type: 'warning',
          message: '您的订单正在处理中，请勿重复提交（5秒后可重试）',
          duration: 5000,
        })
        const err = new Error(errorMsg) as Error & { code: number; isRateLimit?: boolean }
        err.code = res.code
        err.isRateLimit = true
        return Promise.reject(err)
      }

      ElMessage.error(withTraceId(errorMsg, traceId))
      const err = new Error(errorMsg) as Error & { code: number }
      err.code = res.code
      return Promise.reject(err)
    }

    return response
  },
  async (error) => {
    const status = error.response?.status
    const message = error.response?.data?.message
    const traceId = getTraceId(error)

    // 401 登录过期
    if (status === 401) {
      if (!isShowingSessionExpired) {
        isShowingSessionExpired = true
        try {
          await ElMessageBox.alert(
            '登录已过期，请重新登录',
            '会话超时',
            { confirmButtonText: '重新登录', type: 'warning' }
          )
        } finally {
          isShowingSessionExpired = false
        }
        const authStore = useAuthStore()
        authStore.logout()
        router.push('/login')
      }
      return Promise.reject(error)
    }

    // 429 限流（后端 RateLimitInterceptor 触发）
    if (status === 429) {
      ElNotification({
        title: '请求过于频繁',
        message: message || '操作过于频繁，请稍后重试',
        type: 'warning',
        duration: 5000,
      })
      const err = error as Error & { isRateLimit: boolean }
      err.isRateLimit = true
      return Promise.reject(err)
    }

    if (status === 403) {
      ElMessage.error('您没有权限执行此操作')
      return Promise.reject(error)
    }

    if (status === 400) {
      ElMessage.error(message || '请求参数有误')
      return Promise.reject(error)
    }

    if (status === 500) {
      // 服务器错误附上 TraceId，便于后端排查
      ElMessage.error(withTraceId('服务器内部错误，请稍后重试', traceId))
      return Promise.reject(error)
    }

    if (!error.response) {
      ElMessage.error('网络连接失败，请检查网络设置')
      return Promise.reject(error)
    }

    ElMessage.error(withTraceId(message || '请求失败', traceId))
    return Promise.reject(error)
  }
)

// ===========================
// Typed Request Helpers
// ===========================

export function useAPI() {
  async function get<T>(url: string, params?: Record<string, unknown>, config?: AxiosRequestConfig): Promise<T> {
    const res = await request.get<ApiResponse<T>>(url, { params, ...config })
    return res.data.data as T
  }

  async function post<T>(url: string, data?: unknown, config?: AxiosRequestConfig): Promise<T> {
    const res = await request.post<ApiResponse<T>>(url, data, config)
    return res.data.data as T
  }

  async function put<T>(url: string, data?: unknown, config?: AxiosRequestConfig): Promise<T> {
    const res = await request.put<ApiResponse<T>>(url, data, config)
    return res.data.data as T
  }

  async function patch<T>(url: string, data?: unknown, config?: AxiosRequestConfig): Promise<T> {
    const res = await request.patch<ApiResponse<T>>(url, data, config)
    return res.data.data as T
  }

  async function del<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
    const res = await request.delete<ApiResponse<T>>(url, config)
    return res.data.data as T
  }

  return { get, post, put, patch, del }
}

export default request
