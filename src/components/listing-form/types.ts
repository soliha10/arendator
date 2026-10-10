import type { CalcMethod, Currency, PlanType } from '@prisma/client'
import { LOCALES, type Locale } from '@/i18n/config'
import { fmt } from '@/i18n/format'
import uzForm from '@/i18n/messages/uz/form'
import ruForm from '@/i18n/messages/ru/form'
import enForm from '@/i18n/messages/en/form'

const AUTO_NAMES: Record<Locale, typeof uzForm.autoName> = {
  uz: uzForm.autoName,
  ru: ruForm.autoName,
  en: enForm.autoName,
}

/** Formadagi shart (barcha raqamlar string — input'lar bilan ishlash uchun) */
export interface PlanDraft {
  key: string
  id?: string
  name: string
  planType: PlanType
  calcMethod: CalcMethod
  downPayment: string
  termMonths: string
  annualRatePercent: string
  monthlyPaymentInput: string
  paymentDay: string
  startDate: string
  depositAmount: string
  /** Kunlik ijara narxi — faqat RENT */
  dailyPayment: string
  insuranceIncluded: boolean
  cascoIncluded: boolean
  maintenanceIncluded: boolean
  mileageLimitPerYear: string
  extraMileageFee: string
  ownershipTransfer: boolean
  earlyPayoffAllowed: boolean
  penaltyPerDay: string
  requiredDocuments: string
  notes: string
  isDefault: boolean
}

export interface ImageDraft {
  url: string
  width?: number
  height?: number
  blurDataUrl?: string
}

export interface ListingFormState {
  id?: string
  title: string
  description: string

  brandId: string
  modelId: string
  year: string
  bodyType: string
  transmission: string
  fuelType: string
  driveType: string
  engineVolume: string
  color: string
  mileage: string
  condition: string
  seats: string

  regionId: string
  address: string
  contactPhone: string
  contactName: string
  telegram: string
  latitude: number | null
  longitude: number | null

  /**
   * Avtomobil narxi — naqd sotuv narxi ham, barcha shartlar uchun
   * asos ham shu. Bitta raqam: xaridor naqd va muddatli narxni
   * bir xil bazadan solishtiradi.
   */
  carPrice: string
  currency: Currency
  hasCashSale: boolean
  isNegotiable: boolean
  features: string[]

  images: ImageDraft[]
  plans: PlanDraft[]
}

let counter = 0
export function newKey(): string {
  counter += 1
  return `p${counter}-${Math.random().toString(36).slice(2, 8)}`
}

export function emptyPlan(overrides: Partial<PlanDraft> = {}): PlanDraft {
  return {
    key: newKey(),
    name: '',
    planType: 'INSTALLMENT',
    calcMethod: 'ANNUITY',
    downPayment: '',
    termMonths: '24',
    annualRatePercent: '24',
    monthlyPaymentInput: '',
    paymentDay: '5',
    startDate: '',
    depositAmount: '',
    dailyPayment: '',
    insuranceIncluded: false,
    cascoIncluded: false,
    maintenanceIncluded: false,
    mileageLimitPerYear: '',
    extraMileageFee: '',
    ownershipTransfer: true,
    earlyPayoffAllowed: true,
    penaltyPerDay: '',
    requiredDocuments: '',
    notes: '',
    isDefault: false,
    ...overrides,
  }
}

export function emptyForm(defaultPhone: string, defaultName: string, locale: Locale = 'uz'): ListingFormState {
  return {
    title: '',
    description: '',
    brandId: '',
    modelId: '',
    year: String(new Date().getFullYear()),
    bodyType: 'SEDAN',
    transmission: 'AUTOMATIC',
    fuelType: 'PETROL',
    driveType: 'FWD',
    engineVolume: '',
    color: '',
    mileage: '0',
    condition: 'USED',
    seats: '5',
    regionId: '',
    address: '',
    contactPhone: defaultPhone,
    contactName: defaultName,
    telegram: '',
    latitude: null,
    longitude: null,
    carPrice: '',
    currency: 'UZS',
    hasCashSale: true,
    isNegotiable: false,
    features: [],
    images: [],
    plans: [installmentPlan(locale, { isDefault: true })],
  }
}

/** Muddatli to'lov / lizing uchun boshlang'ich shart */
export function installmentPlan(locale: Locale, overrides: Partial<PlanDraft> = {}): PlanDraft {
  const termMonths = overrides.termMonths ?? '36'
  return emptyPlan({
    name: autoPlanName({ planType: 'INSTALLMENT', termMonths, ownershipTransfer: true }, locale),
    termMonths,
    annualRatePercent: '24',
    ...overrides,
  })
}

/**
 * Arenda sharti: oylik ijara FIXED usulda kiritiladi, mulk o'tmaydi.
 * Standart muddat 24 oy.
 */
export function rentPlan(locale: Locale, overrides: Partial<PlanDraft> = {}): PlanDraft {
  return emptyPlan({
    name: autoPlanName({ planType: 'RENT', termMonths: '24', ownershipTransfer: false }, locale),
    planType: 'RENT',
    calcMethod: 'FIXED',
    termMonths: '24',
    annualRatePercent: '0',
    downPayment: '0',
    ownershipTransfer: false,
    insuranceIncluded: true,
    ...overrides,
  })
}

/**
 * Avtomatik nom: foydalanuvchi qo'lda o'zgartirmagan bo'lsa yangilanadi.
 * Istalgan tildagi avtomatik nom taniladi — til almashtirilsa ham.
 */
const AUTO_NAME_RES: RegExp[] = LOCALES.flatMap((l) =>
  Object.values(AUTO_NAMES[l]).map(
    (tpl) => new RegExp(`^${tpl.replace(/[.*+?^$()|[\]\\]/g, '\\$&').replace('{n}', '\\d+')}$`),
  ),
)

export function isAutoPlanName(name: string): boolean {
  return AUTO_NAME_RES.some((re) => re.test(name))
}

export function autoPlanName(
  p: Pick<PlanDraft, 'planType' | 'termMonths' | 'ownershipTransfer'>,
  locale: Locale,
): string {
  const t = AUTO_NAMES[locale]
  const n = p.termMonths
  if (p.planType === 'RENT') return fmt(p.ownershipTransfer ? t.rentToOwn : t.rent, { n })
  return fmt(p.planType === 'LEASING' ? t.leasing : t.installment, { n })
}

/** Formani server kutayotgan formatga o'giradi */
export function toPayload(form: ListingFormState, publish: boolean) {
  return {
    id: form.id,
    title: form.title,
    description: form.description || undefined,
    brandId: form.brandId,
    modelId: form.modelId,
    year: form.year,
    bodyType: form.bodyType,
    transmission: form.transmission,
    fuelType: form.fuelType,
    driveType: form.driveType,
    engineVolume: form.engineVolume || undefined,
    color: form.color || undefined,
    mileage: form.mileage || '0',
    condition: form.condition,
    seats: form.seats || '5',
    regionId: form.regionId,
    address: form.address || undefined,
    contactPhone: form.contactPhone,
    contactName: form.contactName || undefined,
    telegram: form.telegram || undefined,
    latitude: form.latitude ?? undefined,
    longitude: form.longitude ?? undefined,
    features: form.features,
    hasCashSale: form.hasCashSale,
    cashPrice: form.hasCashSale ? form.carPrice : undefined,
    cashCurrency: form.currency,
    isNegotiable: form.isNegotiable,
    images: form.images,
    publish,
    plans: form.plans.map((p) => ({
      id: p.id,
      name: p.name,
      planType: p.planType,
      currency: form.currency,
      calcMethod: p.calcMethod,
      carPrice: form.carPrice,
      downPayment: p.downPayment || '0',
      termMonths: p.termMonths,
      annualRatePercent: p.annualRatePercent || '0',
      monthlyPaymentInput: p.monthlyPaymentInput || undefined,
      paymentDay: p.paymentDay || '5',
      startDate: p.startDate || '',
      depositAmount: p.depositAmount || undefined,
      dailyPayment: p.planType === 'RENT' ? p.dailyPayment || undefined : undefined,
      insuranceIncluded: p.insuranceIncluded,
      cascoIncluded: p.cascoIncluded,
      maintenanceIncluded: p.maintenanceIncluded,
      mileageLimitPerYear: p.mileageLimitPerYear || undefined,
      extraMileageFee: p.extraMileageFee || undefined,
      ownershipTransfer: p.ownershipTransfer,
      earlyPayoffAllowed: p.earlyPayoffAllowed,
      penaltyPerDay: p.penaltyPerDay || undefined,
      requiredDocuments: p.requiredDocuments || undefined,
      notes: p.notes || undefined,
      isDefault: p.isDefault,
    })),
  }
}
