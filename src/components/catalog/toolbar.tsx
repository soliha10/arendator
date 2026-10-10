'use client'

import { X } from 'lucide-react'
import {
  BODY_TYPE_LABELS, CONDITION_LABELS, DRIVE_TYPE_LABELS, FUEL_TYPE_LABELS,
  PLAN_TYPE_LABELS, SORT_OPTIONS, TRANSMISSION_LABELS,
} from '@/lib/constants'
import { formatMoney } from '@/lib/format'
import { Select } from '@/components/ui/input'
import { useFilters } from './use-filters'
import type { FiltersData } from './filters-panel'

export function SortSelect() {
  const { get, setParam } = useFilters()
  return (
    <Select
      value={get('sort') || 'newest'}
      onChange={(e) => setParam('sort', e.target.value)}
      aria-label="Saralash"
      className="h-11 w-full lg:h-10 lg:w-56"
    >
      {SORT_OPTIONS.map((o) => (
        <option key={o.value} value={o.value}>
          {o.label}
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
  listChip('planType', (s) => PLAN_TYPE_LABELS[s as keyof typeof PLAN_TYPE_LABELS])
  listChip('body', (s) => BODY_TYPE_LABELS[s as keyof typeof BODY_TYPE_LABELS])
  listChip('transmission', (s) => TRANSMISSION_LABELS[s as keyof typeof TRANSMISSION_LABELS])
  listChip('fuel', (s) => FUEL_TYPE_LABELS[s as keyof typeof FUEL_TYPE_LABELS])
  listChip('drive', (s) => DRIVE_TYPE_LABELS[s as keyof typeof DRIVE_TYPE_LABELS])
  listChip('condition', (s) => CONDITION_LABELS[s as keyof typeof CONDITION_LABELS])

  const money = (key: string, prefix: string) => {
    const raw = get(key)
    if (!raw) return
    chips.push({
      key,
      label: `${prefix} ${formatMoney(Number(raw), 'UZS', { compact: true })}`,
    })
  }

  money('monthlyMin', 'Oylik ≥')
  money('monthlyMax', 'Oylik ≤')
  money('downMin', 'Boshlangʻich ≥')
  money('downMax', 'Boshlangʻich ≤')
  money('priceMin', 'Narx ≥')
  money('priceMax', 'Narx ≤')

  if (get('termMin')) chips.push({ key: 'termMin', label: `${get('termMin')} oydan` })
  if (get('termMax')) chips.push({ key: 'termMax', label: `${get('termMax')} oygacha` })
  if (get('yearMin')) chips.push({ key: 'yearMin', label: `${get('yearMin')} yildan` })
  if (get('yearMax')) chips.push({ key: 'yearMax', label: `${get('yearMax')} yilgacha` })
  if (get('verified') === '1') chips.push({ key: 'verified', label: 'Tasdiqlangan arendator' })
  if (get('insurance') === '1') chips.push({ key: 'insurance', label: 'Sugʻurta bilan' })
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
          className="inline-flex min-h-9 items-center gap-1.5 rounded-full border border-border bg-surface px-3.5 text-[13px] text-text transition-colors hover:border-danger hover:text-danger"
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
          Hammasini tozalash
        </button>
      ) : null}
    </div>
  )
}
