import dayjs from 'dayjs'

/**
 * 日期/金额格式化统一工具
 * 金额：后端 BigDecimal 默认 Jackson 序列化为 number，一律 Number(x) 归一
 */

/** 详情页格式：YYYY-MM-DD HH:mm:ss */
export function formatDateTime(value?: string | number | Date | null): string {
  if (!value) return '—'
  const d = dayjs(value)
  return d.isValid() ? d.format('YYYY-MM-DD HH:mm:ss') : '—'
}

/** 列表页格式：YYYY-MM-DD HH:mm */
export function formatDate(value?: string | number | Date | null): string {
  if (!value) return '—'
  const d = dayjs(value)
  return d.isValid() ? d.format('YYYY-MM-DD HH:mm') : '—'
}

/** 金额展示：¥ 99.00 */
export function formatAmount(value?: number | string | null): string {
  const num = Number(value ?? 0)
  return Number.isFinite(num) ? `¥ ${num.toFixed(2)}` : '¥ 0.00'
}

/** 金额纯数字：99.00（用于表格内无需 ¥ 前缀的场景） */
export function formatAmountPlain(value?: number | string | null): string {
  const num = Number(value ?? 0)
  return Number.isFinite(num) ? num.toFixed(2) : '0.00'
}

/**
 * 图片 URL 归一化：后端返回相对路径 /uploads/xxx，dev 由 vite 代理转发到 8080；
 * 空值/非 http 前缀保持原样返回（外部绝对地址 http(s) 直接可用）。
 */
export function resolveImageUrl(url?: string | null): string {
  if (!url) return ''
  if (url.startsWith('http://') || url.startsWith('https://')) return url
  return url
}
