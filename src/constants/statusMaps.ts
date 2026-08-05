import type { StatusMap } from '@/types'

/** 订单状态映射（OrderStatus 枚举） */
export const ORDER_STATUS: Record<string, StatusMap> = {
  PENDING: { label: '待支付', type: 'warning' },
  PAID: { label: '已支付', type: 'primary' },
  SHIPPED: { label: '已发货', type: 'info' },
  COMPLETED: { label: '已完成', type: 'success' },
  CANCELLED: { label: '已取消', type: 'danger' },
}

/** 用户状态映射（UserStatus 枚举） */
export const USER_STATUS: Record<string, StatusMap> = {
  ACTIVE: { label: '活跃', type: 'success' },
  DISABLED: { label: '禁用', type: 'warning' },
  DELETED: { label: '已删除', type: 'danger' },
}

/** 商品状态映射 */
export const PRODUCT_STATUS: Record<string, StatusMap> = {
  ON_SALE: { label: '在售', type: 'success' },
  OFF_SALE: { label: '已下架', type: 'info' },
}

/** 我的优惠券状态映射（UserCouponStatus） */
export const COUPON_STATUS: Record<string, StatusMap> = {
  UNUSED: { label: '未使用', type: 'success' },
  FROZEN: { label: '使用中', type: 'warning' },
  USED: { label: '已使用', type: 'info' },
  EXPIRED: { label: '已过期', type: 'danger' },
}

/** 秒杀活动状态映射 */
export const SECKILL_STATUS: Record<string, StatusMap> = {
  CREATED: { label: '未开始', type: 'info' },
  ACTIVE: { label: '进行中', type: 'success' },
  ENDED: { label: '已结束', type: 'danger' },
}

/** 秒杀订单状态映射（SeckillResult.status） */
export const SECKILL_ORDER_STATUS: Record<string, StatusMap> = {
  PENDING: { label: '待支付', type: 'warning' },
  PAID: { label: '已支付', type: 'success' },
  FAILED: { label: '抢购失败', type: 'danger' },
}
