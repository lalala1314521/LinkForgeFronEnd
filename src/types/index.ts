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

/** 游标分页请求（任务5深分页优化，传 lastId 替代 OFFSET） */
export interface CursorPageParams {
  lastId?: number
  size?: number
}

// ===========================
// 后端错误码枚举（与 ErrorCode.java 保持一致）
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
} as const

// ===========================
// User Types
// ===========================

export type UserStatus = 'ACTIVE' | 'DISABLED' | 'DELETED'

export interface User {
  id: number
  username: string
  nickname: string
  phone: string
  email: string
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
}

export interface UpdateUserRequest {
  username?: string
  password?: string
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
  status: OrderStatus
  remark: string
  createdAt: string
  updatedAt: string
}

export interface CreateOrderRequest {
  userId: number
  totalAmount: number
  remark?: string
}

export interface OrderQueryParams {
  userId?: number
  status?: OrderStatus | ''
  page?: number
  size?: number
}

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
}
