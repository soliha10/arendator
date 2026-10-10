import 'server-only'
import { cache } from 'react'
import type { Prisma } from '@prisma/client'
import { prisma } from '@/lib/prisma'
import { LISTING_CARD_SELECT, toListingCardDto, type ListingCardDto } from './mappers'

export interface ArendatorCardDto {
  id: string
  slug: string
  companyName: string
  logoUrl: string | null
  about: string | null
  regionName: string | null
  /** Tarjima uchun: messages.enums.region[regionSlug] */
  regionSlug: string | null
  isVerified: boolean
  ratingAvg: number
  reviewCount: number
  listingCount: number
  minMonthlyUzs: number | null
}

const PROFILE_SELECT = {
  id: true, slug: true, companyName: true, logoUrl: true, about: true,
  isVerified: true, ratingAvg: true, reviewCount: true, listingCount: true,
  region: { select: { name: true, slug: true } },
  user: {
    select: {
      listings: {
        where: { status: 'ACTIVE' as const },
        select: { minMonthlyPaymentUzs: true },
        orderBy: { minMonthlyPaymentUzs: { sort: 'asc' as const, nulls: 'last' as const } },
        take: 1,
      },
    },
  },
}

type ProfileRow = {
  id: string; slug: string; companyName: string; logoUrl: string | null
  about: string | null; isVerified: boolean; ratingAvg: number
  reviewCount: number; listingCount: number
  region: { name: string; slug: string } | null
  user: { listings: { minMonthlyPaymentUzs: unknown }[] }
}

function toCard(p: ProfileRow): ArendatorCardDto {
  const min = p.user.listings[0]?.minMonthlyPaymentUzs
  return {
    id: p.id,
    slug: p.slug,
    companyName: p.companyName,
    logoUrl: p.logoUrl,
    about: p.about,
    regionName: p.region?.name ?? null,
    regionSlug: p.region?.slug ?? null,
    isVerified: p.isVerified,
    ratingAvg: p.ratingAvg,
    reviewCount: p.reviewCount,
    listingCount: p.listingCount,
    minMonthlyUzs: min === null || min === undefined ? null : Number(min),
  }
}

export async function getTopArendators(limit = 6): Promise<ArendatorCardDto[]> {
  const rows = await prisma.arendatorProfile.findMany({
    where: { listingCount: { gt: 0 } },
    select: PROFILE_SELECT,
    orderBy: [
      { isVerified: 'desc' },
      { ratingAvg: 'desc' },
      { listingCount: 'desc' },
    ],
    take: limit,
  })
  return rows.map(toCard)
}

export async function getAllArendators(): Promise<ArendatorCardDto[]> {
  const rows = await prisma.arendatorProfile.findMany({
    select: PROFILE_SELECT,
    orderBy: [
      { isVerified: 'desc' },
      { listingCount: 'desc' },
      { ratingAvg: 'desc' },
    ],
  })
  return rows.map(toCard)
}

export async function getArendatorBySlug(slug: string) {
  const profile = await prisma.arendatorProfile.findUnique({
    where: { slug },
    select: {
      ...PROFILE_SELECT,
      legalName: true,
      inn: true,
      address: true,
      website: true,
      telegram: true,
      instagram: true,
      workingHours: true,
      phone: true,
      tags: true,
      latitude: true,
      longitude: true,
      createdAt: true,
      user: {
        select: {
          id: true,
          phone: true,
          fullName: true,
          accountType: true,
          _count: { select: { listings: { where: { status: 'RENTED' as const } } } },
          listings: {
            where: { status: 'ACTIVE' as const },
            select: { minMonthlyPaymentUzs: true },
            orderBy: { minMonthlyPaymentUzs: { sort: 'asc' as const, nulls: 'last' as const } },
            take: 1,
          },
        },
      },
      reviews: {
        where: { isPublished: true },
        orderBy: { createdAt: 'desc' },
        take: 20,
        select: {
          id: true, rating: true, comment: true, createdAt: true,
          author: { select: { fullName: true } },
        },
      },
    },
  })
  if (!profile) return null

  return {
    ...toCard(profile as unknown as ProfileRow),
    legalName: profile.legalName,
    inn: profile.inn,
    address: profile.address,
    website: profile.website,
    telegram: profile.telegram,
    instagram: profile.instagram,
    workingHours: profile.workingHours,
    tags: profile.tags,
    latitude: profile.latitude,
    longitude: profile.longitude,
    createdAt: profile.createdAt.toISOString(),
    ownerId: profile.user.id,
    accountType: profile.user.accountType,
    rentedCount: profile.user._count.listings,
    phone: profile.phone ?? profile.user.phone,
    contactName: profile.user.fullName,
    reviews: profile.reviews.map((r) => ({
      id: r.id,
      rating: r.rating,
      comment: r.comment,
      createdAt: r.createdAt.toISOString(),
      authorName: r.author.fullName,
    })),
  }
}

/** Bosh sahifadagi statistika */
export async function getPlatformStats() {
  const [listings, arendators, plans, minMonthly] = await Promise.all([
    prisma.listing.count({ where: { status: 'ACTIVE' } }),
    prisma.arendatorProfile.count(),
    prisma.rentalPlan.count(),
    prisma.listing.aggregate({
      where: { status: 'ACTIVE', minMonthlyPaymentUzs: { not: null } },
      _min: { minMonthlyPaymentUzs: true },
    }),
  ])
  return {
    listings,
    arendators,
    plans,
    minMonthlyUzs: Number(minMonthly._min.minMonthlyPaymentUzs ?? 0),
  }
}

// ─────────────────────────────────────────────────────────────
//  Dilerlar katalogi (/dilerlar)
// ─────────────────────────────────────────────────────────────

/** Nomlari lug'atda: messages.dealers.sort */
export const DEALER_SORTS = ['rating', 'listings', 'new'] as const

export type DealerSort = (typeof DEALER_SORTS)[number]

export const DEALER_PAGE_SIZE = 8

export interface DealerFilters {
  q?: string
  region?: string
  tag?: string
  verified: boolean
  sort: DealerSort
  page: number
}

export function parseDealerFilters(
  sp: Record<string, string | string[] | undefined>,
): DealerFilters {
  const one = (k: string) => {
    const v = sp[k]
    const s = (Array.isArray(v) ? v[0] : v)?.trim()
    return s ? s.slice(0, 100) : undefined
  }
  const sort = one('sort')
  const page = Number.parseInt(one('page') ?? '1', 10)
  return {
    q: one('q'),
    region: one('region'),
    tag: one('tag'),
    verified: one('verified') === '1',
    sort: (DEALER_SORTS as readonly string[]).includes(sort ?? '') ? (sort as DealerSort) : 'rating',
    page: Number.isFinite(page) && page > 0 ? page : 1,
  }
}

export interface DealerCardDto extends ArendatorCardDto {
  regionSlug: string | null
  address: string | null
  phone: string
  telegram: string | null
  workingHours: string | null
  tags: string[]
  latitude: number | null
  longitude: number | null
  createdAt: string
  previews: ListingCardDto[]
}

/** Bo'sh "qobiq" profillar katalogda ko'rinmaydi */
const VISIBLE_DEALER: Prisma.ArendatorProfileWhereInput = {
  OR: [{ listingCount: { gt: 0 } }, { isVerified: true }],
}

function dealerWhere(f: DealerFilters): Prisma.ArendatorProfileWhereInput {
  const AND: Prisma.ArendatorProfileWhereInput[] = [VISIBLE_DEALER]
  if (f.q) {
    AND.push({
      OR: [
        { companyName: { contains: f.q, mode: 'insensitive' } },
        { address: { contains: f.q, mode: 'insensitive' } },
      ],
    })
  }
  if (f.region) AND.push({ region: { slug: f.region } })
  if (f.tag) AND.push({ tags: { has: f.tag } })
  if (f.verified) AND.push({ isVerified: true })
  return { AND }
}

function dealerOrder(sort: DealerSort): Prisma.ArendatorProfileOrderByWithRelationInput[] {
  switch (sort) {
    case 'listings':
      return [{ listingCount: 'desc' }, { isVerified: 'desc' }, { ratingAvg: 'desc' }]
    case 'new':
      return [{ createdAt: 'desc' }]
    case 'rating':
    default:
      return [{ isVerified: 'desc' }, { ratingAvg: 'desc' }, { reviewCount: 'desc' }, { listingCount: 'desc' }]
  }
}

export async function searchDealers(f: DealerFilters) {
  const where = dealerWhere(f)
  const [rows, total] = await Promise.all([
    prisma.arendatorProfile.findMany({
      where,
      orderBy: dealerOrder(f.sort),
      skip: (f.page - 1) * DEALER_PAGE_SIZE,
      take: DEALER_PAGE_SIZE,
      select: {
        id: true, slug: true, companyName: true, logoUrl: true, about: true,
        isVerified: true, ratingAvg: true, reviewCount: true, listingCount: true,
        address: true, phone: true, telegram: true, workingHours: true,
        tags: true, latitude: true, longitude: true, createdAt: true,
        region: { select: { name: true, slug: true } },
        user: {
          select: {
            phone: true,
            listings: {
              where: { status: 'ACTIVE' },
              orderBy: [{ promotion: 'desc' }, { publishedAt: { sort: 'desc', nulls: 'last' } }],
              take: 3,
              select: LISTING_CARD_SELECT,
            },
          },
        },
      },
    }),
    prisma.arendatorProfile.count({ where }),
  ])

  const items: DealerCardDto[] = rows.map((p) => {
    const previews = p.user.listings.map(toListingCardDto)
    const monthly = previews
      .map((l) => l.minMonthlyPaymentUzs)
      .filter((v): v is number => v !== null)
    return {
      id: p.id,
      slug: p.slug,
      companyName: p.companyName,
      logoUrl: p.logoUrl,
      about: p.about,
      regionName: p.region?.name ?? null,
      regionSlug: p.region?.slug ?? null,
      isVerified: p.isVerified,
      ratingAvg: p.ratingAvg,
      reviewCount: p.reviewCount,
      listingCount: p.listingCount,
      minMonthlyUzs: monthly.length ? Math.min(...monthly) : null,
      address: p.address,
      phone: p.phone ?? p.user.phone,
      telegram: p.telegram,
      workingHours: p.workingHours,
      tags: p.tags,
      latitude: p.latitude,
      longitude: p.longitude,
      createdAt: p.createdAt.toISOString(),
      previews,
    }
  })

  return {
    items,
    total,
    page: f.page,
    pageCount: Math.max(1, Math.ceil(total / DEALER_PAGE_SIZE)),
  }
}

/** Katalog tepasidagi statistika — faqat bazadagi haqiqiy raqamlar */
export const getDealerDirectoryStats = cache(async () => {
  const [verified, dealers, activeListings, minDown, rating] = await Promise.all([
    prisma.arendatorProfile.count({ where: { isVerified: true } }),
    prisma.arendatorProfile.count({ where: VISIBLE_DEALER }),
    prisma.listing.count({ where: { status: 'ACTIVE', owner: { profile: { isNot: null } } } }),
    prisma.$queryRaw<{ ratio: number | null }[]>`
      SELECT MIN(rp."downPaymentUzs" / NULLIF(rp."carPriceUzs", 0))::float AS ratio
      FROM "RentalPlan" rp
      JOIN "Listing" l ON l.id = rp."listingId"
      WHERE l.status = 'ACTIVE' AND rp."planType" <> 'RENT'
    `,
    prisma.arendatorProfile.aggregate({
      where: { reviewCount: { gt: 0 } },
      _avg: { ratingAvg: true },
    }),
  ])
  const ratio = minDown[0]?.ratio
  return {
    verified,
    dealers,
    activeListings,
    minDownPercent: ratio === null || ratio === undefined ? null : Math.round(ratio * 100),
    avgRating: rating._avg.ratingAvg ? Math.round(rating._avg.ratingAvg * 10) / 10 : null,
  }
})

/** Filtr panelidagi viloyatlar, teglar va xarita nuqtalari */
export const getDealerFacets = cache(async () => {
  const rows = await prisma.arendatorProfile.findMany({
    where: VISIBLE_DEALER,
    select: {
      slug: true, companyName: true, tags: true, latitude: true, longitude: true,
      address: true, region: { select: { slug: true, name: true } },
    },
    orderBy: [{ isVerified: 'desc' }, { listingCount: 'desc' }],
  })

  const regions = new Map<string, { slug: string; name: string; count: number }>()
  const tags = new Map<string, number>()
  for (const r of rows) {
    if (r.region) {
      const cur = regions.get(r.region.slug) ?? { ...r.region, count: 0 }
      cur.count += 1
      regions.set(r.region.slug, cur)
    }
    for (const t of r.tags) tags.set(t, (tags.get(t) ?? 0) + 1)
  }

  return {
    regions: [...regions.values()].sort((a, b) => b.count - a.count),
    tags: [...tags.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 8)
      .map(([tag, count]) => ({ tag, count })),
    points: rows
      .filter((r) => r.latitude !== null && r.longitude !== null)
      .map((r) => ({
        slug: r.slug,
        name: r.companyName,
        address: r.address,
        regionSlug: r.region?.slug ?? null,
        lat: r.latitude!,
        lng: r.longitude!,
      })),
  }
})
