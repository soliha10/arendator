'use client'

import * as React from 'react'
import { RotateCcw, SlidersHorizontal, X } from 'lucide-react'
import {
  BODY_TYPE_LABELS, CONDITION_LABELS, DRIVE_TYPE_LABELS,
  FUEL_TYPE_LABELS, PLAN_TYPE_LABELS, TERM_OPTIONS, TRANSMISSION_LABELS,
} from '@/lib/constants'
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
          <p className="px-1.5 py-2 text-[13px] text-subtle">Topilmadi</p>
        ) : null}
      </div>

      {!query && filtered.length > limit ? (
        <button
          type="button"
          onClick={() => setExpanded((v) => !v)}
          className="mt-1.5 px-1.5 text-[13px] font-medium text-primary hover:underline"
        >
          {expanded ? 'Yigʻish' : `Yana ${filtered.length - limit} ta`}
        </button>
      ) : null}
    </div>
  )
}

function FiltersBody({ data }: { data: FiltersData }) {
  const { get, getList, setParam, toggleInList, clearAll } = useFilters()

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
      <FilterSection title="Toʻlov turi" count={getList('planType').length}>
        <EnumFilter
          paramKey="planType"
          labels={PLAN_TYPE_LABELS}
          selected={getList('planType')}
          onToggle={toggleInList}
        />
      </FilterSection>

      <FilterSection title="Oylik toʻlov">
        <MoneyRange
          minKey="monthlyMin"
          maxKey="monthlyMax"
          minValue={get('monthlyMin')}
          maxValue={get('monthlyMax')}
          onChange={setParam}
        />
        <div className="mt-2.5 flex flex-wrap gap-1.5">
          {[3, 5, 8, 12].map((m) => (
            <button
              key={m}
              type="button"
              onClick={() => setParam('monthlyMax', String(m * 1_000_000))}
              className={cn(
                'inline-flex min-h-9 items-center rounded-full border px-3 text-[12px] transition-colors',
                get('monthlyMax') === String(m * 1_000_000)
                  ? 'border-primary bg-primary-soft text-primary'
                  : 'border-border text-muted hover:border-border-strong',
              )}
            >
              {m} mln gacha
            </button>
          ))}
        </div>
      </FilterSection>

      <FilterSection title="Boshlangʻich toʻlov">
        <MoneyRange
          minKey="downMin"
          maxKey="downMax"
          minValue={get('downMin')}
          maxValue={get('downMax')}
          onChange={setParam}
        />
      </FilterSection>

      <FilterSection title="Avtomobil narxi" defaultOpen={false}>
        <MoneyRange
          minKey="priceMin"
          maxKey="priceMax"
          minValue={get('priceMin')}
          maxValue={get('priceMax')}
          onChange={setParam}
        />
      </FilterSection>

      <FilterSection title="Muddat">
        <div className="flex flex-wrap gap-1.5">
          {TERM_OPTIONS.map((t) => {
            const active = get('termMin') === String(t)
            return (
              <button
                key={t}
                type="button"
                onClick={() => setParam('termMin', active ? '' : String(t))}
                className={cn(
                  'inline-flex min-h-9 items-center rounded-full border px-3.5 text-[12px] font-medium transition-colors',
                  active
                    ? 'border-primary bg-primary-soft text-primary'
                    : 'border-border text-muted hover:border-border-strong',
                )}
              >
                {t} oydan
              </button>
            )
          })}
        </div>
      </FilterSection>

      <FilterSection title="Marka" count={selectedBrands.length}>
        <SearchableList
          options={data.brands}
          selected={selectedBrands}
          onToggle={toggleInList}
          paramKey="brand"
          searchPlaceholder="Marka qidirish…"
        />
      </FilterSection>

      {availableModels.length > 0 ? (
        <FilterSection title="Model" count={selectedModels.length}>
          <SearchableList
            options={availableModels}
            selected={selectedModels}
            onToggle={toggleInList}
            paramKey="model"
            searchPlaceholder="Model qidirish…"
            limit={10}
          />
        </FilterSection>
      ) : null}

      <FilterSection title="Viloyat" count={getList('region').length}>
        <SearchableList
          options={data.regions}
          selected={getList('region')}
          onToggle={toggleInList}
          paramKey="region"
          searchPlaceholder="Viloyat qidirish…"
        />
      </FilterSection>

      <FilterSection title="Ishlab chiqarilgan yil" defaultOpen={false}>
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

      <FilterSection title="Holati" defaultOpen={false}>
        <EnumFilter
          paramKey="condition"
          labels={CONDITION_LABELS}
          selected={getList('condition')}
          onToggle={toggleInList}
        />
      </FilterSection>

      <FilterSection title="Kuzov" defaultOpen={false}>
        <EnumFilter
          paramKey="body"
          labels={BODY_TYPE_LABELS}
          selected={getList('body')}
          onToggle={toggleInList}
        />
      </FilterSection>

      <FilterSection title="Uzatmalar qutisi" defaultOpen={false}>
        <EnumFilter
          paramKey="transmission"
          labels={TRANSMISSION_LABELS}
          selected={getList('transmission')}
          onToggle={toggleInList}
        />
      </FilterSection>

      <FilterSection title="Yoqilgʻi" defaultOpen={false}>
        <EnumFilter
          paramKey="fuel"
          labels={FUEL_TYPE_LABELS}
          selected={getList('fuel')}
          onToggle={toggleInList}
        />
      </FilterSection>

      <FilterSection title="Uzatma" defaultOpen={false}>
        <EnumFilter
          paramKey="drive"
          labels={DRIVE_TYPE_LABELS}
          selected={getList('drive')}
          onToggle={toggleInList}
        />
      </FilterSection>

      <FilterSection title="Qoʻshimcha" defaultOpen={false}>
        <div className="space-y-0.5">
          <CheckboxRow
            checked={get('verified') === '1'}
            onCheckedChange={(v) => setParam('verified', v ? '1' : '')}
            label="Faqat tasdiqlangan arendatorlar"
          />
          <CheckboxRow
            checked={get('insurance') === '1'}
            onCheckedChange={(v) => setParam('insurance', v ? '1' : '')}
            label="Sugʻurta narxga kiritilgan"
          />
        </div>
      </FilterSection>

      <div className="pt-4">
        <Button variant="outline" block onClick={clearAll}>
          <RotateCcw /> Filtrlarni tozalash
        </Button>
      </div>
    </div>
  )
}

/** Desktop: chapdagi doimiy yon panel */
export function FiltersSidebar({ data }: { data: FiltersData }) {
  return (
    <aside className="hidden lg:block">
      <div className="card scroll-contain sticky top-[calc(var(--header-h)+1rem)] max-h-[calc(100dvh-var(--header-h)-2rem)] overflow-y-auto px-4 py-2">
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
        Filtrlar
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
          aria-label="Filtrlar"
        >
          <button
            type="button"
            aria-label="Yopish"
            onClick={() => setOpen(false)}
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
          />
          <div className="absolute inset-x-0 bottom-0 flex max-h-[90dvh] flex-col rounded-t-2xl border-t border-border bg-surface">
            {/* Tutqich — panel pastdan chiqqanini bildiradi */}
            <div className="flex justify-center pb-1 pt-2.5">
              <span className="h-1 w-10 rounded-full bg-border-strong" aria-hidden />
            </div>
            <div className="flex items-center justify-between border-b border-border py-1.5 pl-4 pr-2">
              <span className="text-[15px] font-semibold text-text">Filtrlar</span>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="tap inline-flex items-center justify-center rounded-lg text-muted hover:bg-surface-2"
                aria-label="Yopish"
              >
                <X className="size-[22px]" aria-hidden />
              </button>
            </div>
            <div className="scroll-contain flex-1 overflow-y-auto px-4">
              <FiltersBody data={data} />
            </div>
            <div className="border-t border-border p-4 pb-[calc(1rem+var(--safe-b))]">
              <Button block size="lg" onClick={() => setOpen(false)}>
                {resultCount !== undefined
                  ? `${resultCount} ta natijani koʻrish`
                  : 'Natijalarni koʻrish'}
              </Button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  )
}
