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
