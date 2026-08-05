// ===========================
// Common API Types
// ===========================

export interface ApiResponse<T = unknown> {
  code: number
  message: string
  data: T
}

export interface PageResult<T> {
  records: T[]
  total: number
  page: number
  size: number
  totalPages: number
}

/** 游标分页请求（深分页优化，传 lastId 替代 OFFSET） */
export interface CursorPageParams {
  lastId?: number
  size?: number
}

/** 游标分页响应（无 total，通过 hasMore 判断是否还有下一页） */
export interface CursorPageResponse<T> {
  records: T[]
  nextLastId: number | null
  hasMore: boolean
}

// ===========================
// 后端错误码枚举（与 common/ErrorCode.java 保持一致）
// ===========================
export const ErrorCodes = {
  SUCCESS: 200,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  INTERNAL_ERROR: 500,
  RATE_LIMIT_EXCEEDED: 429,   // 限流触发
  USER_NOT_FOUND: 1001,
  USER_ALREADY_EXISTS: 1002,
  INVALID_PASSWORD: 1003,
  ACCOUNT_DISABLED: 1004,
  TOKEN_EXPIRED: 1005,
  TOKEN_INVALID: 1006,
  ORDER_NOT_FOUND: 1101,
  ORDER_STATUS_INVALID: 1102,
  ORDER_CREATE_BUSY: 1103,    // 分布式锁：5s内重复提交
  STOCK_INSUFFICIENT: 1201,
  ACTIVITY_NOT_STARTED: 1202,
  ACTIVITY_ENDED: 1203,
  USER_ALREADY_PURCHASED: 1204,
  PRODUCT_NOT_FOUND: 1205,
  COUPON_NOT_FOUND: 1301,
  COUPON_ALREADY_USED: 1302,
  COUPON_EXPIRED: 1303,
  COUPON_NOT_APPLICABLE: 1304,
  COUPON_ALREADY_CLAIMED: 1305,
  COUPON_STOCK_RUN_OUT: 1306,
  SECKILL_REPEAT: 1321,
  SECKILL_STOCK_EMPTY: 1322,
  SEC_ACTIVITY_NOT_STARTED: 1323,
  SEC_ACTIVITY_ENDED: 1324,
  SECKILL_ACTIVITY_NOT_FOUND: 1325,
  SECKILL_STATUS_INVALID: 1326,
} as const

// ===========================
// 状态标签通用类型（StatusTag 组件与 statusMaps 常量）
// ===========================

export type TagType = 'success' | 'warning' | 'info' | 'danger' | 'primary'

export interface StatusMap {
  label: string
  type: TagType
}

// ===========================
// User Types
// ===========================

export type UserStatus = 'ACTIVE' | 'DISABLED' | 'DELETED'
export type UserRole = 'USER' | 'ADMIN'

export interface User {
  id: number
  username: string
  nickname: string
  phone: string
  email: string
  role: UserRole
  status: UserStatus
  createdAt: string
  updatedAt: string
}

export interface CreateUserRequest {
  username: string
  password: string
  nickname?: string
  phone?: string
  email?: string
  /** 角色（可选，仅 ADMIN 可指定 ADMIN，否则后端强制 USER） */
  role?: UserRole
}

/** 后端 UserUpdateRequest 无 password 字段（已核实），修改密码需后端另提供接口 */
export interface UpdateUserRequest {
  nickname?: string
  phone?: string
  email?: string
}

export interface UserQueryParams {
  keyword?: string
  status?: UserStatus | ''
  page?: number
  size?: number
}

// ===========================
// Order Types
// ===========================

export type OrderStatus = 'PENDING' | 'PAID' | 'SHIPPED' | 'COMPLETED' | 'CANCELLED'

export interface Order {
  id: number
  orderNo: string
  userId: number
  totalAmount: number
  couponId?: number
  couponDiscount: number
  finalAmount: number
  status: OrderStatus
  remark: string
  createdAt: string
  updatedAt: string
}

export interface OrderItemRequest {
  productId: number
  quantity: number
}

/** 创建订单：金额由服务端计算，不传 userId/totalAmount */
export interface CreateOrderRequest {
  items: OrderItemRequest[]
  couponId?: number
  remark?: string
}

export interface OrderQueryParams {
  userId?: number
  status?: OrderStatus | ''
  page?: number
  size?: number
}

// ===========================
// Product Types
// ===========================

export type ProductStatus = 'ON_SALE' | 'OFF_SALE'

export interface Product {
  id: number
  name: string
  price: number
  stock: number
  status: ProductStatus
  /** 商品图片URL（/uploads/...，可为空） */
  imageUrl?: string
  createdAt: string
  updatedAt: string
}

export interface ProductCreateRequest {
  name: string
  price: number
  stock: number
  status?: ProductStatus
  imageUrl?: string
}

export interface ProductUpdateRequest {
  name: string
  price: number
  stock: number
  status?: ProductStatus
  imageUrl?: string
}

export interface ProductQueryParams {
  keyword?: string
  status?: ProductStatus | ''
  page?: number
  size?: number
}

// ===========================
// Coupon Types
// ===========================

/** 优惠券模板（GET /api/coupons 返回实体 Coupon，非 CouponResponse） */
export interface CouponTemplate {
  id: number
  name: string
  discount: number
  minAmount: number
  totalCount: number
  usedCount: number
  status: string
  expireAt: string
  createdAt: string
}

export type UserCouponStatus = 'UNUSED' | 'FROZEN' | 'USED' | 'EXPIRED'

/** 我的优惠券实例（id = user_coupons.id，下单 couponId 用这个 id） */
export interface UserCoupon {
  id: number
  userId: number
  couponId: number
  name: string
  discount: number
  minAmount: number
  expireAt: string
  orderNo?: string
  status: UserCouponStatus
  frozenAt?: string
  usedAt?: string
  createdAt: string
}

// ===========================
// Seckill Types
// ===========================

export type SeckillActivityStatus = 'CREATED' | 'ACTIVE' | 'ENDED'

export interface SeckillActivity {
  id: number
  name: string
  productId: number
  seckillPrice: number
  totalStock: number
  availableStock: number
  startTime: string
  endTime: string
  status: SeckillActivityStatus
}

export type SeckillOrderStatus = 'PENDING' | 'PAID' | 'FAILED'

export interface SeckillResult {
  orderNo: string
  activityId: number
  productId: number
  seckillPrice: number
  status: SeckillOrderStatus
}

/** 我的秒杀订单（后端 SeckillOrderResponse，含活动名/商品名） */
export interface SeckillOrder {
  orderNo: string
  activityId: number
  activityName: string
  productId: number
  productName: string
  seckillPrice: number
  status: SeckillOrderStatus
  createdAt: string
}

/** 文件上传结果（后端 Result&lt;String&gt; 的 data，即相对 URL /uploads/xxx） */
export type UploadResult = string

// ===========================
// Auth Types
// ===========================

export interface LoginRequest {
  username: string
  password: string
}

export interface LoginResponse {
  userId: number
  username: string
  nickname: string
  token: string
  expiresIn: number
  /** 角色: USER/ADMIN（旧 localStorage 无此字段 → 按 USER 处理） */
  role: UserRole
}
