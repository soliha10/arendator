import 'server-only'
import { cache } from 'react'
import { prisma } from '@/lib/prisma'
import { LISTING_CARD_SELECT, toListingCardDto, type ListingCardDto } from './mappers'

/** Narxi yaqinda tushgan e'lonlar — eng yangi o'zgarish birinchi */
export async function getPriceDropListings(limit = 4): Promise<ListingCardDto[]> {
  const rows = await prisma.listing.findMany({
    where: { status: 'ACTIVE', previousPriceUzs: { not: null } },
    select: LISTING_CARD_SELECT,
    orderBy: { priceChangedAt: { sort: 'desc', nulls: 'last' } },
    take: limit,
  })
  return rows.map(toListingCardDto)
}

/** Bosh sahifa kategoriyalari uchun qo'shimcha raqamlar */
export const getHomeExtras = cache(async () => {
  const [agg, rate] = await Promise.all([
    prisma.listing.aggregate({
      where: { status: 'ACTIVE' },
      _min: { minDailyRentUzs: true, minMonthlyPaymentUzs: true, carPriceUzs: true },
      _max: { carPriceUzs: true },
    }),
    // Kalkulyator uchun bozordagi o'rtacha yillik stavka (faqat foizli shartlar)
    prisma.rentalPlan.aggregate({
      where: {
        planType: { in: ['INSTALLMENT', 'LEASING'] },
        markupPercent: { gt: 0 },
        listing: { status: 'ACTIVE' },
      },
      _avg: { markupPercent: true },
    }),
  ])
  const avgRate = Number(rate._avg.markupPercent ?? 0)
  return {
    avgRatePercent: avgRate > 0 ? Math.round(avgRate) : 24,
    minDailyRentUzs: agg._min.minDailyRentUzs ? Number(agg._min.minDailyRentUzs) : null,
    minMonthlyUzs: agg._min.minMonthlyPaymentUzs ? Number(agg._min.minMonthlyPaymentUzs) : null,
    priceMin: Number(agg._min.carPriceUzs ?? 80_000_000),
    priceMax: Number(agg._max.carPriceUzs ?? 600_000_000),
  }
})
