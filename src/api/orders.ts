import { useAPI } from './request'
import type {
  Order,
  CreateOrderRequest,
  OrderQueryParams,
  PageResult,
} from '@/types'

export function useOrderApi() {
  const { get, post } = useAPI()

  const createOrder = (data: CreateOrderRequest) =>
    post<number>('/orders', data)

  const getOrderById = (id: number) =>
    get<Order>(`/orders/${id}`)

  const getOrders = (params?: OrderQueryParams) =>
    get<PageResult<Order>>('/orders', params as Record<string, unknown>)

  const payOrder = (id: number) =>
    post<void>(`/orders/${id}/pay`)

  const cancelOrder = (id: number) =>
    post<void>(`/orders/${id}/cancel`)

  return {
    createOrder,
    getOrderById,
    getOrders,
    payOrder,
    cancelOrder,
  }
}
