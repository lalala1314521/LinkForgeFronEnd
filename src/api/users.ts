import { useAPI } from './request'
import type {
  User,
  CreateUserRequest,
  UpdateUserRequest,
  UserQueryParams,
  PageResult,
  UserStatus,
} from '@/types'

export function useUserApi() {
  const { get, post, put, patch, del } = useAPI()

  const createUser = (data: CreateUserRequest) =>
    post<number>('/users', data)

  const getUserById = (id: number) =>
    get<User>(`/users/${id}`)

  const getUsers = (params?: UserQueryParams) =>
    get<PageResult<User>>('/users', params as Record<string, unknown>)

  /** 后端 UserUpdateRequest 无 password，仅更新昵称/手机号/邮箱 */
  const updateUser = (id: number, data: UpdateUserRequest) =>
    put<void>(`/users/${id}`, data)

  const updateUserStatus = (id: number, status: UserStatus) =>
    patch<void>(`/users/${id}/status`, null, { params: { status } })

  const deleteUser = (id: number) =>
    del<void>(`/users/${id}`)

  return {
    createUser,
    getUserById,
    getUsers,
    updateUser,
    updateUserStatus,
    deleteUser,
  }
}
