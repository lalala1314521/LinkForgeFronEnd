import { ref, computed } from 'vue'

/**
 * 限流倒计时组合式函数
 * 当接口触发 429 限流时，启动倒计时，期间禁用按钮并显示剩余秒数
 *
 * 使用方式：
 *   const { isLimited, countdown, startCountdown, limitText } = useRateLimit()
 *   // 在 catch 里调用：if (isRateLimit) startCountdown(60)
 *   // 在按钮上绑定：:disabled="isLimited" :loading="isLimited"
 */
export function useRateLimit() {
  const countdown = ref(0)
  const isLimited = computed(() => countdown.value > 0)
  const limitText = computed(() =>
    countdown.value > 0 ? `请 ${countdown.value} 秒后重试` : ''
  )

  let timer: ReturnType<typeof setInterval> | null = null

  /**
   * 启动限流倒计时
   * @param seconds 等待秒数，默认60秒
   */
  function startCountdown(seconds = 60) {
    if (timer) clearInterval(timer)
    countdown.value = seconds
    timer = setInterval(() => {
      countdown.value--
      if (countdown.value <= 0) {
        clearInterval(timer!)
        timer = null
      }
    }, 1000)
  }

  function reset() {
    if (timer) clearInterval(timer)
    timer = null
    countdown.value = 0
  }

  return { isLimited, countdown, limitText, startCountdown, reset }
}
