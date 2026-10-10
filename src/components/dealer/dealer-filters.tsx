'use client'

import * as React from 'react'
import { ArrowDownUp, Building2, MapPin, Search, SlidersHorizontal } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useHref, useMessages } from '@/i18n/client'

/**
 * Oddiy GET forma: filtrlar URL'da saqlanadi, JS o'chiq bo'lsa ham ishlaydi.
 * Tanlov o'zgarganda forma darhol yuboriladi; matnli qidiruv — Enter bilan.
 */
export function DealerFilters({
  regions,
  sorts,
  value,
}: {
  regions: { slug: string; name: string; count: number }[]
  sorts: readonly { value: string; label: string }[]
  value: { q?: string; region?: string; tag?: string; verified: boolean; sort: string }
}) {
  const t = useMessages().dealers.filters
  const href = useHref()
  const formRef = React.useRef<HTMLFormElement>(null)
  const submit = () => formRef.current?.requestSubmit()
  // Telefonda tanlovlar yig'ilgan turadi — faol filtr bo'lsa ochiq
  const activeCount = [value.region, value.verified, value.sort !== 'rating'].filter(Boolean).length
  const [open, setOpen] = React.useState(activeCount > 0)

  const selectClass =
    'h-11 w-full appearance-none rounded-lg border border-border bg-surface-2 pl-9 pr-8 text-sm text-text transition-colors hover:border-border-strong'

  return (
    <form ref={formRef} action={href('/dilerlar')} method="get" className="grid gap-3 sm:grid-cols-2 lg:grid-cols-[3fr_1.3fr_auto] lg:items-end">
      {value.tag ? <input type="hidden" name="tag" value={value.tag} /> : null}

      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className="order-2 inline-flex h-11 items-center justify-center gap-2 rounded-lg border border-border bg-surface-2 text-sm font-semibold text-text sm:col-span-2 lg:hidden"
      >
        <SlidersHorizontal className="size-4" aria-hidden />
        {open ? t.hide : t.toggle}
        {activeCount > 0 ? (
          <span className="tabular rounded-full bg-primary px-1.5 text-[11px] leading-5 text-primary-fg">{activeCount}</span>
        ) : null}
      </button>

      <div className={cn('order-3 gap-3 sm:col-span-2 sm:grid-cols-2 lg:order-none lg:col-span-1 lg:grid lg:grid-cols-3', open ? 'grid' : 'hidden')}>
      <label className="space-y-1.5">
        <span className="block text-[11px] font-semibold uppercase tracking-wide text-muted">{t.region}</span>
        <span className="relative block">
          <MapPin className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-subtle" aria-hidden />
          <select name="region" defaultValue={value.region ?? ''} onChange={submit} className={selectClass}>
            <option value="">{t.allRegions}</option>
            {regions.map((r) => (
              <option key={r.slug} value={r.slug}>
                {r.name} ({r.count})
              </option>
            ))}
          </select>
        </span>
      </label>

      <label className="space-y-1.5">
        <span className="block text-[11px] font-semibold uppercase tracking-wide text-muted">{t.partnership}</span>
        <span className="relative block">
          <Building2 className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-subtle" aria-hidden />
          <select name="verified" defaultValue={value.verified ? '1' : ''} onChange={submit} className={selectClass}>
            <option value="">{t.allDealers}</option>
            <option value="1">{t.verifiedOnly}</option>
          </select>
        </span>
      </label>

      <label className="space-y-1.5">
        <span className="block text-[11px] font-semibold uppercase tracking-wide text-muted">{t.sort}</span>
        <span className="relative block">
          <ArrowDownUp className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-subtle" aria-hidden />
          <select name="sort" defaultValue={value.sort} onChange={submit} className={selectClass}>
            {sorts.map((s) => (
              <option key={s.value} value={s.value}>
                {s.label}
              </option>
            ))}
          </select>
        </span>
      </label>

      </div>

      <label className="order-1 space-y-1.5 sm:col-span-2 lg:order-none lg:col-span-1">
        <span className="block text-[11px] font-semibold uppercase tracking-wide text-muted">{t.search}</span>
        <span className="relative block">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-subtle" aria-hidden />
          <input
            type="search"
            name="q"
            defaultValue={value.q ?? ''}
            placeholder={t.searchPlaceholder}
            enterKeyHint="search"
            className={cn(selectClass, 'pr-3')}
          />
        </span>
      </label>

      <button
        type="submit"
        className="order-4 inline-flex h-11 items-center justify-center gap-2 rounded-lg bg-primary px-5 text-sm font-semibold text-primary-fg transition-colors hover:bg-primary-hover sm:col-span-2 lg:order-none lg:col-span-1"
      >
        <Search className="size-4" aria-hidden /> {t.submit}
      </button>
    </form>
  )
}
