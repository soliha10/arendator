import type { Metadata } from 'next'
import { ChevronRight, SearchX } from 'lucide-react'
import { getBrandsWithModels, getRegions, searchListings } from '@/server/listings'
import { getFavoriteIds } from '@/server/actions/favorites'
import {
  countActiveFilters, parseListingFilters, type ListingFilters,
} from '@/lib/validation/filters'
import { DEAL_TYPES } from '@/lib/constants'
import { Link } from '@/i18n/client'
import { fmt, plural } from '@/i18n/format'
import { getLocale, getMessages } from '@/i18n/server'
import { regionLabel } from '@/i18n/labels'
import { alternatesFor, ogLocale } from '@/i18n/seo'
import type { Messages } from '@/i18n/messages'
import type { Locale } from '@/i18n/config'
import { formatMoney } from '@/lib/format'
import { cn } from '@/lib/utils'
import { ListingGrid } from '@/components/listing/listing-grid'
import { FiltersDrawer, FiltersSidebar } from '@/components/catalog/filters-panel'
import { ActiveFilterChips, SortSelect } from '@/components/catalog/toolbar'
import { SaveSearchButton } from '@/components/catalog/save-search-button'
import { Pagination } from '@/components/ui/pagination'
import { EmptyState } from '@/components/ui/empty'
import { Button } from '@/components/ui/button'

type SearchParams = Record<string, string | string[] | undefined>

type DealKey = keyof Messages['catalog']['deals']

/** Bitta bitim turi tanlangan bo'lsa — sahifa shu turga bag'ishlanadi */
function singleDeal(f: ListingFilters): DealKey | null {
  return f.planType.length === 1 ? f.planType[0] : null
}

export async function generateMetadata(props: PageProps<'/[lang]/elonlar'>): Promise<Metadata> {
  const [filters, m, locale] = await Promise.all([
    props.searchParams.then(parseListingFilters),
    getMessages(),
    getLocale(),
  ])
  const t = m.catalog
  const deal = singleDeal(filters)
  const page = deal ? t.deals[deal] : null
  const title = page?.title ?? t.metaTitle
  const description = page?.description ?? t.metaDescription
  return {
    title,
    description,
    alternates: alternatesFor(deal ? `/elonlar?planType=${deal}` : '/elonlar', locale),
    openGraph: { title, description, locale: ogLocale(locale) },
  }
}

/** Saqlangan qidiruv uchun odamga tushunarli nom: "Arenda · Chevrolet · oyiga ≤ 5 mln" */
function searchName(
  f: ListingFilters,
  brands: { slug: string; name: string }[],
  regions: { slug: string; name: string }[],
  m: Messages,
  locale: Locale,
): string {
  const t = m.catalog.searchName
  const money = (v: number) => formatMoney(v, 'UZS', { compact: true, locale })
  const parts: string[] = []
  for (const d of f.planType) parts.push(m.enums.dealTypeShort[d])
  parts.push(...f.brand.map((s) => brands.find((b) => b.slug === s)?.name ?? s))
  parts.push(...f.region.map((s) => regionLabel(m, s, regions.find((r) => r.slug === s)?.name ?? s)))
  if (f.q) parts.push(`“${f.q}”`)
  if (f.monthlyMax) parts.push(fmt(t.monthlyMax, { v: money(f.monthlyMax) }))
  if (f.downMax) parts.push(fmt(t.downMax, { v: money(f.downMax) }))
  if (f.priceMax) parts.push(fmt(t.priceMax, { v: money(f.priceMax) }))
  if (f.termMin) parts.push(fmt(t.termMin, { n: f.termMin }))
  if (f.priceDrop) parts.push(t.priceDrop)
  const name = parts.slice(0, 5).join(' · ')
  return (name || t.fallback).slice(0, 80)
}

/** planType'ni almashtirib, qolgan filtrlarni saqlaydigan havola */
function dealHref(searchParams: SearchParams, deal: string | null): string {
  const params = new URLSearchParams()
  for (const [key, value] of Object.entries(searchParams)) {
    if (value === undefined || key === 'page' || key === 'planType') continue
    params.set(key, Array.isArray(value) ? value.join(',') : value)
  }
  if (deal) params.set('planType', deal)
  const qs = params.toString()
  return qs ? `/elonlar?${qs}` : '/elonlar'
}

export default async function CatalogPage(props: PageProps<'/[lang]/elonlar'>) {
  const searchParams = await props.searchParams
  const filters = parseListingFilters(searchParams)
  const activeCount = countActiveFilters(filters)
  const deal = singleDeal(filters)

  const [result, brands, regions, favoriteIds, m, locale] = await Promise.all([
    searchListings(filters),
    getBrandsWithModels(),
    getRegions(),
    getFavoriteIds(),
    getMessages(),
    getLocale(),
  ])
  const t = m.catalog

  const filtersData = {
    brands: brands.map((b) => ({
      id: b.id,
      slug: b.slug,
      name: b.name,
      models: b.models,
    })),
    // E'loni bor viloyatlar yuqorida turadi
    regions: [...regions]
      .map((r) => ({
        id: r.id,
        slug: r.slug,
        name: regionLabel(m, r.slug, r.name),
        count: r._count.listings,
      }))
      .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name, locale)),
  }

  const buildHref = (page: number) => {
    const params = new URLSearchParams()
    for (const [key, value] of Object.entries(searchParams)) {
      if (value === undefined) continue
      params.set(key, Array.isArray(value) ? value.join(',') : value)
    }
    params.set('page', String(page))
    return `/elonlar?${params.toString()}`
  }

  const title = filters.q
    ? fmt(t.titleQuery, { q: filters.q })
    : deal
      ? t.deals[deal].title
      : filters.priceDrop
        ? t.titlePriceDrop
        : t.titleAll
  const savedName = searchName(filters, filtersData.brands, filtersData.regions, m, locale)

  const from = result.total === 0 ? 0 : (result.page - 1) * result.perPage + 1
  const to = Math.min(result.total, result.page * result.perPage)

  return (
    <div className="container-page py-4 sm:py-6 lg:py-8">
      <nav aria-label={t.breadcrumbAria} className="mb-3 flex items-center gap-1 text-[13px] text-muted">
        <Link href="/" className="hover:text-text">{t.breadcrumbHome}</Link>
        <ChevronRight className="size-3.5 text-subtle" aria-hidden />
        <span className="text-text">{deal ? m.enums.dealTypeShort[deal] : t.breadcrumbListings}</span>
      </nav>

      <div className="mb-4 flex flex-col gap-3 sm:mb-5 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h1 className="text-[24px] font-extrabold tracking-tight text-text sm:text-[30px]">{title}</h1>
          <p className="mt-1 text-sm text-muted">
            <span className="tabular">{plural(locale, result.total, t.found)}</span>
            {deal ? <span className="hidden sm:inline"> · {t.deals[deal].description}</span> : null}
          </p>
        </div>
      </div>

      {/* Bitim turi bo'yicha tez almashtirish */}
      <div className="hide-scrollbar -mx-4 mb-5 flex gap-1.5 overflow-x-auto px-4 sm:mx-0 sm:px-0">
        {[null, ...DEAL_TYPES.map((d) => d.value)].map((value) => {
          const active = value === null ? filters.planType.length === 0 : deal === value
          return (
            <Link
              key={value ?? 'all'}
              href={dealHref(searchParams, value)}
              scroll={false}
              aria-current={active ? 'page' : undefined}
              className={cn(
                'inline-flex h-10 shrink-0 items-center whitespace-nowrap rounded-lg px-4 text-[13px] font-semibold transition-colors',
                active
                  ? 'bg-primary text-primary-fg shadow-sm'
                  : 'border border-border bg-surface text-text hover:bg-surface-2',
              )}
            >
              {value ? m.enums.dealTypeShort[value] : t.tabAll}
            </Link>
          )
        })}
      </div>

      <div className="grid gap-6 lg:grid-cols-[280px_1fr]">
        <FiltersSidebar data={filtersData} />

        <div className="min-w-0">
          {/*
            Telefonda filtr va saralash sarlavha ostida yopishib qoladi —
            uzun roʻyxatni aylantirib ketgandan keyin ham qoʻl ostida.
          */}
          <div className="sticky top-[var(--header-h)] z-30 -mx-4 mb-3 border-b border-border bg-bg/95 px-4 py-2.5 backdrop-blur sm:-mx-6 sm:px-6 lg:static lg:z-auto lg:mx-0 lg:mb-4 lg:border-0 lg:bg-transparent lg:px-0 lg:py-0 lg:backdrop-blur-none">
            <div className="grid grid-cols-2 gap-2 lg:flex lg:items-center lg:justify-between">
              <FiltersDrawer
                data={filtersData}
                activeCount={activeCount}
                resultCount={result.total}
              />
              <p className="tabular hidden text-[13px] text-muted lg:block">
                {result.total > 0 ? fmt(t.range, { from, to, total: result.total }) : null}
              </p>
              <div className="contents lg:flex lg:items-center lg:gap-2">
                <SaveSearchButton
                  name={savedName}
                  disabled={activeCount === 0}
                  className="hidden lg:inline-flex"
                />
                <SortSelect />
              </div>
            </div>
          </div>

          <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <ActiveFilterChips data={filtersData} />
            {activeCount > 0 ? (
              <SaveSearchButton
                name={savedName}
                className="w-full sm:w-auto lg:hidden"
              />
            ) : null}
          </div>

          {result.items.length > 0 ? (
            <>
              <ListingGrid listings={result.items} favoriteIds={favoriteIds} />
              <Pagination
                page={result.page}
                pageCount={result.pageCount}
                buildHref={buildHref}
                className="mt-8"
              />
            </>
          ) : (
            <EmptyState
              icon={<SearchX />}
              title={t.empty.title}
              description={t.empty.description}
              action={
                <div className="flex flex-col gap-2 sm:flex-row">
                  {activeCount > 0 ? (
                    <SaveSearchButton
                      name={savedName}
                    />
                  ) : null}
                  <Button asChild variant="outline">
                    <Link href="/elonlar">{t.empty.clear}</Link>
                  </Button>
                </div>
              }
            />
          )}
        </div>
      </div>
    </div>
  )
}
