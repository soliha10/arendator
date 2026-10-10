import 'server-only'
import type { NotificationType, Prisma, PrismaClient } from '@prisma/client'
import { prisma } from '@/lib/prisma'
import { formatMoney } from '@/lib/format'
import { buildListingWhere } from './listings'
import { parseListingFilters } from '@/lib/validation/filters'

type Db = PrismaClient | Prisma.TransactionClient

/**
 * Bildirishnoma sozlamalari (User.notificationPrefs JSON).
 * Kalit yo'q bo'lsa — standart qiymat. Kanal sozlamalari (telegram, sms)
 * saqlanadi; tashqi provayder ulanganda shu yerdan o'qiladi.
 */
export interface NotificationPrefs {
  priceDrop: boolean
  newLead: boolean
  promos: boolean
  paymentReminder: boolean
  channelTelegram: boolean
  channelSms: boolean
  channelEmail: boolean
}

export const DEFAULT_PREFS: NotificationPrefs = {
  priceDrop: true,
  newLead: true,
  promos: false,
  paymentReminder: true,
  channelTelegram: false,
  channelSms: false,
  channelEmail: false,
}

export function readPrefs(raw: Prisma.JsonValue | null | undefined): NotificationPrefs {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return DEFAULT_PREFS
  const out = { ...DEFAULT_PREFS }
  for (const key of Object.keys(DEFAULT_PREFS) as (keyof NotificationPrefs)[]) {
    const v = (raw as Record<string, unknown>)[key]
    if (typeof v === 'boolean') out[key] = v
  }
  return out
}

/** Qaysi tur qaysi sozlamaga bog'liq (yo'q bo'lsa — har doim yuboriladi) */
const PREF_FOR_TYPE: Partial<Record<NotificationType, keyof NotificationPrefs>> = {
  PRICE_DROP: 'priceDrop',
  LEAD_NEW: 'newLead',
}

export interface NotifyInput {
  userId: string
  type: NotificationType
  title: string
  body: string
  link?: string
  listingId?: string
  data?: Prisma.InputJsonValue
}

/** Bir nechta foydalanuvchiga — sozlamalarini hisobga olib — yozadi */
export async function notifyMany(db: Db, items: NotifyInput[]): Promise<number> {
  if (items.length === 0) return 0

  const userIds = [...new Set(items.map((i) => i.userId))]
  const users = await db.user.findMany({
    where: { id: { in: userIds }, isBlocked: false },
    select: { id: true, notificationPrefs: true },
  })
  const prefs = new Map(users.map((u) => [u.id, readPrefs(u.notificationPrefs)]))

  const allowed = items.filter((i) => {
    const p = prefs.get(i.userId)
    if (!p) return false
    const key = PREF_FOR_TYPE[i.type]
    return key ? p[key] : true
  })
  if (allowed.length === 0) return 0

  await db.notification.createMany({
    data: allowed.map((i) => ({
      userId: i.userId,
      type: i.type,
      title: i.title,
      body: i.body,
      link: i.link ?? null,
      listingId: i.listingId ?? null,
      data: i.data,
    })),
  })
  return allowed.length
}

export const notify = (db: Db, item: NotifyInput) => notifyMany(db, [item])

/**
 * Narx o'zgarishini yozadi. Narx tushgan bo'lsa — e'lonni saqlab
 * qo'yganlarga bildirishnoma yuboradi va kartochkada eski narx chiziladi.
 */
export async function recordPriceChange(
  db: Db,
  listing: { id: string; slug: string; title: string; status: string },
  oldPriceUzs: number | null,
  newPriceUzs: number | null,
  newMonthlyUzs: number | null,
): Promise<void> {
  if (newPriceUzs === null) return
  if (oldPriceUzs !== null && Math.abs(oldPriceUzs - newPriceUzs) < 1) return

  await db.priceHistory.create({
    data: { listingId: listing.id, priceUzs: newPriceUzs, monthlyUzs: newMonthlyUzs },
  })

  if (oldPriceUzs === null) return

  const dropped = newPriceUzs < oldPriceUzs
  await db.listing.update({
    where: { id: listing.id },
    data: {
      // Narx ko'tarilsa "pasaydi" belgisi olib tashlanadi
      previousPriceUzs: dropped ? oldPriceUzs : null,
      priceChangedAt: new Date(),
    },
  })

  if (!dropped || listing.status !== 'ACTIVE') return

  const fans = await db.favorite.findMany({
    where: { listingId: listing.id },
    select: { userId: true },
  })
  const diff = oldPriceUzs - newPriceUzs
  await notifyMany(
    db,
    fans.map((f) => ({
      userId: f.userId,
      type: 'PRICE_DROP' as const,
      title: 'Saqlangan eʼloningiz narxi arzonlashdi!',
      body: `${listing.title} narxi ${formatMoney(oldPriceUzs, 'UZS')} dan ${formatMoney(newPriceUzs, 'UZS')} ga tushdi.`,
      link: `/elon/${listing.slug}`,
      listingId: listing.id,
      data: {
        tpl: 'priceDrop',
        vars: { listing: listing.title },
        oldPriceUzs,
        newPriceUzs,
        diff,
        newMonthlyUzs,
      },
    })),
  )
}

/**
 * Yangi faollashgan e'lonni saqlangan qidiruvlar bilan solishtiradi.
 * INSTANT chastotali qidiruv egalariga darhol xabar boradi; kunlik va
 * haftalik dayjest uchun `lastCheckedAt` asos bo'ladi.
 */
export async function matchSavedSearches(listingId: string): Promise<number> {
  const listing = await prisma.listing.findUnique({
    where: { id: listingId },
    select: { id: true, slug: true, title: true, ownerId: true, status: true },
  })
  if (!listing || listing.status !== 'ACTIVE') return 0

  const searches = await prisma.savedSearch.findMany({
    where: { notify: true, frequency: 'INSTANT', userId: { not: listing.ownerId } },
    select: { id: true, userId: true, name: true, query: true },
    take: 2000,
  })

  const matched: NotifyInput[] = []
  for (const s of searches) {
    const filters = parseListingFilters(Object.fromEntries(new URLSearchParams(s.query)))
    const hit = await prisma.listing.count({
      where: { AND: [buildListingWhere(filters), { id: listing.id }] },
    })
    if (hit > 0) {
      matched.push({
        userId: s.userId,
        type: 'SAVED_SEARCH',
        title: `“${s.name}” qidiruvingizga yangi eʼlon`,
        body: `${listing.title} — siz saqlagan shartlarga mos keladi.`,
        link: `/elon/${listing.slug}`,
        listingId: listing.id,
        data: { tpl: 'savedSearch', vars: { search: s.name, listing: listing.title }, savedSearchId: s.id },
      })
    }
  }
  return notifyMany(prisma, matched)
}
