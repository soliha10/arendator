'use client'

import { X } from 'lucide-react'
import { SORT_OPTIONS } from '@/lib/constants'
import { formatCompactUzs } from '@/lib/format'
import { useLocale, useMessages } from '@/i18n/client'
import { fmt } from '@/i18n/format'
import { Select } from '@/components/ui/input'
import { useFilters } from './use-filters'
import { dealTypeLabels, featureLabels, type FiltersData } from './filters-panel'

export function SortSelect() {
  const { get, setParam } = useFilters()
  const m = useMessages()
  return (
    <Select
      value={get('sort') || 'newest'}
      onChange={(e) => setParam('sort', e.target.value)}
      aria-label={m.catalog.sortAria}
      className="h-11 w-full lg:h-10 lg:w-56"
    >
      {SORT_OPTIONS.map((o) => (
        <option key={o.value} value={o.value}>
          {m.enums.sort[o.value]}
        </option>
      ))}
    </Select>
  )
}

interface Chip {
  key: string
  value?: string
  label: string
}

/** Faol filtrlarni "chip" ko'rinishida ko'rsatadi va bittalab olib tashlaydi */
export function ActiveFilterChips({ data }: { data: FiltersData }) {
  const { get, getList, toggleInList, setParam, clearAll } = useFilters()
  const m = useMessages()
  const locale = useLocale()
  const t = m.catalog.chips
  const deals = dealTypeLabels(m)
  const features = featureLabels(m)
  const pick = <T extends Record<string, string>>(labels: T) => (s: string) =>
    (labels as Record<string, string>)[s]

  const chips: Chip[] = []

  const listChip = (
    key: string,
    resolve: (slug: string) => string | undefined,
  ) => {
    for (const value of getList(key)) {
      const label = resolve(value)
      if (label) chips.push({ key, value, label })
    }
  }

  listChip('brand', (s) => data.brands.find((b) => b.slug === s)?.name)
  listChip('model', (s) => {
    for (const b of data.brands) {
      const m = b.models.find((mm) => mm.slug === s)
      if (m) return `${b.name} ${m.name}`
    }
    return undefined
  })
  listChip('region', (s) => data.regions.find((r) => r.slug === s)?.name)
  listChip('planType', pick(deals))
  listChip('features', pick(features))
  listChip('body', pick(m.enums.bodyType))
  listChip('transmission', pick(m.enums.transmission))
  listChip('fuel', pick(m.enums.fuelType))
  listChip('drive', pick(m.enums.driveTypeLong))
  listChip('condition', pick(m.enums.condition))

  // Qisqa summa (Intl'siz — server va brauzerda bir xil): "5 mln" / "5 млн" / "5M"
  const money = (key: 'monthlyMin' | 'monthlyMax' | 'downMin' | 'downMax' | 'priceMin' | 'priceMax') => {
    const raw = get(key)
    if (!raw) return
    chips.push({ key, label: fmt(t[key], { v: formatCompactUzs(Number(raw), locale) }) })
  }

  money('monthlyMin')
  money('monthlyMax')
  money('downMin')
  money('downMax')
  money('priceMin')
  money('priceMax')

  for (const key of ['termMin', 'termMax', 'yearMin', 'yearMax'] as const) {
    const v = get(key)
    if (v) chips.push({ key, label: fmt(t[key], { n: v }) })
  }
  if (get('verified') === '1') chips.push({ key: 'verified', label: t.verified })
  if (get('priceDrop') === '1') chips.push({ key: 'priceDrop', label: t.priceDrop })
  if (get('insurance') === '1') chips.push({ key: 'insurance', label: t.insurance })
  if (get('q')) chips.push({ key: 'q', label: `“${get('q')}”` })

  if (chips.length === 0) return null

  return (
    <div className="flex flex-wrap items-center gap-2">
      {chips.map((chip) => (
        <button
          key={`${chip.key}:${chip.value ?? ''}`}
          type="button"
          onClick={() =>
            chip.value ? toggleInList(chip.key, chip.value) : setParam(chip.key, '')
          }
          className="inline-flex min-h-9 items-center gap-1.5 rounded-lg bg-primary-soft px-3 text-[13px] font-medium text-primary transition-colors hover:bg-danger-soft hover:text-danger"
        >
          {chip.label}
          <X className="size-3.5" />
        </button>
      ))}
      {chips.length > 1 ? (
        <button
          type="button"
          onClick={clearAll}
          className="min-h-9 px-1.5 text-[13px] font-medium text-muted underline-offset-4 hover:text-danger hover:underline"
        >
          {t.clearAll}
        </button>
      ) : null}
    </div>
  )
}
