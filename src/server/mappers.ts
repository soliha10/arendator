import type { Prisma } from '@prisma/client'
import type {
  BodyType, CalcMethod, CarCondition, Currency, DriveType,
  FuelType, ListingStatus, PlanType, ScheduleStatus, Transmission,
} from '@prisma/client'

/**
 * Prisma Decimal / Date obyektlarini Client Component'larga uzatib bo'lmaydi.
 * Shu sabab barcha ma'lumot shu yerda oddiy JSON tipiga o'giriladi.
 */

type Dec = Prisma.Decimal | null | undefined

export const dec = (v: Dec): number | null =>
  v === null || v === undefined ? null : Number(v)

export const decOr0 = (v: Dec): number => Number(v ?? 0)

export interface ImageDto {
  id: string
  url: string
  width: number | null
  height: number | null
  blurDataUrl: string | null
  isCover: boolean
  position: number
}

export interface PlanDto {
  schedule: ScheduleRowDto[]
  id: string
  name: string
  planType: PlanType
  currency: Currency
  calcMethod: CalcMethod
  carPrice: number
  downPayment: number
  downPaymentPercent: number
  termMonths: number
  monthlyPayment: number
  totalPayable: number
  markupAmount: number
  markupPercent: number
  monthlyPaymentUzs: number
  downPaymentUzs: number
  carPriceUzs: number
  paymentDay: number
  startDate: string | null
  depositAmount: number | null
  insuranceIncluded: boolean
  cascoIncluded: boolean
  maintenanceIncluded: boolean
  mileageLimitPerYear: number | null
  extraMileageFee: number | null
  ownershipTransfer: boolean
  earlyPayoffAllowed: boolean
  penaltyPerDay: number | null
  requiredDocuments: string | null
  notes: string | null
  isDefault: boolean
}

export interface ScheduleRowDto {
  monthIndex: number
  dueDate: string
  amount: number
  principal: number
  markup: number
  balanceAfter: number
  status: ScheduleStatus
  isCustom: boolean
  note: string | null
}

export interface ListingCardDto {
  id: string
  slug: string
  title: string
  year: number
  mileage: number
  condition: CarCondition
  bodyType: BodyType
  transmission: Transmission
  fuelType: FuelType
  brandName: string
  modelName: string
  regionName: string
  coverImage: ImageDto | null
  imageCount: number
  minMonthlyPaymentUzs: number | null
  minDownPaymentUzs: number | null
  carPriceUzs: number | null
  minTermMonths: number | null
  maxTermMonths: number | null
  hasInstallment: boolean
  hasRent: boolean
  currency: Currency
  isFeatured: boolean
  viewCount: number
  publishedAt: string | null
  ownerVerified: boolean
  ownerName: string
  ownerSlug: string | null
}

export const PLAN_SELECT = {
  id: true, name: true, planType: true, currency: true, calcMethod: true,
  carPrice: true, downPayment: true, termMonths: true, monthlyPayment: true,
  totalPayable: true, markupAmount: true, markupPercent: true,
  carPriceUzs: true, downPaymentUzs: true, monthlyPaymentUzs: true,
  paymentDay: true, startDate: true, depositAmount: true,
  insuranceIncluded: true, cascoIncluded: true, maintenanceIncluded: true,
  mileageLimitPerYear: true, extraMileageFee: true, ownershipTransfer: true,
  earlyPayoffAllowed: true, penaltyPerDay: true, requiredDocuments: true,
  notes: true, isDefault: true,
  schedule: {
    orderBy: { monthIndex: 'asc' },
    select: {
      monthIndex: true, dueDate: true, amount: true, principal: true,
      markup: true, balanceAfter: true, status: true, isCustom: true, note: true,
    },
  },
} satisfies Prisma.RentalPlanSelect

type PlanRow = Prisma.RentalPlanGetPayload<{ select: typeof PLAN_SELECT }>

export function toPlanDto(p: PlanRow): PlanDto {
  const carPrice = decOr0(p.carPrice)
  const downPayment = decOr0(p.downPayment)
  return {
    id: p.id,
    schedule: p.schedule.map((row) => ({
      monthIndex: row.monthIndex,
      dueDate: row.dueDate.toISOString(),
      amount: decOr0(row.amount),
      principal: decOr0(row.principal),
      markup: decOr0(row.markup),
      balanceAfter: decOr0(row.balanceAfter),
      status: row.status,
      isCustom: row.isCustom,
      note: row.note,
    })),
    name: p.name,
    planType: p.planType,
    currency: p.currency,
    calcMethod: p.calcMethod,
    carPrice,
    downPayment,
    downPaymentPercent:
      carPrice > 0 ? Math.round((downPayment / carPrice) * 1000) / 10 : 0,
    termMonths: p.termMonths,
    monthlyPayment: decOr0(p.monthlyPayment),
    totalPayable: decOr0(p.totalPayable),
    markupAmount: decOr0(p.markupAmount),
    markupPercent: decOr0(p.markupPercent),
    monthlyPaymentUzs: decOr0(p.monthlyPaymentUzs),
    downPaymentUzs: decOr0(p.downPaymentUzs),
    carPriceUzs: decOr0(p.carPriceUzs),
    paymentDay: p.paymentDay,
    startDate: p.startDate ? p.startDate.toISOString() : null,
    depositAmount: dec(p.depositAmount),
    insuranceIncluded: p.insuranceIncluded,
    cascoIncluded: p.cascoIncluded,
    maintenanceIncluded: p.maintenanceIncluded,
    mileageLimitPerYear: p.mileageLimitPerYear,
    extraMileageFee: dec(p.extraMileageFee),
    ownershipTransfer: p.ownershipTransfer,
    earlyPayoffAllowed: p.earlyPayoffAllowed,
    penaltyPerDay: dec(p.penaltyPerDay),
    requiredDocuments: p.requiredDocuments,
    notes: p.notes,
    isDefault: p.isDefault,
  }
}

export const LISTING_CARD_SELECT = {
  id: true, slug: true, title: true, year: true, mileage: true,
  condition: true, bodyType: true, transmission: true, fuelType: true,
  minMonthlyPaymentUzs: true, minDownPaymentUzs: true, carPriceUzs: true,
  minTermMonths: true, maxTermMonths: true,
  hasInstallment: true, hasRent: true,
  isFeatured: true, viewCount: true, publishedAt: true,
  brand: { select: { name: true } },
  model: { select: { name: true } },
  region: { select: { name: true } },
  images: {
    orderBy: [{ isCover: 'desc' }, { position: 'asc' }],
    take: 1,
    select: {
      id: true, url: true, width: true, height: true,
      blurDataUrl: true, isCover: true, position: true,
    },
  },
  plans: { select: { currency: true }, take: 1, orderBy: { isDefault: 'desc' } },
  owner: {
    select: {
      fullName: true,
      profile: { select: { isVerified: true, companyName: true, slug: true } },
    },
  },
  _count: { select: { images: true } },
} satisfies Prisma.ListingSelect

type ListingCardRow = Prisma.ListingGetPayload<{ select: typeof LISTING_CARD_SELECT }>

export function toListingCardDto(l: ListingCardRow): ListingCardDto {
  const cover = l.images[0] ?? null
  return {
    id: l.id,
    slug: l.slug,
    title: l.title,
    year: l.year,
    mileage: l.mileage,
    condition: l.condition,
    bodyType: l.bodyType,
    transmission: l.transmission,
    fuelType: l.fuelType,
    brandName: l.brand.name,
    modelName: l.model.name,
    regionName: l.region.name,
    coverImage: cover
      ? {
          id: cover.id, url: cover.url, width: cover.width,
          height: cover.height, blurDataUrl: cover.blurDataUrl,
          isCover: cover.isCover, position: cover.position,
        }
      : null,
    imageCount: l._count.images,
    minMonthlyPaymentUzs: dec(l.minMonthlyPaymentUzs),
    minDownPaymentUzs: dec(l.minDownPaymentUzs),
    carPriceUzs: dec(l.carPriceUzs),
    minTermMonths: l.minTermMonths,
    maxTermMonths: l.maxTermMonths,
    hasInstallment: l.hasInstallment,
    hasRent: l.hasRent,
    currency: l.plans[0]?.currency ?? 'UZS',
    isFeatured: l.isFeatured,
    viewCount: l.viewCount,
    publishedAt: l.publishedAt ? l.publishedAt.toISOString() : null,
    ownerVerified: l.owner.profile?.isVerified ?? false,
    ownerName: l.owner.profile?.companyName ?? l.owner.fullName,
    ownerSlug: l.owner.profile?.slug ?? null,
  }
}

export interface ListingDetailDto extends Omit<ListingCardDto, 'coverImage'> {
  description: string | null
  driveType: DriveType
  engineVolume: number | null
  color: string | null
  seats: number | null
  address: string | null
  contactPhone: string
  contactName: string | null
  status: ListingStatus
  favoriteCount: number
  images: ImageDto[]
  plans: PlanDto[]
  owner: {
    id: string
    fullName: string
    phone: string
    companyName: string | null
    slug: string | null
    logoUrl: string | null
    isVerified: boolean
    ratingAvg: number
    reviewCount: number
    listingCount: number
    createdAt: string
  }
}
