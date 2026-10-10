'use client'

import * as React from 'react'
import { ChevronDown } from 'lucide-react'
import { cn } from '@/lib/utils'

export function FilterSection({
  title,
  count,
  defaultOpen = true,
  children,
}: {
  title: string
  count?: number
  defaultOpen?: boolean
  children: React.ReactNode
}) {
  const [open, setOpen] = React.useState(defaultOpen)

  return (
    <div className="border-b border-border py-1.5 last:border-0">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className="flex min-h-11 w-full items-center justify-between gap-2 text-left"
      >
        <span className="flex items-center gap-2 text-sm font-semibold text-text">
          {title}
          {count ? (
            <span className="tabular flex size-[18px] items-center justify-center rounded-full bg-primary text-[10px] font-bold text-primary-fg">
              {count}
            </span>
          ) : null}
        </span>
        <ChevronDown
          className={cn(
            'size-4 shrink-0 text-subtle transition-transform',
            open && 'rotate-180',
          )}
        />
      </button>
      {open ? <div className="mb-2 mt-1">{children}</div> : null}
    </div>
  )
}

/** Millionlarda kiritiladigan pul oralig'i */
export function MoneyRange({
  minKey,
  maxKey,
  minValue,
  maxValue,
  onChange,
  unit = '',
  divisor = 1_000_000,
  placeholderMin = '',
  placeholderMax = '',
}: {
  minKey: string
  maxKey: string
  minValue: string
  maxValue: string
  onChange: (key: string, value: string) => void
  unit?: string
  divisor?: number
  placeholderMin?: string
  placeholderMax?: string
}) {
  const toDisplay = React.useCallback(
    (raw: string) => {
      if (!raw) return ''
      const n = Number(raw)
      if (!Number.isFinite(n)) return ''
      return String(Math.round((n / divisor) * 100) / 100)
    },
    [divisor],
  )

  const [minDraft, setMinDraft] = React.useState(() => toDisplay(minValue))
  const [maxDraft, setMaxDraft] = React.useState(() => toDisplay(maxValue))
  const [synced, setSynced] = React.useState({ min: minValue, max: maxValue })

  // Filtr tashqaridan tozalansa (chip yoki "Hammasini tozalash") maydonlar ham yangilanadi
  if (synced.min !== minValue || synced.max !== maxValue) {
    setSynced({ min: minValue, max: maxValue })
    if (synced.min !== minValue) setMinDraft(toDisplay(minValue))
    if (synced.max !== maxValue) setMaxDraft(toDisplay(maxValue))
  }

  const apply = (key: string, draft: string) => {
    const cleaned = draft.replace(/[^\d.,]/g, '').replace(',', '.')
    if (cleaned === '') {
      onChange(key, '')
      return
    }
    const n = Number(cleaned)
    if (!Number.isFinite(n) || n < 0) return
    onChange(key, String(Math.round(n * divisor)))
  }

  const inputClass =
    'h-11 w-full rounded-[9px] border border-border bg-surface px-2.5 text-sm text-text placeholder:text-subtle tabular hover:border-border-strong lg:h-9'

  return (
    <div className="flex items-center gap-2">
      <div className="relative flex-1">
        <input
          type="text"
          inputMode="decimal"
          value={minDraft}
          onChange={(e) => setMinDraft(e.target.value)}
          onBlur={() => apply(minKey, minDraft)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault()
              apply(minKey, minDraft)
            }
          }}
          placeholder={placeholderMin}
          aria-label={unit ? `${placeholderMin} (${unit})` : placeholderMin}
          className={cn(inputClass, 'pr-9')}
        />
        <span className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-[11px] text-subtle">
          {unit}
        </span>
      </div>
      <span className="text-subtle">–</span>
      <div className="relative flex-1">
        <input
          type="text"
          inputMode="decimal"
          value={maxDraft}
          onChange={(e) => setMaxDraft(e.target.value)}
          onBlur={() => apply(maxKey, maxDraft)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault()
              apply(maxKey, maxDraft)
            }
          }}
          placeholder={placeholderMax}
          aria-label={unit ? `${placeholderMax} (${unit})` : placeholderMax}
          className={cn(inputClass, 'pr-9')}
        />
        <span className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-[11px] text-subtle">
          {unit}
        </span>
      </div>
    </div>
  )
}
