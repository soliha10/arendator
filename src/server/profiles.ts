import 'server-only'
import { prisma } from '@/lib/prisma'

export interface ArendatorCardDto {
  id: string
  slug: string
  companyName: string
  logoUrl: string | null
  about: string | null
  regionName: string | null
  isVerified: boolean
  ratingAvg: number
  reviewCount: number
  listingCount: number
  minMonthlyUzs: number | null
}

const PROFILE_SELECT = {
  id: true, slug: true, companyName: true, logoUrl: true, about: true,
  isVerified: true, ratingAvg: true, reviewCount: true, listingCount: true,
  region: { select: { name: true } },
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
  region: { name: string } | null
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
      createdAt: true,
      user: {
        select: {
          id: true,
          phone: true,
          fullName: true,
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
    createdAt: profile.createdAt.toISOString(),
    ownerId: profile.user.id,
    phone: profile.user.phone,
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
