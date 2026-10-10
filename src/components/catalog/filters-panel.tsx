'use client'

import * as React from 'react'
import { RotateCcw, SlidersHorizontal, X } from 'lucide-react'
import { DEAL_TYPES, FEATURE_OPTIONS, TERM_OPTIONS } from '@/lib/constants'
import { useLocale, useMessages } from '@/i18n/client'
import { fmt, plural } from '@/i18n/format'
import type { Messages } from '@/i18n/messages'
import { CheckboxRow } from '@/components/ui/checkbox'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { FilterSection, MoneyRange } from './filter-section'
import { useFilters } from './use-filters'

export interface FilterOption {
  id: string
  slug: string
  name: string
  count?: number
}

export interface BrandOption extends FilterOption {
  models: { id: string; slug: string; name: string }[]
}

export interface FiltersData {
  brands: BrandOption[]
  regions: FilterOption[]
}

const CURRENT_YEAR = new Date().getFullYear()

/** Bitim turlari (to'lov shartlari + naqd sotuv) — joriy tilda */
export function dealTypeLabels(m: Messages): Record<string, string> {
  return Object.fromEntries(DEAL_TYPES.map((d) => [d.value, m.enums.dealType[d.value]]))
}

/** Qulayliklar — FEATURE_OPTIONS tartibida, joriy tilda */
export function featureLabels(m: Messages): Record<string, string> {
  return Object.fromEntries(FEATURE_OPTIONS.map((f) => [f.key, m.enums.feature[f.key]]))
}

function EnumFilter({
  paramKey,
  labels,
  selected,
  onToggle,
}: {
  paramKey: string
  labels: Record<string, string>
  selected: string[]
  onToggle: (key: string, value: string) => void
}) {
  return (
    <div className="space-y-0.5">
      {Object.entries(labels).map(([value, label]) => (
        <CheckboxRow
          key={value}
          checked={selected.includes(value)}
          onCheckedChange={() => onToggle(paramKey, value)}
          label={label}
        />
      ))}
    </div>
  )
}

/** Ko'p elementli ro'yxat — qidiruv bilan */
function SearchableList({
  options,
  selected,
  onToggle,
  paramKey,
  searchPlaceholder,
  limit = 8,
}: {
  options: FilterOption[]
  selected: string[]
  onToggle: (key: string, value: string) => void
  paramKey: string
  searchPlaceholder: string
  limit?: number
}) {
  const t = useMessages().catalog.filters
  const [query, setQuery] = React.useState('')
  const [expanded, setExpanded] = React.useState(false)

  const filtered = React.useMemo(() => {
    const q = query.trim().toLowerCase()
    const list = q
      ? options.filter((o) => o.name.toLowerCase().includes(q))
      : options
    // Tanlanganlar doim yuqorida
    return [...list].sort((a, b) => {
      const aSel = selected.includes(a.slug) ? 0 : 1
      const bSel = selected.includes(b.slug) ? 0 : 1
      return aSel - bSel
    })
  }, [options, query, selected])

  const visible = expanded || query ? filtered : filtered.slice(0, limit)

  return (
    <div>
      {options.length > limit ? (
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={searchPlaceholder}
          className="mb-2 h-11 w-full rounded-[9px] border border-border bg-surface px-2.5 text-sm text-text placeholder:text-subtle hover:border-border-strong lg:h-9"
        />
      ) : null}

      <div className="max-h-64 space-y-0.5 overflow-y-auto">
        {visible.map((o) => (
          <CheckboxRow
            key={o.id}
            checked={selected.includes(o.slug)}
            onCheckedChange={() => onToggle(paramKey, o.slug)}
            label={o.name}
            count={o.count}
          />
        ))}
        {visible.length === 0 ? (
          <p className="px-1.5 py-2 text-[13px] text-subtle">{t.notFound}</p>
        ) : null}
      </div>

      {!query && filtered.length > limit ? (
        <button
          type="button"
          onClick={() => setExpanded((v) => !v)}
          className="mt-1.5 px-1.5 text-[13px] font-medium text-primary hover:underline"
        >
          {expanded ? t.collapse : fmt(t.more, { n: filtered.length - limit })}
        </button>
      ) : null}
    </div>
  )
}

function FiltersBody({ data }: { data: FiltersData }) {
  const { get, getList, setParam, toggleInList, clearAll } = useFilters()
  const m = useMessages()
  const t = m.catalog.filters
  const range = { placeholderMin: t.from, placeholderMax: t.to, unit: t.mln }

  const selectedBrands = getList('brand')
  const selectedModels = getList('model')

  // Faqat tanlangan markalarning modellari ko'rsatiladi
  const availableModels = React.useMemo(() => {
    const brands = selectedBrands.length
      ? data.brands.filter((b) => selectedBrands.includes(b.slug))
      : []
    return brands.flatMap((b) =>
      b.models.map((m) => ({ id: m.id, slug: m.slug, name: `${b.name} ${m.name}` })),
    )
  }, [data.brands, selectedBrands])

  return (
    <div className="divide-y divide-border">
      <FilterSection title={t.dealType} count={getList('planType').length}>
        <EnumFilter
          paramKey="planType"
          labels={dealTypeLabels(m)}
          selected={getList('planType')}
          onToggle={toggleInList}
        />
      </FilterSection>

      <FilterSection title={t.monthly}>
        <MoneyRange
          minKey="monthlyMin"
          maxKey="monthlyMax"
          minValue={get('monthlyMin')}
          maxValue={get('monthlyMax')}
          onChange={setParam}
          {...range}
        />
        <div className="mt-2.5 flex flex-wrap gap-1.5">
          {[3, 5, 8, 12].map((mln) => (
            <button
              key={mln}
              type="button"
              onClick={() => setParam('monthlyMax', String(mln * 1_000_000))}
              className={cn(
                'inline-flex min-h-9 items-center rounded-lg px-3 text-[12px] font-medium transition-colors',
                get('monthlyMax') === String(mln * 1_000_000)
                  ? 'bg-primary text-primary-fg'
                  : 'bg-surface-2 text-text hover:bg-surface-3',
              )}
            >
              {fmt(t.monthlyChip, { n: mln })}
            </button>
          ))}
        </div>
      </FilterSection>

      <FilterSection title={t.down}>
        <MoneyRange
          minKey="downMin"
          maxKey="downMax"
          minValue={get('downMin')}
          maxValue={get('downMax')}
          onChange={setParam}
          {...range}
        />
      </FilterSection>

      <FilterSection title={t.price} defaultOpen={false}>
        <MoneyRange
          minKey="priceMin"
          maxKey="priceMax"
          minValue={get('priceMin')}
          maxValue={get('priceMax')}
          onChange={setParam}
          {...range}
        />
      </FilterSection>

      <FilterSection title={t.term}>
        <div className="flex flex-wrap gap-1.5">
          {TERM_OPTIONS.map((months) => {
            const active = get('termMin') === String(months)
            return (
              <button
                key={months}
                type="button"
                onClick={() => setParam('termMin', active ? '' : String(months))}
                className={cn(
                  'inline-flex min-h-9 items-center rounded-lg px-3.5 text-[12px] font-medium transition-colors',
                  active
                    ? 'bg-primary text-primary-fg'
                    : 'bg-surface-2 text-text hover:bg-surface-3',
                )}
              >
                {fmt(t.termChip, { n: months })}
              </button>
            )
          })}
        </div>
      </FilterSection>

      <FilterSection title={t.brand} count={selectedBrands.length}>
        <SearchableList
          options={data.brands}
          selected={selectedBrands}
          onToggle={toggleInList}
          paramKey="brand"
          searchPlaceholder={t.brandSearch}
        />
      </FilterSection>

      {availableModels.length > 0 ? (
        <FilterSection title={t.model} count={selectedModels.length}>
          <SearchableList
            options={availableModels}
            selected={selectedModels}
            onToggle={toggleInList}
            paramKey="model"
            searchPlaceholder={t.modelSearch}
            limit={10}
          />
        </FilterSection>
      ) : null}

      <FilterSection title={t.region} count={getList('region').length}>
        <SearchableList
          options={data.regions}
          selected={getList('region')}
          onToggle={toggleInList}
          paramKey="region"
          searchPlaceholder={t.regionSearch}
        />
      </FilterSection>

      <FilterSection title={t.year} defaultOpen={false}>
        <MoneyRange
          minKey="yearMin"
          maxKey="yearMax"
          minValue={get('yearMin')}
          maxValue={get('yearMax')}
          onChange={setParam}
          unit=""
          divisor={1}
          placeholderMin="1990"
          placeholderMax={String(CURRENT_YEAR)}
        />
      </FilterSection>

      <FilterSection title={t.condition} defaultOpen={false}>
        <EnumFilter
          paramKey="condition"
          labels={m.enums.condition}
          selected={getList('condition')}
          onToggle={toggleInList}
        />
      </FilterSection>

      <FilterSection title={t.body} defaultOpen={false}>
        <EnumFilter
          paramKey="body"
          labels={m.enums.bodyType}
          selected={getList('body')}
          onToggle={toggleInList}
        />
      </FilterSection>

      <FilterSection title={t.transmission} defaultOpen={false}>
        <EnumFilter
          paramKey="transmission"
          labels={m.enums.transmission}
          selected={getList('transmission')}
          onToggle={toggleInList}
        />
      </FilterSection>

      <FilterSection title={t.fuel} defaultOpen={false}>
        <EnumFilter
          paramKey="fuel"
          labels={m.enums.fuelType}
          selected={getList('fuel')}
          onToggle={toggleInList}
        />
      </FilterSection>

      <FilterSection title={t.drive} defaultOpen={false}>
        <EnumFilter
          paramKey="drive"
          labels={m.enums.driveTypeLong}
          selected={getList('drive')}
          onToggle={toggleInList}
        />
      </FilterSection>

      <FilterSection title={t.features} count={getList('features').length} defaultOpen={false}>
        <EnumFilter
          paramKey="features"
          labels={featureLabels(m)}
          selected={getList('features')}
          onToggle={toggleInList}
        />
      </FilterSection>

      <FilterSection title={t.extra}>
        <div className="space-y-0.5">
          <CheckboxRow
            checked={get('priceDrop') === '1'}
            onCheckedChange={(v) => setParam('priceDrop', v ? '1' : '')}
            label={t.priceDropOnly}
          />
          <CheckboxRow
            checked={get('verified') === '1'}
            onCheckedChange={(v) => setParam('verified', v ? '1' : '')}
            label={t.verifiedOnly}
          />
          <CheckboxRow
            checked={get('insurance') === '1'}
            onCheckedChange={(v) => setParam('insurance', v ? '1' : '')}
            label={t.insurance}
          />
        </div>
      </FilterSection>

      <div className="pt-4">
        <Button variant="outline" block onClick={clearAll}>
          <RotateCcw /> {t.clear}
        </Button>
      </div>
    </div>
  )
}

/** Desktop: chapdagi doimiy yon panel */
export function FiltersSidebar({ data }: { data: FiltersData }) {
  const t = useMessages().catalog.filters
  return (
    <aside className="hidden lg:block">
      <div className="scroll-contain sticky top-[calc(var(--header-h)+1rem)] max-h-[calc(100dvh-var(--header-h)-2rem)] overflow-y-auto rounded-xl border border-border bg-surface px-4 py-2 shadow-sm">
        <div className="flex items-center gap-2 border-b border-border py-3">
          <SlidersHorizontal className="size-4 text-primary" aria-hidden />
          <span className="font-display text-[15px] font-bold text-text">{t.title}</span>
        </div>
        <FiltersBody data={data} />
      </div>
    </aside>
  )
}

/** Mobil: tugma + pastdan chiqadigan oyna */
export function FiltersDrawer({
  data,
  activeCount,
  resultCount,
}: {
  data: FiltersData
  activeCount: number
  /** Tugmada "N ta natijani koʻrish" deb yozish uchun */
  resultCount?: number
}) {
  const [open, setOpen] = React.useState(false)
  const t = useMessages().catalog.filters
  const locale = useLocale()

  React.useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : ''
    return () => {
      document.body.style.overflow = ''
    }
  }, [open])

  return (
    <div className="lg:hidden">
      <Button variant="outline" block onClick={() => setOpen(true)} className="h-11">
        <SlidersHorizontal />
        {t.title}
        {activeCount > 0 ? (
          <span className="tabular ml-0.5 flex size-5 items-center justify-center rounded-full bg-primary text-[11px] font-bold text-primary-fg">
            {activeCount}
          </span>
        ) : null}
      </Button>

      {open ? (
        <div
          className="fixed inset-0 z-50"
          role="dialog"
          aria-modal="true"
          aria-label={t.title}
        >
          <button
            type="button"
            aria-label={t.close}
            onClick={() => setOpen(false)}
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
          />
          <div className="absolute inset-x-0 bottom-0 flex max-h-[90dvh] flex-col rounded-t-2xl border-t border-border bg-surface">
            {/* Tutqich — panel pastdan chiqqanini bildiradi */}
            <div className="flex justify-center pb-1 pt-2.5">
              <span className="h-1 w-10 rounded-full bg-border-strong" aria-hidden />
            </div>
            <div className="flex items-center justify-between border-b border-border py-1.5 pl-4 pr-2">
              <span className="text-[15px] font-semibold text-text">{t.title}</span>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="tap inline-flex items-center justify-center rounded-lg text-muted hover:bg-surface-2"
                aria-label={t.close}
              >
                <X className="size-5.5" aria-hidden />
              </button>
            </div>
            <div className="scroll-contain flex-1 overflow-y-auto px-4">
              <FiltersBody data={data} />
            </div>
            <div className="border-t border-border p-4 pb-[calc(1rem+var(--safe-b))]">
              <Button block size="lg" onClick={() => setOpen(false)}>
                {resultCount !== undefined
                  ? plural(locale, resultCount, t.showResults)
                  : t.showResultsPlain}
              </Button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  )
}
