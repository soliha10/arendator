import type { Metadata } from 'next'
import { Bookmark, BellRing, Heart, Search, TrendingDown } from 'lucide-react'
import { requireUser } from '@/lib/auth/guards'
import { prisma } from '@/lib/prisma'
import { LISTING_CARD_SELECT, toListingCardDto, type ListingCardDto } from '@/server/mappers'
import { describeSearchQueries } from '@/server/cabinet'
import { readPrefs } from '@/server/notifications'
import { ListingGrid } from '@/components/listing/listing-grid'
import { EmptyState } from '@/components/ui/empty'
import { Button } from '@/components/ui/button'
import { QuickComparePanel } from '@/components/cabinet/quick-compare-panel'
import { SavedSearchCard } from '@/components/cabinet/saved-search-card'
import { cn } from '@/lib/utils'
import { Link } from '@/i18n/client'
import { getLocale, getMessages } from '@/i18n/server'
import { fmt, plural } from '@/i18n/format'

export async function generateMetadata(): Promise<Metadata> {
  return { title: (await getMessages()).cabinet.meta.saved }
}

const TABS = [
  { value: 'barchasi' },
  { value: 'arenda' },
  { value: 'muddatli' },
  { value: 'qidiruvlar' },
] as const
type Tab = (typeof TABS)[number]['value']

const dropped = (l: ListingCardDto) =>
  l.previousPriceUzs !== null && l.displayPriceUzs !== null && l.previousPriceUzs > l.displayPriceUzs

export default async function SavedPage(props: PageProps<'/[lang]/kabinet/saqlanganlar'>) {
  const user = await requireUser('/kabinet/saqlanganlar')
  const [m, locale] = await Promise.all([getMessages(), getLocale()])
  const t = m.cabinet.saved
  const sp = await props.searchParams
  const tab: Tab = TABS.find((t) => t.value === sp.tab)?.value ?? 'barchasi'
  const onlyDrops = sp.narx === 'pasaygan'

  const [favorites, searches, me] = await Promise.all([
    prisma.favorite.findMany({
      where: { userId: user.id, listing: { status: { in: ['ACTIVE', 'RENTED', 'PAUSED'] } } },
      orderBy: { createdAt: 'desc' },
      select: { listing: { select: LISTING_CARD_SELECT } },
    }),
    prisma.savedSearch.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: 'desc' },
      select: { id: true, name: true, query: true, notify: true, frequency: true },
    }),
    prisma.user.findUniqueOrThrow({ where: { id: user.id }, select: { notificationPrefs: true } }),
  ])

  const all = favorites.map((f) => toListingCardDto(f.listing))
  const rent = all.filter((l) => l.rent)
  const finance = all.filter((l) => l.installment || l.leasing)
  const drops = all.filter(dropped)
  const chips = await describeSearchQueries(searches.map((s) => s.query), m, locale)
  const priceWatch = readPrefs(me.notificationPrefs).priceDrop

  const counts: Record<Tab, number> = {
    barchasi: all.length,
    arenda: rent.length,
    muddatli: finance.length,
    qidiruvlar: searches.length,
  }
  const base = tab === 'arenda' ? rent : tab === 'muddatli' ? finance : all
  const listings = onlyDrops ? base.filter(dropped) : base
  const favoriteIds = new Set(all.map((l) => l.id))

  const searchesBlock = (
    <section className="rounded-2xl bg-surface-2 p-4 sm:p-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-start gap-3">
          <span className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-success-soft text-success">
            <BellRing className="size-5" aria-hidden />
          </span>
          <div>
            <h2 className="text-lg font-bold text-text">{t.searchesTitle}</h2>
            <p className="mt-0.5 text-[13px] text-muted">
              {t.searchesHint}
            </p>
          </div>
        </div>
        <Button asChild variant="outline" className="shrink-0">
          <Link href="/elonlar">
            <Search /> {t.newSearch}
          </Link>
        </Button>
      </div>

      {searches.length > 0 ? (
        <div className="mt-5 grid gap-3 lg:grid-cols-2">
          {searches.map((s, i) => (
            <SavedSearchCard
              key={s.id}
              id={s.id}
              name={s.name}
              query={s.query}
              chips={chips[i]}
              notify={s.notify}
              frequency={s.frequency}
            />
          ))}
        </div>
      ) : (
        <p className="mt-5 rounded-xl border border-dashed border-border-strong bg-surface px-4 py-6 text-center text-[13px] leading-relaxed text-muted">
          {t.noSearches}
        </p>
      )}
    </section>
  )

  return (
    <div className="space-y-5 sm:space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <span className="inline-flex items-center gap-1 rounded-md bg-primary-soft px-2 py-0.5 text-[11px] font-bold uppercase tracking-wide text-primary">
            <Bookmark className="size-3.5" aria-hidden /> {t.badge}
          </span>
          <h1 className="font-display mt-2 text-2xl font-extrabold text-text sm:text-[32px]">
            {t.title}
          </h1>
          <p className="mt-1 max-w-2xl text-sm text-muted">
            {t.subtitle}
          </p>
        </div>
        <Link
          href="/kabinet/xabarnomalar"
          className="inline-flex shrink-0 items-center gap-2 self-start rounded-full border border-border bg-surface px-3.5 py-1.5 text-[13px] font-semibold text-text sm:self-auto"
        >
          <span className={cn('size-2 rounded-full', priceWatch ? 'bg-success' : 'bg-border-strong')} aria-hidden />
          {t.priceWatch} <span className={priceWatch ? 'text-success' : 'text-muted'}>{priceWatch ? t.on : t.off}</span>
        </Link>
      </div>

      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="hide-scrollbar -mx-1 flex gap-1 overflow-x-auto rounded-xl bg-surface-2 p-1">
          {TABS.map((x) => (
            <Link
              key={x.value}
              href={x.value === 'barchasi' ? '/kabinet/saqlanganlar' : `/kabinet/saqlanganlar?tab=${x.value}`}
              aria-current={tab === x.value ? 'page' : undefined}
              className={cn(
                'inline-flex h-10 shrink-0 items-center gap-2 rounded-lg px-4 text-[14px] font-semibold transition-colors',
                tab === x.value ? 'bg-surface text-text shadow-sm' : 'text-muted hover:text-text',
              )}
            >
              {t.tabs[x.value]}
              <span className="tabular rounded-md bg-primary-soft px-1.5 text-[11px] font-bold text-primary">{counts[x.value]}</span>
            </Link>
          ))}
        </div>
        {tab !== 'qidiruvlar' && drops.length > 0 ? (
          <Link
            href={
              onlyDrops
                ? tab === 'barchasi' ? '/kabinet/saqlanganlar' : `/kabinet/saqlanganlar?tab=${tab}`
                : `/kabinet/saqlanganlar?${tab === 'barchasi' ? '' : `tab=${tab}&`}narx=pasaygan`
            }
            className={cn(
              'inline-flex h-9 shrink-0 items-center gap-1.5 self-start rounded-full px-3.5 text-[13px] font-semibold transition-colors',
              onlyDrops ? 'bg-success text-white' : 'bg-success-soft text-success hover:brightness-95',
            )}
          >
            <TrendingDown className="size-4" aria-hidden /> {fmt(t.priceDrops, { n: drops.length })}
          </Link>
        ) : null}
      </div>

      {tab === 'qidiruvlar' ? (
        searchesBlock
      ) : (
        <>
          <QuickComparePanel />

          <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
            <h2 className="font-display text-xl font-extrabold text-text sm:text-2xl">{t.selected}</h2>
            <span className="tabular shrink-0 whitespace-nowrap rounded-full bg-surface-2 px-2.5 py-0.5 text-[12px] font-semibold text-muted">
              {plural(locale, listings.length, t.carsCount)}
            </span>
          </div>

          {listings.length > 0 ? (
            <ListingGrid listings={listings} favoriteIds={favoriteIds} />
          ) : (
            <EmptyState
              icon={<Heart />}
              title={onlyDrops ? t.noDrops : t.empty}
              description={t.emptyHint}
              action={
                <Button asChild>
                  <Link href="/elonlar">{m.cabinet.common.browseCars}</Link>
                </Button>
              }
            />
          )}

          {searchesBlock}
        </>
      )}
    </div>
  )
}
