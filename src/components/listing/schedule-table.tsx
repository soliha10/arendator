'use client'

import * as React from 'react'
import { ChevronDown, Download } from 'lucide-react'
import type { Currency } from '@prisma/client'
import type { ScheduleRowDto } from '@/server/mappers'
import { formatDate, formatMoney } from '@/lib/format'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

interface YearGroup {
  year: number
  rows: ScheduleRowDto[]
  total: number
  principal: number
  markup: number
}

function groupByYear(rows: ScheduleRowDto[]): YearGroup[] {
  const map = new Map<number, YearGroup>()
  for (const row of rows) {
    const year = new Date(row.dueDate).getFullYear()
    let group = map.get(year)
    if (!group) {
      group = { year, rows: [], total: 0, principal: 0, markup: 0 }
      map.set(year, group)
    }
    group.rows.push(row)
    group.total += row.amount
    group.principal += row.principal
    group.markup += row.markup
  }
  return [...map.values()].sort((a, b) => a.year - b.year)
}

function toCsv(rows: ScheduleRowDto[], currency: Currency): string {
  const header = ['Oy', 'Sana', 'Toʻlov', 'Asosiy qarz', 'Ustama', 'Qoldiq']
  const lines = rows.map((r) =>
    [
      r.monthIndex,
      formatDate(r.dueDate),
      r.amount,
      r.principal,
      r.markup,
      r.balanceAfter,
    ].join(';'),
  )
  return [`# Valyuta: ${currency}`, header.join(';'), ...lines].join('\n')
}

export function ScheduleTable({
  schedule,
  currency,
  planName,
}: {
  schedule: ScheduleRowDto[]
  currency: Currency
  planName: string
}) {
  const [mode, setMode] = React.useState<'year' | 'month'>('year')
  const groups = React.useMemo(() => groupByYear(schedule), [schedule])
  const firstYear = groups[0]?.year ?? null

  const [openYears, setOpenYears] = React.useState<number[]>(
    firstYear === null ? [] : [firstYear],
  )
  const [syncedFirstYear, setSyncedFirstYear] = React.useState(firstYear)

  // Boshqa shartga oʻtilsa (grafik butunlay almashsa) birinchi yil ochiladi
  if (firstYear !== syncedFirstYear) {
    setSyncedFirstYear(firstYear)
    setOpenYears(firstYear === null ? [] : [firstYear])
  }

  const download = () => {
    const blob = new Blob(['﻿' + toCsv(schedule, currency)], {
      type: 'text/csv;charset=utf-8',
    })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `tolov-grafigi-${planName.replace(/\s+/g, '-').toLowerCase()}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  const money = (n: number) => formatMoney(n, currency)

  if (schedule.length === 0) {
    return (
      <p className="rounded-xl bg-surface-2 p-4 text-sm text-muted">
        Bu shart uchun grafik hali tuzilmagan.
      </p>
    )
  }

  return (
    <div>
      <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
        <div className="inline-flex rounded-[10px] border border-border bg-surface-2 p-1">
          {(
            [
              ['year', 'Yillik'],
              ['month', 'Oyma-oy'],
            ] as const
          ).map(([value, label]) => (
            <button
              key={value}
              type="button"
              onClick={() => setMode(value)}
              className={cn(
                'rounded-lg px-3.5 py-1.5 text-[13px] font-medium transition-colors',
                mode === value
                  ? 'bg-surface text-text shadow-sm'
                  : 'text-muted hover:text-text',
              )}
            >
              {label}
            </button>
          ))}
        </div>

        <Button variant="ghost" size="sm" onClick={download}>
          <Download /> CSV
        </Button>
      </div>

      {mode === 'year' ? (
        <div className="overflow-x-auto rounded-xl border border-border">
          <table className="w-full min-w-[520px] text-sm">
            <thead className="bg-surface-2 text-left">
              <tr className="text-[12px] uppercase tracking-wide text-subtle">
                <th className="px-4 py-2.5 font-semibold">Yil</th>
                <th className="px-4 py-2.5 font-semibold">Oylar</th>
                <th className="px-4 py-2.5 text-right font-semibold">Jami toʻlov</th>
                <th className="px-4 py-2.5 text-right font-semibold">Asosiy qarz</th>
                <th className="px-4 py-2.5 text-right font-semibold">Ustama</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {groups.map((g) => (
                <tr key={g.year} className="hover:bg-surface-2/60">
                  <td className="tabular px-4 py-3 font-semibold text-text">{g.year}</td>
                  <td className="tabular px-4 py-3 text-muted">{g.rows.length} oy</td>
                  <td className="tabular px-4 py-3 text-right font-semibold text-text">
                    {money(g.total)}
                  </td>
                  <td className="tabular px-4 py-3 text-right text-muted">
                    {money(g.principal)}
                  </td>
                  <td className="tabular px-4 py-3 text-right text-warning">
                    {money(g.markup)}
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot className="border-t-2 border-border bg-surface-2">
              <tr className="text-sm font-semibold text-text">
                <td className="px-4 py-3" colSpan={2}>
                  Jami
                </td>
                <td className="tabular px-4 py-3 text-right">
                  {money(groups.reduce((s, g) => s + g.total, 0))}
                </td>
                <td className="tabular px-4 py-3 text-right">
                  {money(groups.reduce((s, g) => s + g.principal, 0))}
                </td>
                <td className="tabular px-4 py-3 text-right text-warning">
                  {money(groups.reduce((s, g) => s + g.markup, 0))}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      ) : (
        <div className="space-y-2">
          {groups.map((g) => {
            const open = openYears.includes(g.year)
            return (
              <div key={g.year} className="overflow-hidden rounded-xl border border-border">
                <button
                  type="button"
                  onClick={() =>
                    setOpenYears((prev) =>
                      prev.includes(g.year)
                        ? prev.filter((y) => y !== g.year)
                        : [...prev, g.year],
                    )
                  }
                  aria-expanded={open}
                  className="flex w-full items-center justify-between gap-3 bg-surface-2 px-4 py-3 text-left transition-colors hover:bg-surface-3"
                >
                  <span className="flex items-baseline gap-2.5">
                    <span className="tabular text-sm font-semibold text-text">{g.year}</span>
                    <span className="text-[13px] text-muted">{g.rows.length} oy</span>
                  </span>
                  <span className="flex items-center gap-3">
                    <span className="tabular text-sm font-semibold text-text">
                      {money(g.total)}
                    </span>
                    <ChevronDown
                      className={cn(
                        'size-4 text-subtle transition-transform',
                        open && 'rotate-180',
                      )}
                    />
                  </span>
                </button>

                {open ? (
                  <div className="overflow-x-auto">
                    <table className="w-full min-w-[560px] text-sm">
                      <thead>
                        <tr className="border-b border-border text-[12px] uppercase tracking-wide text-subtle">
                          <th className="px-4 py-2 text-left font-semibold">№</th>
                          <th className="px-4 py-2 text-left font-semibold">Sana</th>
                          <th className="px-4 py-2 text-right font-semibold">Toʻlov</th>
                          <th className="px-4 py-2 text-right font-semibold">Asosiy</th>
                          <th className="px-4 py-2 text-right font-semibold">Ustama</th>
                          <th className="px-4 py-2 text-right font-semibold">Qoldiq</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border">
                        {g.rows.map((row) => (
                          <tr key={row.monthIndex} className="hover:bg-surface-2/60">
                            <td className="tabular px-4 py-2.5 text-subtle">
                              {row.monthIndex}
                            </td>
                            <td className="tabular px-4 py-2.5 text-muted">
                              {formatDate(row.dueDate)}
                            </td>
                            <td className="tabular px-4 py-2.5 text-right font-medium text-text">
                              {money(row.amount)}
                            </td>
                            <td className="tabular px-4 py-2.5 text-right text-muted">
                              {money(row.principal)}
                            </td>
                            <td className="tabular px-4 py-2.5 text-right text-warning">
                              {money(row.markup)}
                            </td>
                            <td className="tabular px-4 py-2.5 text-right text-subtle">
                              {money(row.balanceAfter)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : null}
              </div>
            )
          })}
        </div>
      )}

      <p className="mt-3 text-[12px] leading-relaxed text-subtle">
        Grafik arendator kiritgan shartlar asosida hisoblangan. Yakuniy summalar
        shartnomada aniqlashtiriladi.
      </p>
    </div>
  )
}
