import { z } from 'zod'
import { MAX_LISTING_IMAGES, MAX_PLANS_PER_LISTING } from '@/lib/constants'
import { numericString, phoneSchema } from './common'

const CURRENT_YEAR = new Date().getFullYear()

export const planSchema = z
  .object({
    id: z.string().optional(), // tahrirlashda mavjud shart
    name: z.string().trim().min(2, 'Shart nomini kiriting').max(80),
    planType: z.enum(['INSTALLMENT', 'RENT', 'LEASING']).default('INSTALLMENT'),
    currency: z.enum(['UZS', 'USD']).default('UZS'),
    calcMethod: z.enum(['ANNUITY', 'FLAT', 'FIXED']).default('ANNUITY'),

    carPrice: numericString({ min: 1, label: 'Avtomobil narxi' }),
    downPayment: numericString({ min: 0, label: 'Boshlangʻich toʻlov' }),
    termMonths: numericString({
      min: 1,
      max: 120,
      int: true,
      label: 'Muddat',
    }),
    annualRatePercent: numericString({ min: 0, max: 300, label: 'Yillik foiz' })
      .optional()
      .default(0),
    monthlyPaymentInput: numericString({ min: 0, label: 'Oylik toʻlov' }).optional(),

    paymentDay: numericString({ min: 1, max: 28, int: true, label: 'Toʻlov kuni' })
      .optional()
      .default(5),
    startDate: z
      .union([z.literal(''), z.iso.date()])
      .optional()
      .transform((v) => (v ? new Date(v) : undefined)),

    depositAmount: numericString({ min: 0, label: 'Zalog' }).optional(),
    /** Kunlik ijara narxi — faqat arenda uchun, ixtiyoriy */
    dailyPayment: numericString({ min: 0, label: 'Kunlik ijara' }).optional(),
    insuranceIncluded: z.coerce.boolean().default(false),
    cascoIncluded: z.coerce.boolean().default(false),
    maintenanceIncluded: z.coerce.boolean().default(false),
    mileageLimitPerYear: numericString({
      min: 0,
      max: 500_000,
      int: true,
      label: 'Yillik km limiti',
    }).optional(),
    extraMileageFee: numericString({ min: 0, label: 'Ortiqcha km narxi' }).optional(),
    ownershipTransfer: z.coerce.boolean().default(true),
    earlyPayoffAllowed: z.coerce.boolean().default(true),
    penaltyPerDay: numericString({ min: 0, label: 'Kunlik jarima' }).optional(),
    requiredDocuments: z.string().trim().max(1000).optional(),
    notes: z.string().trim().max(1000).optional(),
    isDefault: z.coerce.boolean().default(false),
  })
  .refine((p) => p.downPayment < p.carPrice, {
    message: 'Boshlangʻich toʻlov avtomobil narxidan kam boʻlishi kerak',
    path: ['downPayment'],
  })
  .refine(
    (p) => p.calcMethod !== 'FIXED' || (p.monthlyPaymentInput ?? 0) > 0,
    {
      message: 'Oylik toʻlovni kiriting',
      path: ['monthlyPaymentInput'],
    },
  )
  .refine(
    // Arendada mulk o'tmaydi — oylik to'lov qarzni yopishi shart emas
    (p) =>
      p.calcMethod !== 'FIXED' ||
      p.planType === 'RENT' ||
      (p.monthlyPaymentInput ?? 0) * p.termMonths >= (p.carPrice - p.downPayment) * 0.5,
    {
      message:
        'Oylik toʻlov juda kichik — bu muddatda qarz yopilmaydi. Muddatni yoki summani tekshiring.',
      path: ['monthlyPaymentInput'],
    },
  )

export type PlanInput = z.input<typeof planSchema>
export type PlanOutput = z.output<typeof planSchema>

export const listingImageSchema = z.object({
  url: z.string().min(1),
  width: z.number().int().positive().optional(),
  height: z.number().int().positive().optional(),
  blurDataUrl: z.string().optional(),
})

const optionalCoord = (min: number, max: number) =>
  z
    .union([z.number(), z.string(), z.null()])
    .optional()
    .transform((v) => {
      if (v === null || v === undefined || v === '') return undefined
      const n = Number(v)
      return Number.isFinite(n) && n >= min && n <= max ? n : undefined
    })

export const listingSchema = z.object({
  id: z.string().optional(),

  title: z
    .string()
    .trim()
    .min(6, 'Sarlavha kamida 6 ta belgidan iborat boʻlsin')
    .max(120, 'Sarlavha juda uzun'),
  description: z.string().trim().max(5000).optional(),

  brandId: z.string().min(1, 'Markani tanlang'),
  modelId: z.string().min(1, 'Modelni tanlang'),
  year: numericString({
    min: 1980,
    max: CURRENT_YEAR + 1,
    int: true,
    label: 'Ishlab chiqarilgan yil',
  }),
  bodyType: z.enum([
    'SEDAN', 'HATCHBACK', 'SUV', 'CROSSOVER', 'MINIVAN',
    'COUPE', 'PICKUP', 'WAGON', 'VAN',
  ]),
  transmission: z.enum(['MANUAL', 'AUTOMATIC', 'ROBOT', 'VARIATOR']),
  fuelType: z.enum(['PETROL', 'DIESEL', 'GAS_PETROL', 'HYBRID', 'ELECTRIC']),
  driveType: z.enum(['FWD', 'RWD', 'AWD']),
  engineVolume: numericString({ min: 0, max: 10, label: 'Dvigatel hajmi' }).optional(),
  color: z.string().trim().max(40).optional(),
  mileage: numericString({
    min: 0,
    max: 2_000_000,
    int: true,
    label: 'Yurgan masofa',
  }).default(0),
  condition: z.enum(['NEW', 'USED']).default('USED'),
  seats: numericString({ min: 1, max: 30, int: true, label: 'Oʻrindiqlar' })
    .optional()
    .default(5),

  regionId: z.string().min(1, 'Viloyatni tanlang'),
  address: z.string().trim().max(200).optional(),
  contactPhone: phoneSchema,
  contactName: z.string().trim().max(80).optional(),
  telegram: z
    .string()
    .trim()
    .max(40)
    .optional()
    .transform((v) => (v ? v.replace(/^@/, '').replace(/^https?:\/\/t\.me\//, '') : undefined))
    .refine((v) => !v || /^[A-Za-z0-9_]{4,32}$/.test(v), 'Telegram username notoʻgʻri'),
  latitude: optionalCoord(-90, 90),
  longitude: optionalCoord(-180, 180),

  features: z.array(z.string().max(40)).max(40).default([]),

  hasCashSale: z.coerce.boolean().default(false),
  cashPrice: numericString({ min: 0, label: 'Naqd narx' }).optional(),
  cashCurrency: z.enum(['UZS', 'USD']).default('UZS'),
  isNegotiable: z.coerce.boolean().default(false),

  images: z
    .array(listingImageSchema)
    .min(1, 'Kamida bitta rasm yuklang')
    .max(MAX_LISTING_IMAGES, `Koʻpi bilan ${MAX_LISTING_IMAGES} ta rasm`),

  plans: z
    .array(planSchema)
    .max(MAX_PLANS_PER_LISTING, `Koʻpi bilan ${MAX_PLANS_PER_LISTING} ta shart`),

  /** true — darhol moderatsiyaga yuboriladi, false — qoralama */
  publish: z.coerce.boolean().default(true),
})
  .refine((d) => d.plans.length > 0 || d.hasCashSale, {
    message: 'Kamida bitta sotuv formatini tanlang: naqd, muddatli toʻlov yoki arenda',
    path: ['plans'],
  })
  .refine((d) => !d.hasCashSale || (d.cashPrice ?? 0) > 0, {
    message: 'Naqd sotuv narxini kiriting',
    path: ['cashPrice'],
  })

export type ListingInput = z.input<typeof listingSchema>
export type ListingOutput = z.output<typeof listingSchema>

export const moderationSchema = z.object({
  listingId: z.string().min(1),
  action: z.enum(['approve', 'reject']),
  reason: z.string().trim().max(500).optional(),
}).refine((d) => d.action !== 'reject' || (d.reason && d.reason.length >= 5), {
  message: 'Rad etish sababini yozing',
  path: ['reason'],
})
