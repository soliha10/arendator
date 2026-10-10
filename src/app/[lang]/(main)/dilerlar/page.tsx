import type { Metadata } from 'next'
import {
  BadgeCheck, Building2, CarFront, ChevronRight, CircleCheck,
  Headphones, Percent, Star, Store, X,
} from 'lucide-react'
import {
  DEALER_PAGE_SIZE,
  DEALER_SORTS,
  getDealerDirectoryStats,
  getDealerFacets,
  parseDealerFilters,
  searchDealers,
  type DealerFilters as Filters,
} from '@/server/profiles'
import { formatPhone } from '@/lib/format'
import { SITE } from '@/lib/site'
import { DealerCard } from '@/components/dealer/dealer-card'
import { DealerFilters } from '@/components/dealer/dealer-filters'
import { DealerMap } from '@/components/dealer/dealer-map'
import { Pagination } from '@/components/ui/pagination'
import { EmptyState } from '@/components/ui/empty'
import { cn } from '@/lib/utils'
import { Link } from '@/i18n/client'
import { fmt } from '@/i18n/format'
import { regionLabel } from '@/i18n/labels'
import { alternatesFor, ogLocale } from '@/i18n/seo'
import { getLocale, getMessages } from '@/i18n/server'

export async function generateMetadata(): Promise<Metadata> {
  const [m, locale] = await Promise.all([getMessages(), getLocale()])
  return {
    title: m.dealers.meta.title,
    description: m.dealers.meta.description,
    alternates: alternatesFor('/dilerlar', locale),
    openGraph: { locale: ogLocale(locale) },
  }
}

/** Filtrlardan URL yasaydi; `patch` bilan bitta qiymat almashtiriladi */
function hrefWith(f: Filters, patch: Partial<Record<keyof Filters | 'nuqta', string | undefined>>) {
  const p = new URLSearchParams()
  const base: Record<string, string | undefined> = {
    q: f.q,
    region: f.region,
    tag: f.tag,
    verified: f.verified ? '1' : undefined,
    sort: f.sort === 'rating' ? undefined : f.sort,
    page: f.page > 1 ? String(f.page) : undefined,
  }
  for (const [k, v] of Object.entries({ ...base, ...patch })) if (v) p.set(k, v)
  const qs = p.toString()
  return qs ? `/dilerlar?${qs}` : '/dilerlar'
}

export default async function DealersPage(props: PageProps<'/[lang]/dilerlar'>) {
  const sp = await props.searchParams
  const filters = parseDealerFilters(sp)
  const activePoint = typeof sp.nuqta === 'string' ? sp.nuqta : undefined

  const [result, stats, rawFacets, m] = await Promise.all([
    searchDealers(filters),
    getDealerDirectoryStats(),
    getDealerFacets(),
    getMessages(),
  ])
  const t = m.dealers
  // Viloyat nomlari joriy tilda
  const facets = {
    ...rawFacets,
    regions: rawFacets.regions.map((r) => ({ ...r, name: regionLabel(m, r.slug, r.name) })),
  }
  const sorts = DEALER_SORTS.map((value) => ({ value, label: t.sort[value] }))
  const group = (n: number) => String(n).replace(/\B(?=(\d{3})+(?!\d))/g, ' ')

  const statCards = [
    {
      label: t.stats.verified,
      value: String(stats.verified),
      hint: fmt(t.stats.verifiedHint, { n: stats.dealers }),
      icon: BadgeCheck,
    },
    {
      label: t.stats.listings,
      value: group(stats.activeListings),
      hint: t.stats.listingsHint,
      icon: CarFront,
    },
    {
      label: t.stats.down,
      value: stats.minDownPercent !== null ? fmt(t.stats.downValue, { n: stats.minDownPercent }) : '—',
      hint: t.stats.downHint,
      icon: Percent,
      accent: true,
    },
    {
      label: t.stats.rating,
      value: stats.avgRating !== null ? `${stats.avgRating.toFixed(1)} / 5` : '—',
      hint: t.stats.ratingHint,
      icon: Star,
    },
  ]

  const points = filters.region
    ? facets.points.filter((p) => p.regionSlug === filters.region)
    : facets.points

  const hasFilters = !!(filters.q || filters.region || filters.tag || filters.verified)
  const from = result.total === 0 ? 0 : (result.page - 1) * DEALER_PAGE_SIZE + 1
  const to = Math.min(result.total, result.page * DEALER_PAGE_SIZE)

  return (
    <div className="container-page py-6 lg:py-8">
      <nav aria-label="Breadcrumb" className="mb-3 text-[13px] text-muted">
        <Link href="/" className="hover:text-text">{t.breadcrumb.home}</Link>
        <span className="mx-1.5 text-subtle">›</span>
        <span className="text-text">{t.breadcrumb.dealers}</span>
      </nav>

      <header className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div className="max-w-2xl">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-success-soft px-2.5 py-1 text-[11px] font-semibold text-success">
            <CircleCheck className="size-3.5" aria-hidden /> {t.hero.badge}
          </span>
          <h1 className="mt-3 text-[28px] font-extrabold leading-tight text-text sm:text-[34px]">
            {t.hero.title}
          </h1>
          <p className="mt-2 text-[15px] leading-relaxed text-muted">
            {t.hero.text}
          </p>
        </div>
        <Link
          href="/royxatdan-otish?turi=yuridik"
          className="inline-flex h-11 shrink-0 items-center justify-center gap-2 rounded-lg bg-primary-soft px-5 text-sm font-semibold text-primary transition-colors hover:brightness-95"
        >
          <Store className="size-4" aria-hidden /> {t.hero.addShowroom}
        </Link>
      </header>

      {/* Statistika — faqat bazadagi haqiqiy raqamlar */}
      <div className="mt-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
        {statCards.map((s) => (
          <div key={s.label} className="rounded-xl border border-border bg-surface p-4 sm:p-5">
            <div className="flex items-start justify-between gap-2">
              <p className="text-[12px] font-medium text-muted sm:text-[13px]">{s.label}</p>
              <span
                className={cn(
                  'flex size-8 shrink-0 items-center justify-center rounded-lg',
                  s.accent ? 'bg-success-soft text-success' : 'bg-primary-soft text-primary',
                )}
              >
                <s.icon className="size-4" aria-hidden />
              </span>
            </div>
            <p
              className={cn(
                'font-display tabular mt-2 text-[24px] font-extrabold leading-none sm:text-[32px]',
                s.accent ? 'text-success' : 'text-text',
              )}
            >
              {s.value}
            </p>
            <p className="mt-2 text-[11px] text-subtle sm:text-[12px]">{s.hint}</p>
          </div>
        ))}
      </div>

      {/* Filtrlar */}
      <section className="mt-6 rounded-xl border border-border bg-surface p-4 sm:p-5" aria-label={t.filters.aria}>
        <DealerFilters
          regions={facets.regions}
          sorts={sorts}
          value={{
            q: filters.q,
            region: filters.region,
            tag: filters.tag,
            verified: filters.verified,
            sort: filters.sort,
          }}
        />
        {facets.tags.length > 0 ? (
          <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-border pt-4">
            <span className="text-[12px] font-medium text-muted">{t.filters.popular}</span>
            {facets.tags.map(({ tag }) => {
              const active = filters.tag === tag
              return (
                <Link
                  key={tag}
                  href={hrefWith(filters, { tag: active ? undefined : tag, page: undefined })}
                  aria-pressed={active}
                  className={cn(
                    'inline-flex items-center gap-1 rounded-full border px-3 py-1 text-[12px] font-medium transition-colors',
                    active
                      ? 'border-primary bg-primary-soft text-primary'
                      : 'border-border bg-surface-2 text-text hover:border-border-strong',
                  )}
                >
                  {active ? <CircleCheck className="size-3.5" aria-hidden /> : null}
                  {tag}
                </Link>
              )
            })}
            {hasFilters ? (
              <Link
                href="/dilerlar"
                className="ml-auto inline-flex items-center gap-1 text-[12px] font-semibold text-danger hover:underline"
              >
                <X className="size-3.5" aria-hidden /> {t.filters.clear}
              </Link>
            ) : null}
          </div>
        ) : null}
      </section>

      {/* Ro'yxat */}
      <section className="mt-8" aria-labelledby="dealers-title">
        <div className="mb-4 flex flex-wrap items-baseline justify-between gap-2">
          <h2 id="dealers-title" className="text-[22px] font-bold text-text">
            {t.list.title}{' '}
            <span className="tabular text-primary">{fmt(t.list.count, { n: result.total })}</span>
          </h2>
          {result.total > 0 ? (
            <p className="tabular text-[13px] text-muted">
              {fmt(t.list.range, { from, to })}
            </p>
          ) : null}
        </div>

        {result.items.length > 0 ? (
          <div className="space-y-4">
            {result.items.map((d) => (
              <DealerCard key={d.id} dealer={d} />
            ))}
          </div>
        ) : (
          <EmptyState
            icon={<Building2 />}
            title={t.list.emptyTitle}
            description={t.list.emptyText}
            action={
              <Link href="/dilerlar" className="text-sm font-semibold text-primary hover:underline">
                {t.list.emptyAction}
              </Link>
            }
          />
        )}

        <Pagination
          className="mt-6"
          page={result.page}
          pageCount={result.pageCount}
          buildHref={(page) => hrefWith(filters, { page: page > 1 ? String(page) : undefined })}
        />
      </section>

      {/* Xarita */}
      {points.length > 0 ? (
        <section className="mt-10 rounded-xl border border-border bg-surface p-4 sm:p-5" aria-labelledby="map-title">
          <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
            <div>
              <h2 id="map-title" className="text-[20px] font-bold text-text">{t.map.title}</h2>
              <p className="mt-1 text-[13px] text-muted">
                {t.map.text}
              </p>
            </div>
            <ul className="flex flex-wrap gap-1.5">
              {facets.regions.slice(0, 5).map((r) => (
                <li key={r.slug}>
                  <Link
                    href={hrefWith(filters, { region: filters.region === r.slug ? undefined : r.slug, page: undefined })}
                    className={cn(
                      'inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-[12px] font-medium',
                      filters.region === r.slug
                        ? 'border-primary bg-primary-soft text-primary'
                        : 'border-border text-text hover:bg-surface-2',
                    )}
                  >
                    <span className="size-1.5 rounded-full bg-primary" aria-hidden />
                    {r.name} <span className="tabular text-muted">({r.count})</span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>
          <DealerMap
            points={points}
            activeSlug={activePoint}
            buildHref={(slug) => `${hrefWith(filters, { nuqta: slug })}#map-title`}
          />
        </section>
      ) : null}

      {/* Dilerlar uchun CTA */}
      <section className="relative mt-10 overflow-hidden rounded-2xl bg-primary px-6 py-8 text-primary-fg sm:px-10 sm:py-10">
        <div
          className="pointer-events-none absolute -right-16 -top-10 size-72 rounded-full bg-white/10"
          aria-hidden
        />
        <div className="relative max-w-2xl">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-white/15 px-3 py-1 text-[11px] font-semibold">
            <Store className="size-3.5" aria-hidden /> {t.cta.badge}
          </span>
          <h2 className="mt-4 text-[24px] font-extrabold leading-tight sm:text-[30px]">
            {t.cta.title}
          </h2>
          <p className="mt-3 text-[15px] leading-relaxed opacity-90">
            {t.cta.text}
          </p>
          <ul className="mt-5 grid gap-2 text-[13px] font-medium sm:grid-cols-3">
            {t.cta.points.map((p) => (
              <li key={p} className="inline-flex items-center gap-2">
                <CircleCheck className="size-4 shrink-0" aria-hidden /> {p}
              </li>
            ))}
          </ul>
          <div className="mt-6 flex flex-col gap-2.5 sm:flex-row">
            <Link
              href="/royxatdan-otish?turi=yuridik"
              className="inline-flex h-11 items-center justify-center gap-2 rounded-lg bg-surface px-5 text-sm font-semibold text-primary transition-opacity hover:opacity-90"
            >
              {t.cta.join} <ChevronRight className="size-4" aria-hidden />
            </Link>
            <a
              href={`tel:${SITE.phone}`}
              className="tabular inline-flex h-11 items-center justify-center gap-2 rounded-lg bg-white/15 px-5 text-sm font-semibold transition-colors hover:bg-white/25"
            >
              <Headphones className="size-4" aria-hidden /> {formatPhone(SITE.phone)}
            </a>
          </div>
        </div>
      </section>
    </div>
  )
}
