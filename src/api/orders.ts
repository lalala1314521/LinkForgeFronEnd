import type { AxiosRequestConfig } from 'axios'
import { useAPI } from './request'
import type {
  Order,
  CreateOrderRequest,
  OrderQueryParams,
  PageResult,
  CursorPageParams,
  CursorPageResponse,
} from '@/types'

export function useOrderApi() {
  const { get, post } = useAPI()

  /** 创建订单：请求体为商品明细 + 可选券 + 备注，金额由服务端计算 */
  const createOrder = (data: CreateOrderRequest, config?: AxiosRequestConfig) =>
    post<number>('/orders', data, config)

  const getOrderById = (id: number) =>
    get<Order>(`/orders/${id}`)

  const getOrders = (params?: OrderQueryParams) =>
    get<PageResult<Order>>('/orders', params as Record<string, unknown>)

  /** 游标分页（深分页优化，列表页暂不切换，API 层提供） */
  const getOrdersByCursor = (params?: CursorPageParams) =>
    get<CursorPageResponse<Order>>('/orders/cursor', params as Record<string, unknown>)

  const payOrder = (id: number) =>
    post<void>(`/orders/${id}/pay`)

  const cancelOrder = (id: number) =>
    post<void>(`/orders/${id}/cancel`)

  return {
    createOrder,
    getOrderById,
    getOrders,
    getOrdersByCursor,
    payOrder,
    cancelOrder,
  }
}
