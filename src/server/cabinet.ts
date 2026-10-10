import 'server-only'
import { cache } from 'react'
import type { NotificationType } from '@prisma/client'
import { prisma } from '@/lib/prisma'
import { formatMileage, formatMoney } from '@/lib/format'
import type { Locale } from '@/i18n/config'
import type { Messages } from '@/i18n/messages'
import { fmt } from '@/i18n/format'
import { regionLabel } from '@/i18n/labels'

/**
 * Kabinet tablari yonidagi raqamlar. Layout va sahifa bir so'rovda
 * ikkalasi ham chaqiradi — `cache` tufayli baza bir marta so'raladi.
 */
export const getCabinetCounts = cache(async (userId: string) => {
  const [listings, newLeads, myLeads, favorites, savedSearches, unread] = await Promise.all([
    prisma.listing.count({ where: { ownerId: userId } }),
    prisma.lead.count({ where: { listing: { ownerId: userId }, status: 'NEW' } }),
    prisma.lead.count({ where: { userId } }),
    prisma.favorite.count({ where: { userId } }),
    prisma.savedSearch.count({ where: { userId } }),
    prisma.notification.count({ where: { userId, readAt: null } }),
  ])
  return { listings, newLeads, myLeads, favorites, savedSearches, unread }
})

export type CabinetCounts = Awaited<ReturnType<typeof getCabinetCounts>>

/** Xabarnomalar tablari: tur → guruh (nomi — messages.cabinet.notifications.groups) */
export const NOTIFICATION_GROUPS = [
  { value: 'all', types: null },
  { value: 'leads', types: ['LEAD_NEW', 'LEAD_STATUS'] },
  { value: 'price', types: ['PRICE_DROP', 'SAVED_SEARCH'] },
  { value: 'listings', types: ['LISTING_STATUS'] },
  { value: 'system', types: ['SYSTEM'] },
] as const satisfies readonly { value: string; types: readonly NotificationType[] | null }[]

export type NotificationGroup = (typeof NOTIFICATION_GROUPS)[number]['value']

/** Pul/son filtrlari → chip nomi kaliti */
const PARAM_KEYS: Record<string, keyof Messages['cabinet']['savedSearch']['chips']> = {
  monthlyMin: 'monthly',
  monthlyMax: 'monthly',
  downMin: 'down',
  downMax: 'down',
  priceMin: 'price',
  priceMax: 'price',
  termMin: 'term',
  termMax: 'term',
  yearMin: 'year',
  yearMax: 'year',
  mileageMax: 'mileage',
}

function enumLabels(m: Messages): Record<string, Record<string, string>> {
  return {
    body: m.enums.bodyType,
    transmission: m.enums.transmission,
    fuel: m.enums.fuelType,
    drive: m.enums.driveType,
    condition: m.enums.condition,
    planType: m.enums.dealTypeShort,
    features: m.enums.feature,
  }
}

/**
 * Saqlangan qidiruv query'sini odam o'qiydigan chiplarga aylantiradi:
 * "brand=byd&monthlyMax=5000000" → ["BYD", "Oylik ≤ 5 mln soʻm"].
 * Marka/model/viloyat slug'lari bazadagi nomlar bilan almashtiriladi.
 */
export async function describeSearchQueries(
  queries: string[],
  m: Messages,
  locale: Locale,
): Promise<string[][]> {
  const t = m.cabinet.savedSearch.chips
  const ENUM_LABELS = enumLabels(m)
  const parsed = queries.map((q) => new URLSearchParams(q))
  const slugs = (key: string) =>
    [...new Set(parsed.flatMap((p) => (p.get(key) ?? '').split(',').filter(Boolean)))]

  const [brands, models, regions] = await Promise.all([
    prisma.brand.findMany({ where: { slug: { in: slugs('brand') } }, select: { slug: true, name: true } }),
    prisma.carModel.findMany({ where: { slug: { in: slugs('model') } }, select: { slug: true, name: true } }),
    prisma.region.findMany({ where: { slug: { in: slugs('region') } }, select: { slug: true, name: true } }),
  ])
  const names: Record<string, Map<string, string>> = {
    brand: new Map(brands.map((b) => [b.slug, b.name])),
    model: new Map(models.map((m) => [m.slug, m.name])),
    region: new Map(regions.map((r) => [r.slug, regionLabel(m, r.slug, r.name)])),
  }

  return parsed.map((params) => {
    const chips: string[] = []
    for (const [key, raw] of params.entries()) {
      const values = raw.split(',').filter(Boolean)
      if (key === 'q') chips.push(`“${raw}”`)
      else if (names[key]) chips.push(values.map((v) => names[key].get(v) ?? v).join(', '))
      else if (ENUM_LABELS[key]) chips.push(values.map((v) => ENUM_LABELS[key][v] ?? v).join(', '))
      else if (PARAM_KEYS[key]) {
        const n = Number(raw)
        const isMoney = /monthly|down|price/i.test(key)
        const isTerm = key.startsWith('term')
        const value = isMoney
          ? formatMoney(n, 'UZS', { compact: true, locale })
          : isTerm
            ? fmt(t.months, { n })
            : key === 'mileageMax'
              ? formatMileage(n, locale)
              : String(n)
        const op = key.endsWith('Min') ? '≥' : '≤'
        chips.push(`${t[PARAM_KEYS[key]]} ${op} ${value}`)
      } else if (key === 'verified') chips.push(t.verified)
      else if (key === 'insurance') chips.push(t.insurance)
      else if (key === 'priceDrop') chips.push(t.priceDrop)
    }
    return chips
  })
}
