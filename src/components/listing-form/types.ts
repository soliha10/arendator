import type { CalcMethod, Currency, PlanType } from '@prisma/client'

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

  /** Barcha shartlar uchun umumiy narx va valyuta */
  carPrice: string
  currency: Currency

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

export function emptyForm(defaultPhone: string, defaultName: string): ListingFormState {
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
    carPrice: '',
    currency: 'UZS',
    images: [],
    plans: [emptyPlan({ name: '24 oylik rassrochka', isDefault: true })],
  }
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
