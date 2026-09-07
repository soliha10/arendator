import type { Currency } from '@prisma/client'
import { CURRENCY_PRECISION } from './constants'

const UZ_LOCALE = 'uz-UZ'

/** 6 661 758 so'm / $1 250.00 */
export function formatMoney(
  value: number | null | undefined,
  currency: Currency = 'UZS',
  options: { compact?: boolean; withSuffix?: boolean } = {},
): string {
  if (value === null || value === undefined || Number.isNaN(value)) return '—'
  const { compact = false, withSuffix = true } = options
  const precision = CURRENCY_PRECISION[currency]

  if (currency === 'USD') {
    const n = new Intl.NumberFormat('en-US', {
      minimumFractionDigits: compact ? 0 : precision,
      maximumFractionDigits: precision,
      notation: compact ? 'compact' : 'standard',
    }).format(value)
    return withSuffix ? `$${n}` : n
  }

  if (compact) {
    return `${formatCompactUzs(value)}${withSuffix ? ' soʻm' : ''}`
  }

  const n = new Intl.NumberFormat(UZ_LOCALE, {
    maximumFractionDigits: 0,
  }).format(Math.round(value))
  // Ba'zi muhitlarda uz-UZ ajratgichi bo'lmasligi mumkin — bo'shliqqa keltiramiz
  const normalized = n.replace(/[ ,]/g, ' ')
  return withSuffix ? `${normalized} soʻm` : normalized
}

/** 180 000 000 -> "180 mln", 1 250 000 000 -> "1,25 mlrd" */
export function formatCompactUzs(value: number): string {
  const abs = Math.abs(value)
  if (abs >= 1_000_000_000) {
    return `${trimZeros(value / 1_000_000_000)} mlrd`
  }
  if (abs >= 1_000_000) {
    return `${trimZeros(value / 1_000_000)} mln`
  }
  if (abs >= 1_000) {
    return `${trimZeros(value / 1_000)} ming`
  }
  return String(Math.round(value))
}

function trimZeros(n: number): string {
  const rounded = Math.round(n * 100) / 100
  return rounded.toLocaleString(UZ_LOCALE, { maximumFractionDigits: 2 })
}

/** 12500 -> "12 500 km" */
export function formatMileage(km: number | null | undefined): string {
  if (km === null || km === undefined) return '—'
  if (km === 0) return 'Yangi'
  return `${new Intl.NumberFormat(UZ_LOCALE).format(km).replace(/[ ,]/g, ' ')} km`
}

/** 10.10.2026 — Oʻzbekistonda odatiy koʻrinish */
export function formatDate(date: Date | string | null | undefined): string {
  if (!date) return '—'
  const d = typeof date === 'string' ? new Date(date) : date
  if (Number.isNaN(d.getTime())) return '—'
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${pad(d.getDate())}.${pad(d.getMonth() + 1)}.${d.getFullYear()}`
}

const MONTHS_UZ = [
  'yanvar', 'fevral', 'mart', 'aprel', 'may', 'iyun',
  'iyul', 'avgust', 'sentabr', 'oktabr', 'noyabr', 'dekabr',
]

/** "5-oktabr 2026" */
export function formatDateLong(date: Date | string | null | undefined): string {
  if (!date) return '—'
  const d = typeof date === 'string' ? new Date(date) : date
  return `${d.getDate()}-${MONTHS_UZ[d.getMonth()]} ${d.getFullYear()}`
}

/** "2 soat oldin", "3 kun oldin" */
export function formatRelative(date: Date | string | null | undefined): string {
  if (!date) return '—'
  const d = typeof date === 'string' ? new Date(date) : date
  const diffMs = Date.now() - d.getTime()
  const min = Math.floor(diffMs / 60_000)
  if (min < 1) return 'hozirgina'
  if (min < 60) return `${min} daqiqa oldin`
  const hours = Math.floor(min / 60)
  if (hours < 24) return `${hours} soat oldin`
  const days = Math.floor(hours / 24)
  if (days < 7) return `${days} kun oldin`
  if (days < 31) return `${Math.floor(days / 7)} hafta oldin`
  return formatDate(d)
}

/** 24 -> "2 yil", 30 -> "2 yil 6 oy", 8 -> "8 oy" */
export function formatTerm(months: number): string {
  const years = Math.floor(months / 12)
  const rest = months % 12
  if (years === 0) return `${months} oy`
  if (rest === 0) return `${years} yil`
  return `${years} yil ${rest} oy`
}

/** +998901234567 -> "+998 90 123 45 67" */
export function formatPhone(phone: string): string {
  const digits = phone.replace(/\D/g, '')
  if (digits.length === 12 && digits.startsWith('998')) {
    return `+998 ${digits.slice(3, 5)} ${digits.slice(5, 8)} ${digits.slice(8, 10)} ${digits.slice(10)}`
  }
  return phone
}

export function formatPercent(value: number, digits = 1): string {
  return `${value.toLocaleString(UZ_LOCALE, { maximumFractionDigits: digits })}%`
}

/** 1234 -> "1.2 ming" (ko'rishlar soni uchun) */
export function formatCount(n: number): string {
  if (n < 1000) return String(n)
  return `${(n / 1000).toFixed(1).replace('.0', '')} ming`
}
