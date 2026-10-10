import type { Metadata } from 'next'
import Image from 'next/image'
import {
  ClipboardList, Eye, Heart, Pencil, PhoneCall, PlusCircle, Search,
} from 'lucide-react'
import type { ListingStatus, Prisma } from '@prisma/client'
import { requireArendator } from '@/lib/auth/guards'
import { prisma } from '@/lib/prisma'
import { effectivePromotion } from '@/server/mappers'
import { PROMOTION_PLANS } from '@/lib/constants'
import { formatCount, formatMileage, formatMoney } from '@/lib/format'
import { Button } from '@/components/ui/button'
import { EmptyState } from '@/components/ui/empty'
import { LEAD_MINI_SELECT, LeadMiniCard } from '@/components/cabinet/lead-mini-card'
import { cn } from '@/lib/utils'
import { Link } from '@/i18n/client'
import { getLocale, getMessages } from '@/i18n/server'
import { fmt, plural } from '@/i18n/format'
import { regionLabel } from '@/i18n/labels'
import { ListingRowActions } from './listing-row-actions'
import { PromoteButton } from './promote-button'
import { StatusQuickButton } from './status-quick-button'

export async function generateMetadata(): Promise<Metadata> {
  return { title: (await getMessages()).cabinet.meta.listings }
}

const STATUS_TABS: {
  value: 'all' | 'ACTIVE' | 'PENDING' | 'DRAFT' | 'PAUSED' | 'REJECTED' | 'ARCHIVED'
  statuses: ListingStatus[] | null
}[] = [
  { value: 'all', statuses: null },
  { value: 'ACTIVE', statuses: ['ACTIVE'] },
  { value: 'PENDING', statuses: ['PENDING'] },
  { value: 'DRAFT', statuses: ['DRAFT'] },
  { value: 'PAUSED', statuses: ['PAUSED', 'RENTED'] },
  { value: 'REJECTED', statuses: ['REJECTED'] },
  { value: 'ARCHIVED', statuses: ['ARCHIVED'] },
]

const STATUS_TONE: Record<ListingStatus, string> = {
  ACTIVE: 'bg-success-soft text-success',
  PENDING: 'bg-warning-soft text-warning',
  DRAFT: 'bg-surface-3 text-muted',
  PAUSED: 'bg-surface-3 text-muted',
  REJECTED: 'bg-danger-soft text-danger',
  ARCHIVED: 'bg-surface-3 text-subtle',
  RENTED: 'bg-primary-soft text-primary',
}

const LISTING_SELECT = {
  id: true, slug: true, title: true, status: true, year: true, mileage: true,
  transmission: true, fuelType: true, rejectReason: true, expiresAt: true,
  viewCount: true, favoriteCount: true, leadCount: true, phoneRevealCount: true,
  hasCashSale: true, cashPriceUzs: true, carPriceUzs: true,
  minDownPaymentUzs: true, minMonthlyPaymentUzs: true, maxTermMonths: true,
  promotion: true, promotedUntil: true,
  region: { select: { name: true, slug: true } },
  images: { orderBy: [{ isCover: 'desc' }, { position: 'asc' }], take: 1, select: { url: true } },
  promotionRequests: { where: { status: 'PENDING' }, take: 1, select: { tier: true } },
} satisfies Prisma.ListingSelect

const daysUntil = (d: Date | null) =>
  d ? Math.max(0, Math.ceil((d.getTime() - Date.now()) / 86_400_000)) : null

export default async function MyListingsPage(props: PageProps<'/[lang]/kabinet/elonlarim'>) {
  const user = await requireArendator('/kabinet/elonlarim')
  const [m, locale] = await Promise.all([getMessages(), getLocale()])
  const t = m.cabinet.listings
  const sp = await props.searchParams
  const status = typeof sp.status === 'string' ? sp.status : 'all'
  const q = typeof sp.q === 'string' ? sp.q.trim().slice(0, 80) : ''
  const tab = STATUS_TABS.find((t) => t.value === status) ?? STATUS_TABS[0]

  const where: Prisma.ListingWhereInput = {
    ownerId: user.id,
    ...(tab.statuses ? { status: { in: tab.statuses } } : {}),
    ...(q ? { title: { contains: q, mode: 'insensitive' } } : {}),
  }

  const [listings, counts, leads] = await Promise.all([
    prisma.listing.findMany({ where, orderBy: { updatedAt: 'desc' }, select: LISTING_SELECT }),
    prisma.listing.groupBy({ by: ['status'], where: { ownerId: user.id }, _count: true }),
    prisma.lead.findMany({
      where: { listing: { ownerId: user.id } },
      orderBy: [{ status: 'asc' }, { createdAt: 'desc' }],
      take: 3,
      select: LEAD_MINI_SELECT,
    }),
  ])

  const countOf = (statuses: ListingStatus[] | null) =>
    counts
      .filter((c) => !statuses || statuses.includes(c.status))
      .reduce((s, c) => s + c._count, 0)
  const vip = PROMOTION_PLANS.find((p) => p.tier === 'VIP')!

  return (
    <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_360px]">
      <div className="min-w-0 space-y-4">
        <div className="flex flex-col gap-3 rounded-xl border border-border bg-surface p-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="hide-scrollbar -mx-1 flex gap-1.5 overflow-x-auto px-1">
            {STATUS_TABS.map((tab_) => {
              const count = countOf(tab_.statuses)
              const active = tab.value === tab_.value
              if (tab_.value !== 'all' && count === 0 && !active) return null
              const params = new URLSearchParams()
              if (tab_.value !== 'all') params.set('status', tab_.value)
              if (q) params.set('q', q)
              return (
                <Link
                  key={tab_.value}
                  href={`/kabinet/elonlarim${params.size ? `?${params}` : ''}`}
                  className={cn(
                    'inline-flex h-9 shrink-0 items-center gap-1.5 rounded-full px-4 text-[13px] font-semibold transition-colors',
                    active ? 'bg-primary text-primary-fg' : 'bg-surface-2 text-text hover:bg-surface-3',
                  )}
                >
                  {t.tabs[tab_.value]} <span className="tabular opacity-75">({count})</span>
                </Link>
              )
            })}
          </div>
          <form className="relative sm:w-64" role="search">
            {tab.value !== 'all' ? <input type="hidden" name="status" value={tab.value} /> : null}
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-subtle" aria-hidden />
            <input
              type="search"
              name="q"
              defaultValue={q}
              placeholder={t.searchPlaceholder}
              aria-label={t.searchAria}
              className="h-10 w-full rounded-lg border border-transparent bg-surface-2 pl-9 pr-3 text-sm text-text placeholder:text-subtle focus:border-border focus:bg-surface"
            />
          </form>
        </div>

        {listings.length > 0 ? (
          <ul className="space-y-3">
            {listings.map((l) => {
              const promo = effectivePromotion(l.promotion, l.promotedUntil)
              const price = l.hasCashSale && l.cashPriceUzs ? l.cashPriceUzs : l.carPriceUzs
              const left = daysUntil(l.expiresAt)
              return (
                <li key={l.id} className="rounded-xl border border-border bg-surface p-3.5 sm:p-4">
                  {/* Telefon: rasm + sarlavha bir qatorda, raqamlar ostida to'liq kenglikda */}
                  <div className="grid grid-cols-[112px_minmax(0,1fr)] gap-x-3 gap-y-3 sm:grid-cols-[224px_minmax(0,1fr)] sm:gap-x-4">
                    <Link
                      href={`/elon/${l.slug}`}
                      className="relative aspect-[4/3] overflow-hidden rounded-lg bg-surface-2 sm:row-span-2 sm:aspect-[16/10] sm:self-start"
                    >
                      {l.images[0] ? (
                        <Image src={l.images[0].url} alt={l.title} fill sizes="(max-width: 640px) 100vw, 224px" className="object-cover" />
                      ) : null}
                      {promo !== 'NONE' ? (
                        <span className="absolute left-1.5 top-1.5 rounded-md bg-primary px-1.5 py-0.5 text-[10px] font-bold text-primary-fg sm:left-2 sm:top-2 sm:text-[11px]">
                          {promo === 'TOP' ? t.topBadge : t.vipBadge}
                        </span>
                      ) : null}
                      <span className="tabular absolute bottom-1.5 left-1.5 rounded-md bg-black/65 px-1.5 py-0.5 text-[10px] font-medium text-white sm:bottom-2 sm:left-2 sm:text-[11px]">
                        ID: {l.id.slice(-6).toUpperCase()}
                      </span>
                    </Link>

                      <div className="flex min-w-0 items-start justify-between gap-2">
                        <div className="min-w-0">
                          <Link href={`/elon/${l.slug}`} className="line-clamp-2x text-[15px] font-bold leading-snug text-text hover:text-primary sm:text-[17px]">
                            {l.title}
                          </Link>
                          <p className="mt-1 line-clamp-2x text-[12px] text-muted">
                            {[
                              fmt(t.year, { year: l.year }),
                              formatMileage(l.mileage, locale),
                              m.enums.transmission[l.transmission],
                              m.enums.fuelType[l.fuelType],
                              regionLabel(m, l.region.slug, l.region.name),
                            ].join(' • ')}
                          </p>
                        </div>
                        <div className="flex shrink-0 items-center gap-1">
                          <span className={cn('rounded-md px-2 py-0.5 text-[12px] font-semibold', STATUS_TONE[l.status])}>
                            {m.enums.listingStatus[l.status]}
                          </span>
                          <ListingRowActions listingId={l.id} slug={l.slug} title={l.title} status={l.status} />
                        </div>
                      </div>

                    <div className="col-span-2 min-w-0 sm:col-span-1 sm:col-start-2">

                      {l.rejectReason && l.status === 'REJECTED' ? (
                        <p className="mt-2 rounded-lg bg-danger-soft px-3 py-2 text-[12px] text-danger">
                          {fmt(t.rejectReason, { reason: l.rejectReason })}
                        </p>
                      ) : null}

                      <div className="grid grid-cols-2 gap-2 rounded-lg bg-surface-2 px-3 py-2.5 sm:grid-cols-3">
                        <div className="min-w-0">
                          <p className="text-[11px] font-medium text-subtle">{l.hasCashSale ? t.cashPrice : t.price}</p>
                          <p className="tabular truncate text-[14px] font-extrabold text-text">
                            {price ? formatMoney(Number(price), 'UZS', { compact: true, locale }) : '—'}
                          </p>
                        </div>
                        <div className="min-w-0">
                          <p className="text-[11px] font-medium text-subtle">{t.downPayment}</p>
                          <p className="tabular truncate text-[14px] font-bold text-primary">
                            {l.minDownPaymentUzs ? formatMoney(Number(l.minDownPaymentUzs), 'UZS', { compact: true, locale }) : '—'}
                          </p>
                        </div>
                        <div className="col-span-2 min-w-0 sm:col-span-1">
                          <p className="text-[11px] font-medium text-subtle">
                            {l.maxTermMonths ? fmt(t.monthlyUpTo, { n: l.maxTermMonths }) : t.monthly}
                          </p>
                          <p className="tabular truncate text-[14px] font-extrabold text-primary">
                            {l.minMonthlyPaymentUzs
                              ? fmt(m.cabinet.common.perMonth, {
                                  amount: formatMoney(Number(l.minMonthlyPaymentUzs), 'UZS', { compact: true, locale }),
                                })
                              : '—'}
                          </p>
                        </div>
                      </div>

                      <p className="tabular mt-2.5 flex flex-wrap gap-x-4 gap-y-1 text-[12px] text-muted">
                        <span className="inline-flex items-center gap-1"><Eye className="size-3.5" /> {fmt(t.views, { n: formatCount(l.viewCount, locale) })}</span>
                        <span className="inline-flex items-center gap-1 text-success"><PhoneCall className="size-3.5" /> {plural(locale, l.phoneRevealCount, t.phoneReveals)}</span>
                        <span className="inline-flex items-center gap-1"><ClipboardList className="size-3.5" /> {plural(locale, l.leadCount, t.leads)}</span>
                        <span className="inline-flex items-center gap-1"><Heart className="size-3.5" /> {l.favoriteCount}</span>
                        {l.status === 'ACTIVE' && left !== null ? (
                          <span className={left <= 3 ? 'font-semibold text-warning' : undefined}>{plural(locale, left, t.expires)}</span>
                        ) : null}
                      </p>

                      <div className="mt-3 flex flex-wrap items-center gap-2 border-t border-border pt-3">
                        <PromoteButton
                          listingId={l.id}
                          canPromote={l.status === 'ACTIVE'}
                          activeTier={promo}
                          daysLeft={promo !== 'NONE' ? daysUntil(l.promotedUntil) : null}
                          pendingTier={l.promotionRequests[0]?.tier ?? null}
                        />
                        <Link
                          href={`/kabinet/elon/${l.id}/tahrirlash`}
                          className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-surface-2 px-3 text-[13px] font-semibold text-text transition-colors hover:bg-surface-3"
                        >
                          <Pencil className="size-4" aria-hidden /> {t.edit}
                        </Link>
                        <span className="sm:ml-auto">
                          <StatusQuickButton listingId={l.id} status={l.status} />
                        </span>
                      </div>
                    </div>
                  </div>
                </li>
              )
            })}
          </ul>
        ) : (
          <EmptyState
            icon={<ClipboardList />}
            title={q ? t.notFound : tab.value === 'all' ? t.empty : t.emptyStatus}
            description={t.emptyHint}
            action={
              <Button asChild>
                <Link href="/kabinet/elon/yangi"><PlusCircle /> {m.cabinet.common.postAd}</Link>
              </Button>
            }
          />
        )}
      </div>

      <aside className="space-y-3">
        <div className="rounded-xl border border-border bg-surface p-4">
          <h2 className="text-lg font-bold text-text">{t.leadsTitle}</h2>
          <p className="mt-1 text-[13px] text-muted">{t.leadsHint}</p>
        </div>
        {leads.length > 0 ? (
          leads.map((lead) => <LeadMiniCard key={lead.id} lead={lead} />)
        ) : (
          <p className="rounded-xl border border-dashed border-border-strong px-4 py-6 text-center text-sm text-muted">
            {m.cabinet.common.noLeadsYet}
          </p>
        )}

        <section className="rounded-xl bg-primary p-5 text-primary-fg">
          <h2 className="text-lg font-bold">{t.vipTitle}</h2>
          <p className="mt-1.5 text-[13px] leading-relaxed opacity-90">
            {fmt(t.vipText, { hint: m.enums.promotion.VIP.hint, days: vip.days })}
          </p>
          <p className="tabular mt-3 text-[15px] font-extrabold">
            {fmt(t.fromPrice, { amount: formatMoney(vip.priceUzs, 'UZS', { locale }) })}
          </p>
        </section>
      </aside>
    </div>
  )
}
