import type { Metadata } from 'next'
import { SearchX } from 'lucide-react'
import { getBrandsWithModels, getRegions, searchListings } from '@/server/listings'
import { getFavoriteIds } from '@/server/actions/favorites'
import { countActiveFilters, parseListingFilters } from '@/lib/validation/filters'
import { ListingGrid } from '@/components/listing/listing-grid'
import { FiltersDrawer, FiltersSidebar } from '@/components/catalog/filters-panel'
import { ActiveFilterChips, SortSelect } from '@/components/catalog/toolbar'
import { Pagination } from '@/components/ui/pagination'
import { EmptyState } from '@/components/ui/empty'
import { Button } from '@/components/ui/button'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Eʼlonlar',
  description:
    'Rassrochka va arendaga qoʻyilgan avtomobillar. Oylik toʻlov, boshlangʻich toʻlov va muddat boʻyicha filtrlang.',
}

export default async function CatalogPage(props: PageProps<'/elonlar'>) {
  const searchParams = await props.searchParams
  const filters = parseListingFilters(searchParams)
  const activeCount = countActiveFilters(filters)

  const [result, brands, regions, favoriteIds] = await Promise.all([
    searchListings(filters),
    getBrandsWithModels(),
    getRegions(),
    getFavoriteIds(),
  ])

  const filtersData = {
    brands: brands.map((b) => ({
      id: b.id,
      slug: b.slug,
      name: b.name,
      models: b.models,
    })),
    // E'loni bor viloyatlar yuqorida turadi
    regions: [...regions]
      .sort((a, b) => b._count.listings - a._count.listings || a.name.localeCompare(b.name))
      .map((r) => ({
        id: r.id,
        slug: r.slug,
        name: r.name,
        count: r._count.listings,
      })),
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

  return (
    <div className="container-page py-4 sm:py-6 lg:py-8">
      <div className="mb-4 sm:mb-5">
        <h1 className="text-xl font-bold tracking-tight text-text sm:text-2xl">
          {filters.q ? `“${filters.q}” boʻyicha natijalar` : 'Barcha eʼlonlar'}
        </h1>
        <p className="mt-1 text-sm text-muted">
          <span className="tabular font-medium text-text">{result.total}</span> ta
          avtomobil topildi
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-[280px_1fr]">
        <FiltersSidebar data={filtersData} />

        <div className="min-w-0">
          {/*
            Telefonda filtr va saralash sarlavha ostida yopishib qoladi —
            uzun roʻyxatni aylantirib ketgandan keyin ham qoʻl ostida.
          */}
          <div className="sticky top-[var(--header-h)] z-30 -mx-4 mb-3 border-b border-border bg-bg/95 px-4 py-2.5 backdrop-blur sm:-mx-6 sm:px-6 lg:static lg:z-auto lg:mx-0 lg:mb-4 lg:border-0 lg:bg-transparent lg:px-0 lg:py-0 lg:backdrop-blur-none">
            <div className="grid grid-cols-2 gap-2 lg:flex lg:justify-end">
              <FiltersDrawer
                data={filtersData}
                activeCount={activeCount}
                resultCount={result.total}
              />
              <SortSelect />
            </div>
          </div>

          <div className="mb-4">
            <ActiveFilterChips data={filtersData} />
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
              title="Hech narsa topilmadi"
              description="Filtrlarni kengaytirib koʻring yoki boshqa kalit soʻz bilan qidiring. Balki narx oraligʻi juda tor boʻlgandir."
              action={
                <Button asChild variant="outline">
                  <Link href="/elonlar">Filtrlarni tozalash</Link>
                </Button>
              }
            />
          )}
        </div>
      </div>
    </div>
  )
}
