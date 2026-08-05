import { useAPI } from './request'
import type { CouponTemplate, UserCoupon, UserCouponStatus } from '@/types'

/** 优惠券模块：可领列表返回 Coupon 实体；我的券返回 CouponResponse（id 为 user_coupons.id） */
export function useCouponApi() {
  const { get, post } = useAPI()

  const listAvailable = () =>
    get<CouponTemplate[]>('/coupons')

  const claim = (id: number) =>
    post<number>(`/coupons/${id}/claim`)

  const myCoupons = (status?: UserCouponStatus | '') =>
    get<UserCoupon[]>('/coupons/mine', status ? { status } : undefined)

  return {
    listAvailable,
    claim,
    myCoupons,
  }
}
