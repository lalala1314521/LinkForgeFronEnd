import { defineStore } from 'pinia'
import { ref } from 'vue'

type ThemeMode = 'light' | 'dark'

const THEME_KEY = 'theme'
const SIDEBAR_KEY = 'sidebar_collapsed'

export const useAppStore = defineStore('app', () => {
  const theme = ref<ThemeMode>((localStorage.getItem(THEME_KEY) as ThemeMode) || 'light')
  // 折叠状态持久化：刷新后保留用户偏好
  const sidebarCollapsed = ref(localStorage.getItem(SIDEBAR_KEY) === '1')

  function initTheme() {
    applyTheme(theme.value)
  }

  function toggleTheme() {
    theme.value = theme.value === 'light' ? 'dark' : 'light'
    applyTheme(theme.value)
    localStorage.setItem(THEME_KEY, theme.value)
  }

  function applyTheme(mode: ThemeMode) {
    if (mode === 'dark') {
      document.documentElement.classList.add('dark')
    } else {
      document.documentElement.classList.remove('dark')
    }
  }

  function toggleSidebar() {
    sidebarCollapsed.value = !sidebarCollapsed.value
    localStorage.setItem(SIDEBAR_KEY, sidebarCollapsed.value ? '1' : '0')
  }

  return {
    theme,
    sidebarCollapsed,
    initTheme,
    toggleTheme,
    toggleSidebar,
  }
})
