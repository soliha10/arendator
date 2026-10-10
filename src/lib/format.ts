import type { Currency } from '@prisma/client'
import type { Locale } from '@/i18n/config'
import { plural } from '@/i18n/format'
import { CURRENCY_PRECISION } from './constants'

/**
 * Formatlash Intl'siz yoziladi: Node (server) va brauzer ICU'si bir xil
 * locale uchun turli ajratgich beradi ("1.25" / "1,25") — bu gidratatsiya
 * xatosiga olib keladi. Har bir funksiya oxirgi parametr sifatida tilni
 * oladi; berilmasa — o'zbekcha.
 */

const UNITS: Record<
  Locale,
  {
    sum: string
    thousand: string
    million: string
    billion: string
    decimal: string
    newCar: string
    km: string
  }
> = {
  uz: { sum: 'soʻm', thousand: 'ming', million: 'mln', billion: 'mlrd', decimal: ',', newCar: 'Yangi', km: 'km' },
  ru: { sum: 'сум', thousand: 'тыс.', million: 'млн', billion: 'млрд', decimal: ',', newCar: 'Новый', km: 'км' },
  en: { sum: 'UZS', thousand: 'K', million: 'M', billion: 'B', decimal: '.', newCar: 'New', km: 'km' },
}

/** 1234567 -> "1 234 567" */
function groupDigits(n: number): string {
  const sign = n < 0 ? '-' : ''
  return sign + String(Math.abs(Math.round(n))).replace(/\B(?=(\d{3})+(?!\d))/g, ' ')
}

function trimZeros(n: number, locale: Locale): string {
  const rounded = Math.round(n * 100) / 100
  return String(rounded).replace('.', UNITS[locale].decimal)
}

/** Valyuta belgisi: "soʻm" / "сум" / "UZS" yoki "$" */
export function currencyLabel(currency: Currency = 'UZS', locale: Locale = 'uz'): string {
  return currency === 'USD' ? '$' : UNITS[locale].sum
}

/** 6 661 758 so'm / 6 661 758 сум / 6 661 758 UZS / $1 250.00 */
export function formatMoney(
  value: number | null | undefined,
  currency: Currency = 'UZS',
  options: { compact?: boolean; withSuffix?: boolean; locale?: Locale } = {},
): string {
  if (value === null || value === undefined || Number.isNaN(value)) return '—'
  const { compact = false, withSuffix = true, locale = 'uz' } = options

  if (currency === 'USD') {
    const precision = CURRENCY_PRECISION.USD
    const n = compact
      ? formatCompactUzs(value, 'en')
      : `${groupDigits(Math.trunc(value)).replace(/ /g, ',')}${
          precision ? `.${String(Math.round(Math.abs(value % 1) * 100)).padStart(2, '0')}` : ''
        }`
    return withSuffix ? `$${n}` : n
  }

  const n = compact ? formatCompactUzs(value, locale) : groupDigits(value)
  return withSuffix ? `${n} ${UNITS[locale].sum}` : n
}

/** 180 000 000 -> "180 mln" / "180 млн" / "180M" */
export function formatCompactUzs(value: number, locale: Locale = 'uz'): string {
  const u = UNITS[locale]
  const abs = Math.abs(value)
  const join = (x: string, unit: string) => (locale === 'en' ? `${x}${unit}` : `${x} ${unit}`)
  if (abs >= 1_000_000_000) return join(trimZeros(value / 1_000_000_000, locale), u.billion)
  if (abs >= 1_000_000) return join(trimZeros(value / 1_000_000, locale), u.million)
  if (abs >= 1_000) return join(trimZeros(value / 1_000, locale), u.thousand)
  return String(Math.round(value))
}

/** 12500 -> "12 500 km" */
export function formatMileage(km: number | null | undefined, locale: Locale = 'uz'): string {
  if (km === null || km === undefined) return '—'
  if (km === 0) return UNITS[locale].newCar
  return `${groupDigits(km)} ${UNITS[locale].km}`
}

/** 10.10.2026 — mintaqada odatiy ko'rinish (uchala tilda bir xil) */
export function formatDate(date: Date | string | null | undefined): string {
  if (!date) return '—'
  const d = typeof date === 'string' ? new Date(date) : date
  if (Number.isNaN(d.getTime())) return '—'
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${pad(d.getDate())}.${pad(d.getMonth() + 1)}.${d.getFullYear()}`
}

const MONTHS: Record<Locale, string[]> = {
  uz: ['yanvar', 'fevral', 'mart', 'aprel', 'may', 'iyun', 'iyul', 'avgust', 'sentabr', 'oktabr', 'noyabr', 'dekabr'],
  ru: ['января', 'февраля', 'марта', 'апреля', 'мая', 'июня', 'июля', 'августа', 'сентября', 'октября', 'ноября', 'декабря'],
  en: ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'],
}

const MONTHS_SHORT: Record<Locale, string[]> = {
  uz: ['yan', 'fev', 'mar', 'apr', 'may', 'iyn', 'iyl', 'avg', 'sen', 'okt', 'noy', 'dek'],
  ru: ['янв', 'фев', 'мар', 'апр', 'май', 'июн', 'июл', 'авг', 'сен', 'окт', 'ноя', 'дек'],
  en: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
}

/** Grafik o'qlari uchun: "okt 2026" / "окт 2026" / "Oct 2026" */
export function formatMonthYear(date: Date | string, locale: Locale = 'uz'): string {
  const d = typeof date === 'string' ? new Date(date) : date
  return `${MONTHS_SHORT[locale][d.getMonth()]} ${d.getFullYear()}`
}

/** "5-oktabr 2026" / "5 октября 2026" / "October 5, 2026" */
export function formatDateLong(date: Date | string | null | undefined, locale: Locale = 'uz'): string {
  if (!date) return '—'
  const d = typeof date === 'string' ? new Date(date) : date
  const m = MONTHS[locale][d.getMonth()]
  if (locale === 'en') return `${m} ${d.getDate()}, ${d.getFullYear()}`
  if (locale === 'ru') return `${d.getDate()} ${m} ${d.getFullYear()}`
  return `${d.getDate()}-${m} ${d.getFullYear()}`
}

const RELATIVE = {
  uz: {
    now: 'hozirgina',
    min: { one: '{n} daqiqa oldin' },
    hour: { one: '{n} soat oldin' },
    day: { one: '{n} kun oldin' },
    week: { one: '{n} hafta oldin' },
  },
  ru: {
    now: 'только что',
    min: { one: '{n} минуту назад', few: '{n} минуты назад', many: '{n} минут назад' },
    hour: { one: '{n} час назад', few: '{n} часа назад', many: '{n} часов назад' },
    day: { one: '{n} день назад', few: '{n} дня назад', many: '{n} дней назад' },
    week: { one: '{n} неделю назад', few: '{n} недели назад', many: '{n} недель назад' },
  },
  en: {
    now: 'just now',
    min: { one: '{n} minute ago', other: '{n} minutes ago' },
    hour: { one: '{n} hour ago', other: '{n} hours ago' },
    day: { one: '{n} day ago', other: '{n} days ago' },
    week: { one: '{n} week ago', other: '{n} weeks ago' },
  },
} satisfies Record<Locale, unknown>

/** "2 soat oldin" / "2 часа назад" / "2 hours ago" */
export function formatRelative(date: Date | string | null | undefined, locale: Locale = 'uz'): string {
  if (!date) return '—'
  const d = typeof date === 'string' ? new Date(date) : date
  const r = RELATIVE[locale]
  const min = Math.floor((Date.now() - d.getTime()) / 60_000)
  if (min < 1) return r.now
  if (min < 60) return plural(locale, min, r.min)
  const hours = Math.floor(min / 60)
  if (hours < 24) return plural(locale, hours, r.hour)
  const days = Math.floor(hours / 24)
  if (days < 7) return plural(locale, days, r.day)
  if (days < 31) return plural(locale, Math.floor(days / 7), r.week)
  return formatDate(d)
}

const TERM = {
  uz: { m: { one: '{n} oy' }, y: { one: '{n} yil' } },
  ru: {
    m: { one: '{n} месяц', few: '{n} месяца', many: '{n} месяцев' },
    y: { one: '{n} год', few: '{n} года', many: '{n} лет' },
  },
  en: { m: { one: '{n} month', other: '{n} months' }, y: { one: '{n} year', other: '{n} years' } },
} satisfies Record<Locale, unknown>

/** 24 -> "2 yil", 30 -> "2 yil 6 oy" / "2 года 6 месяцев" / "2 years 6 months" */
export function formatTerm(months: number, locale: Locale = 'uz'): string {
  const t = TERM[locale]
  const years = Math.floor(months / 12)
  const rest = months % 12
  if (years === 0) return plural(locale, months, t.m)
  if (rest === 0) return plural(locale, years, t.y)
  return `${plural(locale, years, t.y)} ${plural(locale, rest, t.m)}`
}

/** Qisqa muddat: "36 oy" / "36 мес." / "36 mo" */
export function formatMonths(months: number, locale: Locale = 'uz'): string {
  return `${months} ${{ uz: 'oy', ru: 'мес.', en: 'mo' }[locale]}`
}

/** +998901234567 -> "+998 90 123 45 67" */
export function formatPhone(phone: string): string {
  const digits = phone.replace(/\D/g, '')
  if (digits.length === 12 && digits.startsWith('998')) {
    return `+998 ${digits.slice(3, 5)} ${digits.slice(5, 8)} ${digits.slice(8, 10)} ${digits.slice(10)}`
  }
  return phone
}

export function formatPercent(value: number, digits = 1, locale: Locale = 'uz'): string {
  const factor = 10 ** digits
  return `${String(Math.round(value * factor) / factor).replace('.', UNITS[locale].decimal)}%`
}

/** 1234 -> "1,2 ming" / "1,2 тыс." / "1.2K" (ko'rishlar soni uchun) */
export function formatCount(n: number, locale: Locale = 'uz'): string {
  if (n < 1000) return String(n)
  return formatCompactUzs(n, locale)
}
