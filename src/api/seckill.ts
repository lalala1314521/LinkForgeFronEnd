import { useAPI } from './request'
import type { SeckillActivity, SeckillResult } from '@/types'

/** 秒杀模块（用户侧）。管理端 /api/seckill/admin/* 仅 API 层预留，页面不做 */
export function useSeckillApi() {
  const { get, post } = useAPI()

  const listActivities = () =>
    get<SeckillActivity[]>('/seckill/activities')

  const doSeckill = (activityId: number) =>
    post<SeckillResult>(`/seckill/${activityId}`)

  const getOrderStatus = (orderNo: string) =>
    get<SeckillResult>(`/seckill/order/${orderNo}`)

  return {
    listActivities,
    doSeckill,
    getOrderStatus,
  }
}
