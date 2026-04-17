import { useAPI } from './request'
import type { LoginRequest, LoginResponse } from '@/types'

export function useAuthApi() {
  const { post } = useAPI()

  const login = (data: LoginRequest) =>
    post<LoginResponse>('/auth/login', data)

  return { login }
}
