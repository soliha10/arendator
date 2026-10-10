import 'server-only'
import { cache } from 'react'
import type { Prisma } from '@prisma/client'
import { prisma } from '@/lib/prisma'
import type { ListingFilters } from '@/lib/validation/filters'
import {
  LISTING_CARD_SELECT,
  PLAN_SELECT,
  cardExtras,
  dec,
  toListingCardDto,
  toPlanDto,
  type ListingCardDto,
  type ListingDetailDto,
} from './mappers'

/** Filtrlardan Prisma `where` yasaydi */
export function buildListingWhere(f: ListingFilters): Prisma.ListingWhereInput {
  const AND: Prisma.ListingWhereInput[] = [{ status: 'ACTIVE' }]

  if (f.q) {
    const q = f.q
    AND.push({
      OR: [
        { title: { contains: q, mode: 'insensitive' } },
        { description: { contains: q, mode: 'insensitive' } },
        { brand: { name: { contains: q, mode: 'insensitive' } } },
        { model: { name: { contains: q, mode: 'insensitive' } } },
      ],
    })
  }

  if (f.brand.length) AND.push({ brand: { slug: { in: f.brand } } })
  if (f.model.length) AND.push({ model: { slug: { in: f.model } } })
  if (f.region.length) AND.push({ region: { slug: { in: f.region } } })

  if (f.body.length) AND.push({ bodyType: { in: f.body } })
  if (f.transmission.length) AND.push({ transmission: { in: f.transmission } })
  if (f.fuel.length) AND.push({ fuelType: { in: f.fuel } })
  if (f.drive.length) AND.push({ driveType: { in: f.drive } })
  if (f.condition.length) AND.push({ condition: { in: f.condition } })

  // Pul filtrlari denormalizatsiya qilingan ustunlarda — indeks ishlaydi
  if (f.monthlyMin !== undefined || f.monthlyMax !== undefined) {
    AND.push({
      minMonthlyPaymentUzs: {
        ...(f.monthlyMin !== undefined ? { gte: f.monthlyMin } : {}),
        ...(f.monthlyMax !== undefined ? { lte: f.monthlyMax } : {}),
      },
    })
  }
  if (f.downMin !== undefined || f.downMax !== undefined) {
    AND.push({
      minDownPaymentUzs: {
        ...(f.downMin !== undefined ? { gte: f.downMin } : {}),
        ...(f.downMax !== undefined ? { lte: f.downMax } : {}),
      },
    })
  }
  if (f.priceMin !== undefined || f.priceMax !== undefined) {
    AND.push({
      carPriceUzs: {
        ...(f.priceMin !== undefined ? { gte: f.priceMin } : {}),
        ...(f.priceMax !== undefined ? { lte: f.priceMax } : {}),
      },
    })
  }

  // Muddat: e'lonning [minTerm, maxTerm] oralig'i so'ralgan oraliq bilan kesishsin
  if (f.termMin !== undefined) AND.push({ maxTermMonths: { gte: f.termMin } })
  if (f.termMax !== undefined) AND.push({ minTermMonths: { lte: f.termMax } })

  if (f.yearMin !== undefined) AND.push({ year: { gte: f.yearMin } })
  if (f.yearMax !== undefined) AND.push({ year: { lte: f.yearMax } })
  if (f.mileageMax !== undefined) AND.push({ mileage: { lte: f.mileageMax } })

  if (f.planType.length) {
    // CASH — to'lov sharti emas, e'lonning o'z belgisi
    const types = f.planType.filter((t) => t !== 'CASH') as ('INSTALLMENT' | 'RENT' | 'LEASING')[]
    const OR: Prisma.ListingWhereInput[] = []
    if (types.length) OR.push({ plans: { some: { planType: { in: types } } } })
    if (f.planType.includes('CASH')) OR.push({ hasCashSale: true })
    AND.push({ OR })
  }
  if (f.features.length) AND.push({ features: { hasEvery: f.features } })
  if (f.priceDrop) AND.push({ previousPriceUzs: { not: null } })
  if (f.insurance) {
    AND.push({ plans: { some: { insuranceIncluded: true } } })
  }
  if (f.verified) {
    AND.push({ owner: { profile: { isVerified: true } } })
  }

  return { AND }
}

function buildOrderBy(
  sort: ListingFilters['sort'],
): Prisma.ListingOrderByWithRelationInput[] {
  // TOP > VIP > NONE (enum tartibi bo'yicha desc), keyin admin tanlagan e'lonlar
  const featuredFirst: Prisma.ListingOrderByWithRelationInput[] = [
    { promotion: 'desc' },
    { isFeatured: 'desc' },
  ]
  switch (sort) {
    case 'monthly_asc':
      return [...featuredFirst, { minMonthlyPaymentUzs: { sort: 'asc', nulls: 'last' } }]
    case 'monthly_desc':
      return [...featuredFirst, { minMonthlyPaymentUzs: { sort: 'desc', nulls: 'last' } }]
    case 'down_asc':
      return [...featuredFirst, { minDownPaymentUzs: { sort: 'asc', nulls: 'last' } }]
    case 'price_asc':
      return [...featuredFirst, { carPriceUzs: { sort: 'asc', nulls: 'last' } }]
    case 'price_desc':
      return [...featuredFirst, { carPriceUzs: { sort: 'desc', nulls: 'last' } }]
    case 'year_desc':
      return [...featuredFirst, { year: 'desc' }]
    case 'popular':
      return [...featuredFirst, { viewCount: 'desc' }]
    case 'newest':
    default:
      return [...featuredFirst, { publishedAt: { sort: 'desc', nulls: 'last' } }]
  }
}

export interface ListingSearchResult {
  items: ListingCardDto[]
  total: number
  page: number
  perPage: number
  pageCount: number
}

/**
 * Muddati tugagan VIP/TOP'ni oddiy holatga qaytaradi. Cron kerak emas —
 * katalog o'qilganda arzon `updateMany` (odatda 0 qator) ishlaydi.
 */
const expirePromotions = cache(async () => {
  await prisma.listing
    .updateMany({
      where: { promotion: { not: 'NONE' }, promotedUntil: { lt: new Date() } },
      data: { promotion: 'NONE', promotedUntil: null },
    })
    .catch(() => {})
})

export async function searchListings(
  f: ListingFilters,
): Promise<ListingSearchResult> {
  await expirePromotions()
  const where = buildListingWhere(f)
  const skip = (f.page - 1) * f.perPage

  const [rows, total] = await Promise.all([
    prisma.listing.findMany({
      where,
      select: LISTING_CARD_SELECT,
      orderBy: buildOrderBy(f.sort),
      skip,
      take: f.perPage,
    }),
    prisma.listing.count({ where }),
  ])

  return {
    items: rows.map(toListingCardDto),
    total,
    page: f.page,
    perPage: f.perPage,
    pageCount: Math.max(1, Math.ceil(total / f.perPage)),
  }
}

const DETAIL_SELECT = {
  ...LISTING_CARD_SELECT,
  description: true,
  driveType: true,
  engineVolume: true,
  color: true,
  seats: true,
  address: true,
  contactPhone: true,
  contactName: true,
  telegram: true,
  latitude: true,
  longitude: true,
  cashPrice: true,
  cashCurrency: true,
  leadCount: true,
  phoneRevealCount: true,
  priceChangedAt: true,
  priceHistory: {
    orderBy: { createdAt: 'asc' },
    take: 24,
    select: { priceUzs: true, createdAt: true },
  },
  status: true,
  favoriteCount: true,
  images: {
    orderBy: [{ isCover: 'desc' }, { position: 'asc' }],
    select: {
      id: true, url: true, width: true, height: true,
      blurDataUrl: true, isCover: true, position: true,
    },
  },
  plans: {
    orderBy: [{ isDefault: 'desc' }, { termMonths: 'asc' }],
    select: PLAN_SELECT,
  },
  owner: {
    select: {
      id: true, fullName: true, phone: true, createdAt: true,
      accountType: true, telegram: true,
      profile: {
        select: {
          companyName: true, slug: true, logoUrl: true, isVerified: true,
          ratingAvg: true, reviewCount: true, listingCount: true,
          address: true, telegram: true, workingHours: true, tags: true,
        },
      },
    },
  },
} satisfies Prisma.ListingSelect

export async function getListingBySlug(
  slug: string,
): Promise<ListingDetailDto | null> {
  const l = await prisma.listing.findUnique({
    where: { slug },
    select: DETAIL_SELECT,
  })
  if (!l) return null

  return {
    id: l.id,
    slug: l.slug,
    title: l.title,
    description: l.description,
    year: l.year,
    mileage: l.mileage,
    condition: l.condition,
    bodyType: l.bodyType,
    transmission: l.transmission,
    fuelType: l.fuelType,
    driveType: l.driveType,
    engineVolume: dec(l.engineVolume),
    color: l.color,
    seats: l.seats,
    brandName: l.brand.name,
    modelName: l.model.name,
    regionName: l.region.name,
    regionSlug: l.region.slug,
    address: l.address,
    contactPhone: l.contactPhone,
    contactName: l.contactName,
    telegram: l.telegram,
    latitude: l.latitude,
    longitude: l.longitude,
    cashPrice: dec(l.cashPrice),
    cashCurrency: l.cashCurrency,
    leadCount: l.leadCount,
    phoneRevealCount: l.phoneRevealCount,
    priceChangedAt: l.priceChangedAt ? l.priceChangedAt.toISOString() : null,
    priceHistory: l.priceHistory.map((h) => ({
      priceUzs: Number(h.priceUzs),
      createdAt: h.createdAt.toISOString(),
    })),
    status: l.status,
    images: l.images.map((i) => ({
      id: i.id, url: i.url, width: i.width, height: i.height,
      blurDataUrl: i.blurDataUrl, isCover: i.isCover, position: i.position,
    })),
    imageCount: l.images.length,
    plans: l.plans.map(toPlanDto),
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
    favoriteCount: l.favoriteCount,
    publishedAt: l.publishedAt ? l.publishedAt.toISOString() : null,
    ownerVerified: l.owner.profile?.isVerified ?? false,
    ownerName: l.owner.profile?.companyName ?? l.owner.fullName,
    ownerSlug: l.owner.profile?.slug ?? null,
    ownerLogoUrl: l.owner.profile?.logoUrl ?? null,
    ownerPhone: l.contactPhone,
    ...cardExtras(l),
    owner: {
      id: l.owner.id,
      fullName: l.owner.fullName,
      phone: l.owner.phone,
      companyName: l.owner.profile?.companyName ?? null,
      slug: l.owner.profile?.slug ?? null,
      logoUrl: l.owner.profile?.logoUrl ?? null,
      isVerified: l.owner.profile?.isVerified ?? false,
      ratingAvg: l.owner.profile?.ratingAvg ?? 0,
      reviewCount: l.owner.profile?.reviewCount ?? 0,
      listingCount: l.owner.profile?.listingCount ?? 0,
      createdAt: l.owner.createdAt.toISOString(),
      address: l.owner.profile?.address ?? null,
      telegram: l.owner.profile?.telegram ?? l.owner.telegram ?? null,
      workingHours: l.owner.profile?.workingHours ?? null,
      tags: l.owner.profile?.tags ?? [],
      accountType: l.owner.accountType,
    },
  }
}

/** Taqqoslash sahifasi uchun — bir nechta e'lonni id bo'yicha olish */
export async function getListingsForCompare(
  ids: string[],
): Promise<ListingDetailDto[]> {
  if (ids.length === 0) return []
  const rows = await prisma.listing.findMany({
    where: { id: { in: ids.slice(0, 4) }, status: 'ACTIVE' },
    select: { slug: true },
  })
  const details = await Promise.all(rows.map((r) => getListingBySlug(r.slug)))
  const bySlug = details.filter((d): d is ListingDetailDto => d !== null)
  // Foydalanuvchi tanlagan tartibni saqlaymiz
  return ids
    .map((id) => bySlug.find((d) => d.id === id))
    .filter((d): d is ListingDetailDto => d !== undefined)
}

/** Diler sahifasi: egasining faol e'lonlari, avval TOP/VIP */
export async function getActiveListingsByOwner(ownerId: string): Promise<ListingCardDto[]> {
  await expirePromotions()
  const rows = await prisma.listing.findMany({
    where: { ownerId, status: 'ACTIVE' },
    select: LISTING_CARD_SELECT,
    orderBy: [{ promotion: 'desc' }, { publishedAt: { sort: 'desc', nulls: 'last' } }],
  })
  return rows.map(toListingCardDto)
}

/** Bosh sahifa: avval TOP/VIP, keyin tanlangan va eng yangi e'lonlar */
export async function getFeaturedListings(limit = 6): Promise<ListingCardDto[]> {
  await expirePromotions()
  const rows = await prisma.listing.findMany({
    where: { status: 'ACTIVE' },
    select: LISTING_CARD_SELECT,
    orderBy: [
      { promotion: 'desc' },
      { isFeatured: 'desc' },
      { publishedAt: { sort: 'desc', nulls: 'last' } },
    ],
    take: limit,
  })
  return rows.map(toListingCardDto)
}

/** Bosh sahifa: eʼlonlar soni har bir yo'nalish bo'yicha (haqiqiy raqamlar) */
export const getMarketStats = cache(async () => {
  const active = { status: 'ACTIVE' as const }
  const [total, rent, installment, leasing, cash, electric, fresh, dealers, priceDrops] =
    await Promise.all([
      prisma.listing.count({ where: active }),
      prisma.listing.count({ where: { ...active, hasRent: true } }),
      prisma.listing.count({ where: { ...active, plans: { some: { planType: 'INSTALLMENT' } } } }),
      prisma.listing.count({ where: { ...active, plans: { some: { planType: 'LEASING' } } } }),
      prisma.listing.count({ where: { ...active, hasCashSale: true } }),
      prisma.listing.count({ where: { ...active, fuelType: { in: ['ELECTRIC', 'HYBRID'] } } }),
      prisma.listing.count({ where: { ...active, condition: 'NEW' } }),
      prisma.arendatorProfile.count({ where: { isVerified: true } }),
      prisma.listing.count({ where: { ...active, previousPriceUzs: { not: null } } }),
    ])
  return { total, rent, installment, leasing, cash, electric, fresh, dealers, priceDrops }
})

/** Bosh sahifa uchun eng so'nggi e'lonlar */
export async function getLatestListings(limit = 8): Promise<ListingCardDto[]> {
  const rows = await prisma.listing.findMany({
    where: { status: 'ACTIVE' },
    select: LISTING_CARD_SELECT,
    orderBy: { publishedAt: { sort: 'desc', nulls: 'last' } },
    take: limit,
  })
  return rows.map(toListingCardDto)
}

export async function getSimilarListings(
  listing: { id: string; brandId?: string; minMonthlyPaymentUzs: number | null },
  limit = 4,
): Promise<ListingCardDto[]> {
  const monthly = listing.minMonthlyPaymentUzs
  const rows = await prisma.listing.findMany({
    where: {
      status: 'ACTIVE',
      id: { not: listing.id },
      ...(monthly
        ? {
            minMonthlyPaymentUzs: {
              gte: monthly * 0.6,
              lte: monthly * 1.5,
            },
          }
        : {}),
    },
    select: LISTING_CARD_SELECT,
    orderBy: { viewCount: 'desc' },
    take: limit,
  })
  return rows.map(toListingCardDto)
}

/** Ko'rishlar sonini oshiradi (fire-and-forget) */
export async function incrementViewCount(id: string): Promise<void> {
  await prisma.listing
    .update({ where: { id }, data: { viewCount: { increment: 1 } } })
    .catch(() => {})
}

// ── Ma'lumotnomalar (kamdan-kam o'zgaradi — keshlanadi) ──────────

export const getBrands = cache(async () => {
  return prisma.brand.findMany({
    select: {
      id: true, slug: true, name: true,
      _count: { select: { listings: { where: { status: 'ACTIVE' } } } },
    },
    orderBy: { name: 'asc' },
  })
})

export const getBrandsWithModels = cache(async () => {
  return prisma.brand.findMany({
    select: {
      id: true, slug: true, name: true,
      models: {
        select: { id: true, slug: true, name: true },
        orderBy: { name: 'asc' },
      },
    },
    orderBy: { name: 'asc' },
  })
})

export const getRegions = cache(async () => {
  return prisma.region.findMany({
    select: {
      id: true, slug: true, name: true,
      _count: { select: { listings: { where: { status: 'ACTIVE' } } } },
    },
    orderBy: { name: 'asc' },
  })
})

/** Filtr slayderlari uchun real chegaralar */
export const getPriceBounds = cache(async () => {
  const agg = await prisma.listing.aggregate({
    where: { status: 'ACTIVE' },
    _min: { minMonthlyPaymentUzs: true, minDownPaymentUzs: true, carPriceUzs: true, year: true },
    _max: { minMonthlyPaymentUzs: true, minDownPaymentUzs: true, carPriceUzs: true, year: true },
  })
  const currentYear = new Date().getFullYear()
  return {
    monthlyMin: Number(agg._min.minMonthlyPaymentUzs ?? 0),
    monthlyMax: Number(agg._max.minMonthlyPaymentUzs ?? 20_000_000),
    downMin: Number(agg._min.minDownPaymentUzs ?? 0),
    downMax: Number(agg._max.minDownPaymentUzs ?? 300_000_000),
    priceMin: Number(agg._min.carPriceUzs ?? 0),
    priceMax: Number(agg._max.carPriceUzs ?? 1_000_000_000),
    yearMin: agg._min.year ?? 2000,
    yearMax: agg._max.year ?? currentYear,
  }
})
