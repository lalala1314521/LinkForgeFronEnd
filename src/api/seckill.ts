import { useAPI } from './request'
import type { SeckillActivity, SeckillResult, SeckillOrder, PageResult } from '@/types'

/** 秒杀模块（用户侧 + 管理侧）。管理端 /api/seckill/admin/* 仅 ADMIN 可调用（后端 403 拦截兜底） */
export function useSeckillApi() {
  const { get, post, put } = useAPI()

  const listActivities = () =>
    get<SeckillActivity[]>('/seckill/activities')

  const doSeckill = (activityId: number) =>
    post<SeckillResult>(`/seckill/${activityId}`)

  const getOrderStatus = (orderNo: string) =>
    get<SeckillResult>(`/seckill/order/${orderNo}`)

  /** 我的秒杀订单列表（含活动名/商品名） */
  const getMyOrders = () =>
    get<SeckillOrder[]>('/seckill/orders/mine')

  /** 秒杀订单支付（PENDING→PAID，发积分） */
  const payOrder = (orderNo: string) =>
    post<void>(`/seckill/orders/${orderNo}/pay`)

  /** 秒杀订单取消（PENDING→CANCELLED，回补库存释放名额） */
  const cancelOrder = (orderNo: string) =>
    post<void>(`/seckill/orders/${orderNo}/cancel`)

  /** 管理端：创建活动 */
  const createActivity = (data: {
    name: string
    seckillPrice: number
    productId: number
    totalStock: number
    startTime: string
    endTime: string
  }) =>
    post<number>('/seckill/admin/activities', data)

  /** 管理端：活动分页查询（可按状态过滤） */
  const queryActivities = (params?: { status?: string; page?: number; size?: number }) =>
    get<PageResult<SeckillActivity>>('/seckill/admin/activities', params as Record<string, unknown>)

  /** 管理端：启动/下架（ACTIVE=上架，ENDED=下架） */
  const updateActivityStatus = (id: number, targetStatus: 'ACTIVE' | 'ENDED') =>
    put<void>(`/seckill/admin/activities/${id}/status`, { targetStatus })

  return {
    listActivities,
    doSeckill,
    getOrderStatus,
    getMyOrders,
    payOrder,
    cancelOrder,
    createActivity,
    queryActivities,
    updateActivityStatus,
  }
}
