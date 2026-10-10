'use client'

import Image from 'next/image'
import { Link, useMessages } from '@/i18n/client'
import { fmt } from '@/i18n/format'
import { ArrowRight, Scale, X } from 'lucide-react'
import { useCompare } from '@/lib/compare-store'
import { MAX_COMPARE_ITEMS } from '@/lib/constants'

/**
 * Taqqoslash ro'yxati localStorage'da — panel faqat brauzerda chiziladi.
 * Bo'sh bo'lsa, qanday qo'shishni tushuntiruvchi ixcham satr qoladi.
 */
export function QuickComparePanel() {
  const { items, isReady, remove, clear } = useCompare()
  const t = useMessages().cabinet.compare
  if (!isReady) return <div className="h-19 rounded-xl border border-border bg-surface" aria-hidden />

  if (items.length === 0) {
    return (
      <div className="flex items-center gap-3 rounded-xl border border-dashed border-border-strong bg-surface px-4 py-3 text-[13px] text-muted">
        <Scale className="size-5 shrink-0 text-primary" aria-hidden />
        {fmt(t.empty, { max: MAX_COMPARE_ITEMS })}
      </div>
    )
  }

  return (
    <section className="flex flex-col gap-3 rounded-xl border border-border bg-surface p-3 shadow-sm lg:flex-row lg:items-center">
      <div className="flex shrink-0 items-center gap-3 lg:w-64">
        <span className="flex size-11 items-center justify-center rounded-xl bg-primary-soft text-primary">
          <Scale className="size-5" aria-hidden />
        </span>
        <div>
          <p className="flex items-center gap-2 text-[15px] font-bold text-text">
            {t.title}
            <span className="tabular rounded-md bg-surface-2 px-1.5 py-0.5 text-[11px] font-semibold text-muted">
              {items.length}/{MAX_COMPARE_ITEMS}
            </span>
          </p>
          <p className="text-[12px] text-muted">{t.subtitle}</p>
        </div>
      </div>

      <ul className="hide-scrollbar flex min-w-0 flex-1 gap-2 overflow-x-auto">
        {items.map((item) => (
          <li key={item.id} className="flex w-56 shrink-0 items-center gap-2 rounded-lg bg-surface-2 p-1.5 pr-2">
            <span className="relative h-10 w-14 shrink-0 overflow-hidden rounded-md bg-surface-3">
              {item.imageUrl ? (
                <Image src={item.imageUrl} alt="" fill sizes="56px" className="object-cover" />
              ) : null}
            </span>
            <Link href={`/elon/${item.slug}`} className="line-clamp-2x min-w-0 flex-1 text-[12px] font-semibold leading-snug text-text hover:text-primary">
              {item.title}
            </Link>
            <button
              type="button"
              onClick={() => remove(item.id)}
              aria-label={fmt(t.remove, { title: item.title })}
              className="rounded p-1 text-subtle hover:bg-surface-3 hover:text-text"
            >
              <X className="size-3.5" />
            </button>
          </li>
        ))}
      </ul>

      <div className="flex shrink-0 gap-2">
        <Link
          href={`/taqqoslash?ids=${items.map((i) => i.id).join(',')}`}
          className="inline-flex h-10 flex-1 items-center justify-center gap-1.5 rounded-lg bg-primary px-4 text-[13px] font-semibold text-primary-fg hover:bg-primary-hover"
        >
          {t.open} <ArrowRight className="size-4" aria-hidden />
        </Link>
        <button
          type="button"
          onClick={clear}
          aria-label={t.clear}
          className="inline-flex size-10 items-center justify-center rounded-lg bg-surface-2 text-muted hover:bg-surface-3 hover:text-text"
        >
          <X className="size-4" />
        </button>
      </div>
    </section>
  )
}
