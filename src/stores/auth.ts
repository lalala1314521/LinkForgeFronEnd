import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { LoginResponse } from '@/types'

const TOKEN_KEY = 'auth_token'
const USER_KEY = 'auth_user'

export const useAuthStore = defineStore('auth', () => {
  const token = ref<string>(localStorage.getItem(TOKEN_KEY) || '')
  const user = ref<LoginResponse | null>(
    JSON.parse(localStorage.getItem(USER_KEY) || 'null')
  )

  const isLoggedIn = computed(() => !!token.value)
  const userId = computed(() => user.value?.userId ?? null)
  const username = computed(() => user.value?.username ?? '')
  const nickname = computed(() => user.value?.nickname ?? user.value?.username ?? '')

  function setAuth(loginData: LoginResponse) {
    token.value = loginData.token
    user.value = loginData
    localStorage.setItem(TOKEN_KEY, loginData.token)
    localStorage.setItem(USER_KEY, JSON.stringify(loginData))
  }

  function logout() {
    token.value = ''
    user.value = null
    localStorage.removeItem(TOKEN_KEY)
    localStorage.removeItem(USER_KEY)
  }

  return {
    token,
    user,
    isLoggedIn,
    userId,
    username,
    nickname,
    setAuth,
    logout,
  }
})
