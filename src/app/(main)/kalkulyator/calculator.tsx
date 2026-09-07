'use client'

import * as React from 'react'
import { Calculator, Download, Info } from 'lucide-react'
import type { Currency } from '@prisma/client'
import { computePlan, summarizeByYear, type CalcMethod } from '@/lib/finance'
import {
  CALC_METHOD_HINTS, CALC_METHOD_LABELS, CURRENCY_PRECISION, TERM_OPTIONS,
} from '@/lib/constants'
import { formatDate, formatMoney, formatPercent, formatTerm } from '@/lib/format'
import { Input, Select } from '@/components/ui/input'
import { Field } from '@/components/ui/field'
import { Button } from '@/components/ui/button'
import { Tooltip } from '@/components/ui/tooltip'
import { cn } from '@/lib/utils'

const num = (v: string) => {
  const n = Number(v.replace(/[\s ]/g, '').replace(',', '.'))
  return Number.isFinite(n) ? n : 0
}

const DOWN_PERCENTS = [0, 10, 20, 30, 40, 50]

export function Calc() {
  const [currency, setCurrency] = React.useState<Currency>('UZS')
  const [carPrice, setCarPrice] = React.useState('180000000')
  const [downPayment, setDownPayment] = React.useState('54000000')
  const [termMonths, setTermMonths] = React.useState('24')
  const [method, setMethod] = React.useState<CalcMethod>('ANNUITY')
  const [rate, setRate] = React.useState('24')
  const [monthly, setMonthly] = React.useState('')
  const [paymentDay, setPaymentDay] = React.useState('5')
  const [view, setView] = React.useState<'year' | 'month'>('year')

  const price = num(carPrice)
  const down = num(downPayment)
  const term = Math.max(1, Math.round(num(termMonths)) || 1)

  const result = React.useMemo(() => {
    if (price <= 0) return null
    return computePlan({
      carPrice: price,
      downPayment: down,
      termMonths: term,
      method,
      annualRatePercent: num(rate),
      monthlyPayment: num(monthly),
      paymentDay: Math.round(num(paymentDay)) || 5,
      precision: CURRENCY_PRECISION[currency],
    })
  }, [price, down, term, method, rate, monthly, paymentDay, currency])

  const money = (n: number) => formatMoney(n, currency)
  const downPercent = price > 0 ? (down / price) * 100 : 0
  const years = result ? summarizeByYear(result.schedule) : []

  const downloadCsv = () => {
    if (!result) return
    const header = ['Oy', 'Sana', 'Toʻlov', 'Asosiy qarz', 'Ustama', 'Qoldiq'].join(';')
    const lines = result.schedule.map((r) =>
      [r.monthIndex, formatDate(r.dueDate), r.amount, r.principal, r.markup, r.balanceAfter].join(';'),
    )
    const blob = new Blob(['﻿' + [header, ...lines].join('\n')], {
      type: 'text/csv;charset=utf-8',
    })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'tolov-grafigi.csv'
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[380px_1fr]">
      {/* Kiritish */}
      <div className="card h-fit p-5 lg:sticky lg:top-20">
        <h2 className="mb-4 flex items-center gap-2 text-base font-semibold text-text">
          <Calculator className="size-[18px] text-primary" /> Parametrlar
        </h2>

        <div className="space-y-4">
          <div className="grid grid-cols-[1fr_100px] gap-3">
            <Field label="Avtomobil narxi" required>
              <Input
                value={carPrice}
                onChange={(e) => setCarPrice(e.target.value)}
                inputMode="numeric"
                className="tabular"
              />
            </Field>
            <Field label="Valyuta">
              <Select
                value={currency}
                onChange={(e) => setCurrency(e.target.value as Currency)}
              >
                <option value="UZS">soʻm</option>
                <option value="USD">USD</option>
              </Select>
            </Field>
          </div>

          <Field
            label="Boshlangʻich toʻlov"
            hint={price > 0 ? `Narxning ${formatPercent(downPercent)} qismi` : undefined}
          >
            <Input
              value={downPayment}
              onChange={(e) => setDownPayment(e.target.value)}
              inputMode="numeric"
              className="tabular"
            />
            <div className="mt-2 flex flex-wrap gap-1.5">
              {DOWN_PERCENTS.map((p) => (
                <button
                  key={p}
                  type="button"
                  onClick={() => setDownPayment(String(Math.round((price * p) / 100)))}
                  className={cn(
                    'rounded-full border px-2.5 py-1 text-[12px] transition-colors',
                    Math.abs(downPercent - p) < 0.5
                      ? 'border-primary bg-primary-soft text-primary'
                      : 'border-border text-muted hover:border-border-strong',
                  )}
                >
                  {p}%
                </button>
              ))}
            </div>
          </Field>

          <Field label="Muddat (oy)">
            <div className="flex flex-wrap gap-1.5">
              {TERM_OPTIONS.map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setTermMonths(String(t))}
                  className={cn(
                    'rounded-full border px-3 py-1.5 text-[12px] font-medium transition-colors',
                    term === t
                      ? 'border-primary bg-primary-soft text-primary'
                      : 'border-border text-muted hover:border-border-strong',
                  )}
                >
                  {t}
                </button>
              ))}
              <Input
                value={termMonths}
                onChange={(e) => setTermMonths(e.target.value)}
                inputMode="numeric"
                aria-label="Muddat"
                className="tabular h-9 w-20"
              />
            </div>
          </Field>

          <Field
            label={
              <span className="inline-flex items-center gap-1.5">
                Hisoblash usuli
                <Tooltip content={CALC_METHOD_HINTS[method]}>
                  <span className="cursor-help text-subtle">
                    <Info className="size-3.5" />
                  </span>
                </Tooltip>
              </span>
            }
          >
            <Select
              value={method}
              onChange={(e) => setMethod(e.target.value as CalcMethod)}
            >
              {Object.entries(CALC_METHOD_LABELS).map(([v, l]) => (
                <option key={v} value={v}>
                  {l}
                </option>
              ))}
            </Select>
            <p className="mt-1.5 text-[12px] leading-relaxed text-muted">
              {CALC_METHOD_HINTS[method]}
            </p>
          </Field>

          {method === 'FIXED' ? (
            <Field label="Oylik toʻlov" required>
              <Input
                value={monthly}
                onChange={(e) => setMonthly(e.target.value)}
                inputMode="numeric"
                placeholder="6500000"
                className="tabular"
              />
            </Field>
          ) : (
            <Field label="Yillik ustama foizi">
              <Input
                value={rate}
                onChange={(e) => setRate(e.target.value)}
                inputMode="decimal"
                suffixNode="% / yil"
                className="tabular"
              />
            </Field>
          )}

          <Field label="Toʻlov kuni">
            <Input
              value={paymentDay}
              onChange={(e) => setPaymentDay(e.target.value)}
              inputMode="numeric"
              className="tabular"
            />
          </Field>
        </div>
      </div>

      {/* Natija */}
      <div className="space-y-5">
        {!result ? (
          <div className="card p-10 text-center text-sm text-muted">
            Avtomobil narxini kiriting
          </div>
        ) : (
          <>
            <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
              {[
                { label: 'Oylik toʻlov', value: money(result.monthlyPayment), accent: true },
                { label: 'Jami toʻlov', value: money(result.totalPayable) },
                { label: 'Ustama', value: money(result.markupAmount), warn: true },
                {
                  label: 'Samarali yillik',
                  value:
                    result.markupPercent > 0 ? formatPercent(result.markupPercent, 2) : '—',
                },
              ].map((s) => (
                <div key={s.label} className="card p-4">
                  <p className="text-[11px] font-medium uppercase tracking-wide text-subtle">
                    {s.label}
                  </p>
                  <p
                    className={cn(
                      'tabular mt-1 text-[19px] font-bold leading-tight',
                      s.accent && 'text-primary',
                      s.warn && 'text-warning',
                      !s.accent && !s.warn && 'text-text',
                    )}
                  >
                    {s.value}
                  </p>
                </div>
              ))}
            </div>

            <div className="card p-5">
              <dl className="grid gap-x-8 sm:grid-cols-2">
                {[
                  ['Avtomobil narxi', money(price)],
                  ['Boshlangʻich toʻlov', `${money(down)} (${formatPercent(downPercent)})`],
                  ['Moliyalashtiriladi', money(result.financedAmount)],
                  ['Muddat', formatTerm(term)],
                  ['Ortiqcha toʻlov ulushi', formatPercent(result.overpayPercent)],
                  ['Toʻlovlar soni', `${result.schedule.length} ta`],
                ].map(([label, value]) => (
                  <div
                    key={label}
                    className="flex items-center justify-between border-b border-border py-2.5 last:border-0"
                  >
                    <dt className="text-[13px] text-muted">{label}</dt>
                    <dd className="tabular text-[13px] font-semibold text-text">{value}</dd>
                  </div>
                ))}
              </dl>
            </div>

            <div className="card p-5">
              <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                <h2 className="text-base font-semibold text-text">Toʻlov grafigi</h2>
                <div className="flex items-center gap-2">
                  <div className="inline-flex rounded-[10px] border border-border bg-surface-2 p-1">
                    {(
                      [
                        ['year', 'Yillik'],
                        ['month', 'Oyma-oy'],
                      ] as const
                    ).map(([v, l]) => (
                      <button
                        key={v}
                        type="button"
                        onClick={() => setView(v)}
                        className={cn(
                          'rounded-lg px-3 py-1.5 text-[13px] font-medium transition-colors',
                          view === v ? 'bg-surface text-text shadow-sm' : 'text-muted',
                        )}
                      >
                        {l}
                      </button>
                    ))}
                  </div>
                  <Button variant="ghost" size="sm" onClick={downloadCsv}>
                    <Download /> CSV
                  </Button>
                </div>
              </div>

              <div className="max-h-[540px] overflow-auto rounded-xl border border-border">
                <table className="w-full min-w-[520px] text-sm">
                  <thead className="sticky top-0 bg-surface-2">
                    <tr className="text-left text-[12px] uppercase tracking-wide text-subtle">
                      {view === 'year' ? (
                        <>
                          <th className="px-4 py-2.5 font-semibold">Yil</th>
                          <th className="px-4 py-2.5 font-semibold">Oylar</th>
                          <th className="px-4 py-2.5 text-right font-semibold">Jami</th>
                          <th className="px-4 py-2.5 text-right font-semibold">Asosiy</th>
                          <th className="px-4 py-2.5 text-right font-semibold">Ustama</th>
                        </>
                      ) : (
                        <>
                          <th className="px-4 py-2.5 font-semibold">№</th>
                          <th className="px-4 py-2.5 font-semibold">Sana</th>
                          <th className="px-4 py-2.5 text-right font-semibold">Toʻlov</th>
                          <th className="px-4 py-2.5 text-right font-semibold">Asosiy</th>
                          <th className="px-4 py-2.5 text-right font-semibold">Ustama</th>
                          <th className="px-4 py-2.5 text-right font-semibold">Qoldiq</th>
                        </>
                      )}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {view === 'year'
                      ? years.map((y) => (
                          <tr key={y.year} className="hover:bg-surface-2/60">
                            <td className="tabular px-4 py-3 font-semibold text-text">
                              {y.year}
                            </td>
                            <td className="tabular px-4 py-3 text-muted">{y.months} oy</td>
                            <td className="tabular px-4 py-3 text-right font-semibold text-text">
                              {money(y.total)}
                            </td>
                            <td className="tabular px-4 py-3 text-right text-muted">
                              {money(y.principal)}
                            </td>
                            <td className="tabular px-4 py-3 text-right text-warning">
                              {money(y.markup)}
                            </td>
                          </tr>
                        ))
                      : result.schedule.map((r) => (
                          <tr key={r.monthIndex} className="hover:bg-surface-2/60">
                            <td className="tabular px-4 py-2.5 text-subtle">{r.monthIndex}</td>
                            <td className="tabular px-4 py-2.5 text-muted">
                              {formatDate(r.dueDate)}
                            </td>
                            <td className="tabular px-4 py-2.5 text-right font-medium text-text">
                              {money(r.amount)}
                            </td>
                            <td className="tabular px-4 py-2.5 text-right text-muted">
                              {money(r.principal)}
                            </td>
                            <td className="tabular px-4 py-2.5 text-right text-warning">
                              {money(r.markup)}
                            </td>
                            <td className="tabular px-4 py-2.5 text-right text-subtle">
                              {money(r.balanceAfter)}
                            </td>
                          </tr>
                        ))}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
