import { defineStore } from 'pinia'
import { ref } from 'vue'

type ThemeMode = 'light' | 'dark'

export const useAppStore = defineStore('app', () => {
  const theme = ref<ThemeMode>((localStorage.getItem('theme') as ThemeMode) || 'light')
  const sidebarCollapsed = ref(false)

  function initTheme() {
    applyTheme(theme.value)
  }

  function toggleTheme() {
    theme.value = theme.value === 'light' ? 'dark' : 'light'
    applyTheme(theme.value)
    localStorage.setItem('theme', theme.value)
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
  }

  return {
    theme,
    sidebarCollapsed,
    initTheme,
    toggleTheme,
    toggleSidebar,
  }
})
