import axios, { type AxiosInstance, type AxiosRequestConfig, type InternalAxiosRequestConfig } from 'axios'
import { ElMessage, ElMessageBox } from 'element-plus'
import { useAuthStore } from '@/stores/auth'
import router from '@/router'
import type { ApiResponse } from '@/types'

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
  (error) => {
    return Promise.reject(error)
  }
)

// ===========================
// Response Interceptor
// ===========================

let isShowingSessionExpired = false

request.interceptors.response.use(
  (response) => {
    const res = response.data as ApiResponse

    // Handle business-level errors (HTTP 200 but code !== 200)
    if (res.code !== undefined && res.code !== 200) {
      const errorMsg = res.message || '操作失败'
      ElMessage.error(errorMsg)
      return Promise.reject(new Error(errorMsg))
    }

    return response
  },
  async (error) => {
    const status = error.response?.status
    const message = error.response?.data?.message

    if (status === 401) {
      if (!isShowingSessionExpired) {
        isShowingSessionExpired = true
        try {
          await ElMessageBox.alert(
            '登录已过期，请重新登录',
            '会话超时',
            {
              confirmButtonText: '重新登录',
              type: 'warning',
            }
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

    if (status === 403) {
      ElMessage.error('您没有权限执行此操作')
      return Promise.reject(error)
    }

    if (status === 400) {
      ElMessage.error(message || '请求参数有误')
      return Promise.reject(error)
    }

    if (status === 500) {
      ElMessage.error('服务器内部错误，请稍后重试')
      return Promise.reject(error)
    }

    if (!error.response) {
      ElMessage.error('网络连接失败，请检查网络设置')
      return Promise.reject(error)
    }

    ElMessage.error(message || '请求失败')
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
