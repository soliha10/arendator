/**
 * Enum'lar uchun o'zbekcha nomlar va katalog uchun konstantalar.
 * Bitta joyda saqlanadi — UI ham, validatsiya ham shu ro'yxatdan foydalanadi.
 */
import type {
  BodyType,
  CalcMethod,
  CarCondition,
  Currency,
  DriveType,
  FuelType,
  LeadStatus,
  ListingStatus,
  PlanType,
  Role,
  ScheduleStatus,
  Transmission,
} from '@prisma/client'

export const BODY_TYPE_LABELS: Record<BodyType, string> = {
  SEDAN: 'Sedan',
  HATCHBACK: 'Xetchbek',
  SUV: 'Yoʻltanlamas',
  CROSSOVER: 'Krossover',
  MINIVAN: 'Miniven',
  COUPE: 'Kupe',
  PICKUP: 'Pikap',
  WAGON: 'Universal',
  VAN: 'Furgon',
}

export const TRANSMISSION_LABELS: Record<Transmission, string> = {
  MANUAL: 'Mexanika',
  AUTOMATIC: 'Avtomat',
  ROBOT: 'Robot',
  VARIATOR: 'Variator',
}

export const FUEL_TYPE_LABELS: Record<FuelType, string> = {
  PETROL: 'Benzin',
  DIESEL: 'Dizel',
  GAS_PETROL: 'Gaz / benzin',
  HYBRID: 'Gibrid',
  ELECTRIC: 'Elektr',
}

export const DRIVE_TYPE_LABELS: Record<DriveType, string> = {
  FWD: 'Oldi',
  RWD: 'Orqa',
  AWD: 'Toʻliq',
}

export const CONDITION_LABELS: Record<CarCondition, string> = {
  NEW: 'Yangi',
  USED: 'Ishlatilgan',
}

export const PLAN_TYPE_LABELS: Record<PlanType, string> = {
  INSTALLMENT: 'Rassrochka',
  RENT: 'Arenda',
  LEASING: 'Lizing',
}

export const PLAN_TYPE_HINTS: Record<PlanType, string> = {
  INSTALLMENT: 'Toʻlovlar tugagach avtomobil sizniki boʻladi',
  RENT: 'Avtomobil arendaga beriladi, mulk huquqi oʻtmaydi',
  LEASING: 'Yuridik shaklda lizing shartnomasi',
}

export const CALC_METHOD_LABELS: Record<CalcMethod, string> = {
  ANNUITY: 'Annuitet (qoldiqqa foiz)',
  FLAT: 'Oddiy ustama (butun summaga)',
  FIXED: 'Oylik toʻlovni oʻzim kiritaman',
}

export const CALC_METHOD_HINTS: Record<CalcMethod, string> = {
  ANNUITY:
    'Foiz har oy qolgan qarzga hisoblanadi. Oylik toʻlov teng, ustama kamroq chiqadi.',
  FLAT: 'Foiz butun summaga bir marta qoʻshiladi va oylarga teng boʻlinadi.',
  FIXED:
    'Siz oylik toʻlovni kiritasiz — tizim samarali foiz stavkasini oʻzi hisoblab beradi.',
}

export const LISTING_STATUS_LABELS: Record<ListingStatus, string> = {
  DRAFT: 'Qoralama',
  PENDING: 'Tekshiruvda',
  ACTIVE: 'Faol',
  PAUSED: 'Toʻxtatilgan',
  REJECTED: 'Rad etilgan',
  ARCHIVED: 'Arxivda',
  RENTED: 'Berilgan',
}

export const LEAD_STATUS_LABELS: Record<LeadStatus, string> = {
  NEW: 'Yangi',
  CONTACTED: 'Bogʻlanildi',
  APPROVED: 'Tasdiqlandi',
  REJECTED: 'Rad etildi',
  CANCELLED: 'Bekor qilindi',
}

export const SCHEDULE_STATUS_LABELS: Record<ScheduleStatus, string> = {
  PLANNED: 'Rejada',
  PAID: 'Toʻlangan',
  OVERDUE: 'Muddati oʻtgan',
}

export const ROLE_LABELS: Record<Role, string> = {
  USER: 'Foydalanuvchi',
  ARENDATOR: 'Arendator',
  ADMIN: 'Administrator',
}

export const CURRENCY_LABELS: Record<Currency, string> = {
  UZS: 'soʻm',
  USD: '$',
}

/** Valyutaning kasr xonalari soni */
export const CURRENCY_PRECISION: Record<Currency, 0 | 2> = {
  UZS: 0,
  USD: 2,
}

/** Katalogdagi standart muddat variantlari */
export const TERM_OPTIONS = [6, 12, 18, 24, 36, 48, 60] as const

export const SORT_OPTIONS = [
  { value: 'newest', label: 'Avval yangilari' },
  { value: 'monthly_asc', label: 'Oylik toʻlov: arzondan' },
  { value: 'monthly_desc', label: 'Oylik toʻlov: qimmatdan' },
  { value: 'down_asc', label: 'Boshlangʻich toʻlov: arzondan' },
  { value: 'price_asc', label: 'Narx: arzondan' },
  { value: 'price_desc', label: 'Narx: qimmatdan' },
  { value: 'year_desc', label: 'Yil: yangidan' },
  { value: 'popular', label: 'Ommabop' },
] as const

export type SortOption = (typeof SORT_OPTIONS)[number]['value']

/** Taqqoslashga maksimal nechta e'lon qo'shish mumkin */
export const MAX_COMPARE_ITEMS = 4

/** Bir e'longa maksimal rasm */
export const MAX_LISTING_IMAGES = 15

/**
 * Bitta rasmning maksimal hajmi.
 * Serverless funksiyaning so'rov tanasi limiti (Vercel'da ~4.5 MB) dan
 * past turishi kerak — aks holda so'rov kodga yetib bormay 413 bo'ladi.
 */
export const MAX_UPLOAD_MB = 4
export const MAX_UPLOAD_BYTES = MAX_UPLOAD_MB * 1024 * 1024

/** Bir e'longa maksimal to'lov sharti */
export const MAX_PLANS_PER_LISTING = 6

export const LISTING_PAGE_SIZE = 12

/** E'lon nechchi kun faol turadi */
export const LISTING_ACTIVE_DAYS = 30

/**
 * Avtomobil qulayliklari. Kalit bazada saqlanadi (Listing.features),
 * nom faqat UI'da — tarjima qo'shilganda bazaga tegilmaydi.
 */
export const FEATURE_OPTIONS = [
  { key: 'climate', label: 'Konditsioner / Klimat' },
  { key: 'sunroof', label: 'Panorama / lyuk' },
  { key: 'cruise', label: 'Kruiz nazorati' },
  { key: 'camera', label: 'Orqa kamera / 360°' },
  { key: 'parking_sensors', label: 'Parktronik' },
  { key: 'heated_seats', label: 'Oʻrindiq isitish' },
  { key: 'leather', label: 'Charm salon' },
  { key: 'keyless', label: 'Kalitsiz kirish / Start-stop' },
  { key: 'carplay', label: 'CarPlay / Android Auto' },
  { key: 'alarm', label: 'Signalizatsiya' },
  { key: 'tint', label: 'Tonirovka ruxsati' },
  { key: 'gas', label: 'Gaz uskunasi (metan/propan)' },
  { key: 'no_paint', label: 'Kraska tegmagan' },
  { key: 'warranty', label: 'Rasmiy kafolat' },
] as const

export type FeatureKey = (typeof FEATURE_OPTIONS)[number]['key']

export const FEATURE_LABELS: Record<string, string> = Object.fromEntries(
  FEATURE_OPTIONS.map((f) => [f.key, f.label]),
)

/** Katalog va bosh sahifadagi bitim turlari (CASH — naqd sotuv) */
export const DEAL_TYPES = [
  { value: 'RENT', label: 'Arenda / Ijara', short: 'Arenda' },
  { value: 'INSTALLMENT', label: 'Muddatli toʻlov (Rassrochka)', short: 'Rassrochka' },
  { value: 'LEASING', label: 'Lizing', short: 'Lizing' },
  { value: 'CASH', label: 'Naqd sotuv', short: 'Naqd' },
] as const

export const PROMOTION_PLANS = [
  {
    tier: 'VIP' as const,
    days: 7,
    priceUzs: 49_000,
    title: 'VIP eʼlon',
    hint: 'Qidiruvda yuqorida va rangli ramka bilan',
  },
  {
    tier: 'TOP' as const,
    days: 3,
    priceUzs: 120_000,
    title: 'TOP eʼlon',
    hint: 'Bosh sahifa va katalogning eng tepasida',
  },
]

export const ACCOUNT_TYPE_LABELS = {
  INDIVIDUAL: 'Jismoniy shaxs',
  BUSINESS: 'Yuridik shaxs (diler / avtosalon)',
} as const
