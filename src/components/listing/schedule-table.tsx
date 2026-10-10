'use client'

import * as React from 'react'
import { ChevronDown, Download } from 'lucide-react'
import type { Currency } from '@prisma/client'
import type { ScheduleRowDto } from '@/server/mappers'
import { currencyLabel, formatDate, formatMoney } from '@/lib/format'
import { useLocale, useMessages } from '@/i18n/client'
import { fmt, plural } from '@/i18n/format'
import type { Messages } from '@/i18n/messages'
import { cn } from '@/lib/utils'

const PREVIEW_ROWS = 6

type ScheduleText = Messages['listing']['schedule']

function toCsv(rows: ScheduleRowDto[], currency: Currency, t: ScheduleText): string {
  const lines = rows.map((r) =>
    [
      r.monthIndex,
      formatDate(r.dueDate),
      r.balanceAfter + r.principal,
      r.principal,
      r.markup,
      r.amount,
    ].join(';'),
  )
  return [fmt(t.csvCurrency, { currency }), t.csvHeader.join(';'), ...lines].join('\n')
}

/** "1-oy (Noyabr 2026)" — ICU'da o'zbekcha oy nomlari yo'q, lug'atdan olinadi */
const monthLabel = (row: ScheduleRowDto, t: ScheduleText) => {
  const d = new Date(row.dueDate)
  return { index: fmt(t.monthIndex, { n: row.monthIndex }), date: `${t.months[d.getMonth()]} ${d.getFullYear()}` }
}

/**
 * Oyma-oy to'lov jadvali. Avval birinchi oylar ko'rinadi — to'liq jadval
 * bitta tugma bilan ochiladi (36–60 qator sahifani cho'zib yubormasligi uchun).
 */
export function ScheduleTable({
  schedule,
  currency,
  planName,
  isRent = false,
}: {
  schedule: ScheduleRowDto[]
  currency: Currency
  planName: string
  isRent?: boolean
}) {
  const t = useMessages().listing.schedule
  const locale = useLocale()
  const [expanded, setExpanded] = React.useState(false)
  const money = (n: number) => formatMoney(n, currency, { withSuffix: false, locale })
  const rows = expanded ? schedule : schedule.slice(0, PREVIEW_ROWS)

  const download = () => {
    const blob = new Blob(['﻿' + toCsv(schedule, currency, t)], {
      type: 'text/csv;charset=utf-8',
    })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${t.csvFile}-${planName.replace(/\s+/g, '-').toLowerCase()}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  if (schedule.length === 0) {
    return (
      <p className="rounded-xl bg-surface-2 p-4 text-sm text-muted">
        {t.empty}
      </p>
    )
  }

  const suffix = currencyLabel(currency, locale)

  return (
    <div>
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <h3 className="text-[17px] font-bold text-text">
          {t.title}
        </h3>
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={download}
            className="inline-flex h-9 items-center gap-1.5 rounded-lg px-2.5 text-[13px] font-semibold text-muted transition-colors hover:bg-surface-2 hover:text-text"
          >
            <Download className="size-4" aria-hidden /> CSV
          </button>
          {schedule.length > PREVIEW_ROWS ? (
            <button
              type="button"
              onClick={() => setExpanded((v) => !v)}
              aria-expanded={expanded}
              className="inline-flex h-9 items-center gap-1 rounded-lg px-2.5 text-[13px] font-semibold text-primary transition-colors hover:bg-primary-soft"
            >
              {expanded ? t.collapse : plural(locale, schedule.length, t.expand)}
              <ChevronDown className={cn('size-4 transition-transform', expanded && 'rotate-180')} aria-hidden />
            </button>
          ) : null}
        </div>
      </div>

      {/* Telefon: jadval o'rniga ixcham qatorlar */}
      <ul className="divide-y divide-border overflow-hidden rounded-xl border border-border sm:hidden">
        {rows.map((row) => {
          const l = monthLabel(row, t)
          return (
            <li key={row.monthIndex} className="px-3.5 py-3">
              <div className="flex items-baseline justify-between gap-3">
                <span className="text-[13px] text-muted">
                  <span className="font-semibold text-text">{l.index}</span> · {l.date}
                </span>
                <span className="tabular text-[15px] font-bold text-primary">
                  {money(row.amount)}
                </span>
              </div>
              {!isRent ? (
                <p className="tabular mt-1 flex flex-wrap gap-x-3 text-[12px] text-subtle">
                  <span>{t.principal} <span className="text-muted">{money(row.principal)}</span></span>
                  <span>{t.markup} <span className="text-muted">{money(row.markup)}</span></span>
                  <span>{t.balance} <span className="text-muted">{money(row.balanceAfter)}</span></span>
                </p>
              ) : null}
            </li>
          )
        })}
      </ul>

      <div className="hidden overflow-x-auto rounded-xl border border-border sm:block">
        <table className="w-full min-w-160 text-sm">
          <thead className="bg-surface-2">
            <tr className="text-[11px] font-semibold uppercase tracking-wider text-muted">
              <th className="px-4 py-3 text-left">{t.colMonth}</th>
              {!isRent ? (
                <>
                  <th className="whitespace-nowrap px-4 py-3 text-right">{t.colBalance}</th>
                  <th className="whitespace-nowrap px-4 py-3 text-right">{t.colPrincipal}</th>
                  <th className="whitespace-nowrap px-4 py-3 text-right">{t.colMarkup}</th>
                </>
              ) : null}
              <th className="whitespace-nowrap px-4 py-3 text-right">{t.colTotal}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {rows.map((row) => {
              const l = monthLabel(row, t)
              return (
                <tr key={row.monthIndex} className="hover:bg-surface-2/60">
                  <td className="whitespace-nowrap px-4 py-3 text-text">
                    <span className="font-medium">{l.index}</span>{' '}
                    <span className="text-muted">({l.date})</span>
                  </td>
                  {!isRent ? (
                    <>
                      <td className="tabular whitespace-nowrap px-4 py-3 text-right text-text">
                        {money(row.balanceAfter + row.principal)}
                      </td>
                      <td className="tabular whitespace-nowrap px-4 py-3 text-right text-muted">{money(row.principal)}</td>
                      <td className="tabular whitespace-nowrap px-4 py-3 text-right text-muted">{money(row.markup)}</td>
                    </>
                  ) : null}
                  <td className="tabular whitespace-nowrap px-4 py-3 text-right font-bold text-primary">
                    {money(row.amount)} <span className="text-[11px] font-medium">{suffix}</span>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      <p className="mt-3 text-[12px] leading-relaxed text-subtle">
        {t.note}
      </p>
    </div>
  )
}
