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
    <div className="container-page py-6 lg:py-8">
      <div className="mb-5">
        <h1 className="text-2xl font-bold tracking-tight text-text">
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
          <div className="mb-4 flex flex-col gap-3">
            <div className="flex items-center justify-between gap-3">
              <FiltersDrawer data={filtersData} activeCount={activeCount} />
              <div className="ml-auto">
                <SortSelect />
              </div>
            </div>
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
