import { z } from 'zod'
import { LISTING_PAGE_SIZE } from '@/lib/constants'

/** Vergul bilan ajratilgan ro'yxatni massivga aylantiradi: "SEDAN,SUV" */
const csvEnum = <T extends readonly [string, ...string[]]>(values: T) =>
  z
    .string()
    .optional()
    .transform((v) =>
      v
        ? v
            .split(',')
            .map((s) => s.trim())
            .filter((s) => (values as readonly string[]).includes(s))
        : [],
    ) as unknown as z.ZodType<T[number][]>

const csvString = z
  .string()
  .optional()
  .transform((v) => (v ? v.split(',').map((s) => s.trim()).filter(Boolean) : []))

const posNumber = z
  .string()
  .optional()
  .transform((v) => {
    if (!v) return undefined
    const n = Number(v.replace(/[\s ]/g, ''))
    return Number.isFinite(n) && n >= 0 ? n : undefined
  })

const posInt = z
  .string()
  .optional()
  .transform((v) => {
    if (!v) return undefined
    const n = Number.parseInt(v, 10)
    return Number.isFinite(n) && n >= 0 ? n : undefined
  })

/**
 * Katalog filtrlarini URL query'dan o'qiydi.
 * Har bir filtr URL'da saqlanadi — shu sabab natijani ulashish mumkin.
 */
export const listingFiltersSchema = z.object({
  q: z.string().trim().max(100).optional(),

  brand: csvString, // brand slug'lari
  model: csvString, // model slug'lari
  region: csvString, // region slug'lari

  body: csvEnum([
    'SEDAN', 'HATCHBACK', 'SUV', 'CROSSOVER', 'MINIVAN',
    'COUPE', 'PICKUP', 'WAGON', 'VAN',
  ] as const),
  transmission: csvEnum(['MANUAL', 'AUTOMATIC', 'ROBOT', 'VARIATOR'] as const),
  fuel: csvEnum(['PETROL', 'DIESEL', 'GAS_PETROL', 'HYBRID', 'ELECTRIC'] as const),
  drive: csvEnum(['FWD', 'RWD', 'AWD'] as const),
  condition: csvEnum(['NEW', 'USED'] as const),
  planType: csvEnum(['INSTALLMENT', 'RENT', 'LEASING'] as const),

  // Asosiy pul filtrlari (UZS'da) — arendatorlar kiritgan qiymatlar bo'yicha
  monthlyMin: posNumber,
  monthlyMax: posNumber,
  downMin: posNumber,
  downMax: posNumber,
  priceMin: posNumber,
  priceMax: posNumber,

  termMin: posInt,
  termMax: posInt,
  yearMin: posInt,
  yearMax: posInt,
  mileageMax: posInt,

  /** faqat kafolatlangan/tasdiqlangan arendatorlar */
  verified: z
    .string()
    .optional()
    .transform((v) => v === '1' || v === 'true'),
  /** sug'urta narxga kiritilgan */
  insurance: z
    .string()
    .optional()
    .transform((v) => v === '1' || v === 'true'),

  sort: z
    .enum([
      'newest', 'monthly_asc', 'monthly_desc', 'down_asc',
      'price_asc', 'price_desc', 'year_desc', 'popular',
    ])
    .optional()
    .default('newest'),

  page: z
    .string()
    .optional()
    .transform((v) => {
      const n = Number.parseInt(v ?? '1', 10)
      return Number.isFinite(n) && n > 0 ? n : 1
    }),

  perPage: z
    .string()
    .optional()
    .transform((v) => {
      const n = Number.parseInt(v ?? '', 10)
      if (!Number.isFinite(n)) return LISTING_PAGE_SIZE
      return Math.min(Math.max(n, 6), 48)
    }),
})

export type ListingFilters = z.output<typeof listingFiltersSchema>

/** Next.js searchParams -> filtrlar */
export function parseListingFilters(
  searchParams: Record<string, string | string[] | undefined>,
): ListingFilters {
  const flat: Record<string, string | undefined> = {}
  for (const [key, value] of Object.entries(searchParams)) {
    flat[key] = Array.isArray(value) ? value.join(',') : value
  }
  const parsed = listingFiltersSchema.safeParse(flat)
  // Filtrlar hech qachon xato bermasligi kerak — noto'g'ri qiymat shunchaki tashlanadi
  return parsed.success ? parsed.data : listingFiltersSchema.parse({})
}

/** Faol filtrlar sonini hisoblaydi (UI'da "Filtrlar (3)" ko'rsatish uchun) */
export function countActiveFilters(f: ListingFilters): number {
  let count = 0
  const arrays = [
    f.brand, f.model, f.region, f.body, f.transmission,
    f.fuel, f.drive, f.condition, f.planType,
  ]
  for (const arr of arrays) if (arr.length > 0) count += 1

  const scalars = [
    f.q, f.monthlyMin, f.monthlyMax, f.downMin, f.downMax,
    f.priceMin, f.priceMax, f.termMin, f.termMax,
    f.yearMin, f.yearMax, f.mileageMax,
  ]
  for (const v of scalars) if (v !== undefined && v !== '') count += 1

  if (f.verified) count += 1
  if (f.insurance) count += 1

  return count
}
