'use client'

import * as React from 'react'
import { ChevronDown, Copy, Star, Trash2 } from 'lucide-react'
import type { Currency } from '@prisma/client'
import { computePlan, summarizeByYear, type CalcMethod } from '@/lib/finance'
import { CURRENCY_PRECISION, TERM_OPTIONS } from '@/lib/constants'
import { currencyLabel, formatDate, formatMoney, formatPercent, formatTerm } from '@/lib/format'
import { Input, Select, Textarea } from '@/components/ui/input'
import { Field } from '@/components/ui/field'
import { SwitchRow } from '@/components/ui/checkbox'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { useLocale, useMessages } from '@/i18n/client'
import { fmt } from '@/i18n/format'
import type { PlanDraft } from './types'

const num = (v: string): number => {
  const cleaned = v.replace(/[\s ]/g, '').replace(',', '.')
  const n = Number(cleaned)
  return Number.isFinite(n) ? n : 0
}

const DOWN_PERCENTS = [0, 10, 20, 30, 40, 50]

export function PlanEditor({
  plan,
  index,
  total,
  carPrice,
  currency,
  onChange,
  onRemove,
  onDuplicate,
  onMakeDefault,
}: {
  plan: PlanDraft
  index: number
  total: number
  carPrice: number
  currency: Currency
  onChange: (patch: Partial<PlanDraft>) => void
  onRemove: () => void
  onDuplicate: () => void
  onMakeDefault: () => void
}) {
  const locale = useLocale()
  const m = useMessages()
  const t = m.form.plan
  const unit = currencyLabel(currency, locale)
  const [showExtra, setShowExtra] = React.useState(false)
  const [showSchedule, setShowSchedule] = React.useState(false)

  const downPayment = num(plan.downPayment)
  const termMonths = Math.max(1, Math.round(num(plan.termMonths)) || 1)

  // Jonli hisob-kitob — serverdagi bilan bir xil modul
  const computed = React.useMemo(() => {
    if (carPrice <= 0) return null
    return computePlan({
      carPrice,
      downPayment,
      termMonths,
      method: plan.calcMethod as CalcMethod,
      annualRatePercent: num(plan.annualRatePercent),
      monthlyPayment: num(plan.monthlyPaymentInput),
      paymentDay: Math.round(num(plan.paymentDay)) || 5,
      startDate: plan.startDate ? new Date(plan.startDate) : new Date(),
      precision: CURRENCY_PRECISION[currency],
    })
  }, [
    carPrice, downPayment, termMonths, plan.calcMethod,
    plan.annualRatePercent, plan.monthlyPaymentInput,
    plan.paymentDay, plan.startDate, currency,
  ])

  const money = (n: number) => formatMoney(n, currency, { locale })
  const pct = (v: number, d = 1) => formatPercent(v, d, locale)
  const downPercent = carPrice > 0 ? (downPayment / carPrice) * 100 : 0
  const tooMuchDown = downPayment >= carPrice && carPrice > 0

  const years = computed ? summarizeByYear(computed.schedule) : []

  return (
    <div
      className={cn(
        'rounded-xl border p-4',
        plan.isDefault ? 'border-primary bg-primary-soft/30' : 'border-border bg-surface',
      )}
    >
      {/* Sarlavha */}
      <div className="mb-4 flex flex-wrap items-start justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="tabular flex size-7 items-center justify-center rounded-lg bg-surface-2 text-[13px] font-bold text-muted">
            {index + 1}
          </span>
          {plan.isDefault ? (
            <span className="inline-flex items-center gap-1 rounded-full bg-primary px-2.5 py-1 text-[11px] font-semibold text-primary-fg">
              <Star className="size-3 fill-current" /> {t.mainBadge}
            </span>
          ) : (
            <button
              type="button"
              onClick={onMakeDefault}
              className="inline-flex items-center gap-1 rounded-full border border-border px-2.5 py-1 text-[11px] font-medium text-muted transition-colors hover:border-primary hover:text-primary"
            >
              <Star className="size-3" /> {t.makeMain}
            </button>
          )}
        </div>

        <div className="flex gap-1">
          <button
            type="button"
            onClick={onDuplicate}
            title={t.duplicate}
            aria-label={t.duplicate}
            className="rounded-lg p-1.5 text-subtle transition-colors hover:bg-surface-2 hover:text-text"
          >
            <Copy className="size-4" />
          </button>
          {total > 1 ? (
            <button
              type="button"
              onClick={onRemove}
              title={t.remove}
              aria-label={t.remove}
              className="rounded-lg p-1.5 text-subtle transition-colors hover:bg-danger-soft hover:text-danger"
            >
              <Trash2 className="size-4" />
            </button>
          ) : null}
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        {/* ── Chap: kiritish ─────────────────────────────── */}
        <div className="space-y-4">
          <Field label={t.name} required>
            <Input
              value={plan.name}
              onChange={(e) => onChange({ name: e.target.value })}
              placeholder={t.namePlaceholder}
            />
          </Field>

          <Field label={t.type}>
            <Select
              value={plan.planType}
              onChange={(e) => {
                const planType = e.target.value as PlanDraft['planType']
                onChange({
                  planType,
                  ownershipTransfer: planType !== 'RENT',
                  // Arendada oylik ijara odatda aniq summa bilan kiritiladi
                  ...(planType === 'RENT' ? { calcMethod: 'FIXED' as const } : {}),
                })
              }}
            >
              {Object.entries(m.enums.planType).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </Select>
          </Field>

          <Field
            label={t.down}
            required
            error={tooMuchDown ? t.downTooMuch : undefined}
            hint={!tooMuchDown && carPrice > 0 ? fmt(t.downShare, { pct: pct(downPercent) }) : undefined}
          >
            <Input
              value={plan.downPayment}
              onChange={(e) => onChange({ downPayment: e.target.value })}
              inputMode="numeric"
              placeholder="0"
              invalid={tooMuchDown}
              suffixNode={unit}
              className="tabular"
            />
            {carPrice > 0 ? (
              <div className="mt-2 flex flex-wrap gap-1.5">
                {DOWN_PERCENTS.map((p) => (
                  <button
                    key={p}
                    type="button"
                    onClick={() =>
                      onChange({ downPayment: String(Math.round((carPrice * p) / 100)) })
                    }
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
            ) : null}
          </Field>

          <Field label={t.term} required>
            <div className="flex flex-wrap gap-1.5">
              {TERM_OPTIONS.map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => onChange({ termMonths: String(t) })}
                  className={cn(
                    'rounded-full border px-3 py-1.5 text-[12px] font-medium transition-colors',
                    termMonths === t
                      ? 'border-primary bg-primary-soft text-primary'
                      : 'border-border text-muted hover:border-border-strong',
                  )}
                >
                  {t}
                </button>
              ))}
              <Input
                value={plan.termMonths}
                onChange={(e) => onChange({ termMonths: e.target.value })}
                inputMode="numeric"
                aria-label={t.term}
                className="tabular h-9 w-20"
              />
            </div>
          </Field>

          <Field label={t.method} hint={m.enums.calcMethodHint[plan.calcMethod]}>
            <div className="space-y-1.5">
              {(Object.keys(m.enums.calcMethod) as CalcMethod[]).map((method) => (
                <label
                  key={method}
                  className={cn(
                    'flex cursor-pointer items-start gap-2.5 rounded-[10px] border p-2.5 transition-colors',
                    plan.calcMethod === method
                      ? 'border-primary bg-primary-soft'
                      : 'border-border hover:border-border-strong',
                  )}
                >
                  <input
                    type="radio"
                    checked={plan.calcMethod === method}
                    onChange={() => onChange({ calcMethod: method })}
                    className="mt-0.5 accent-[var(--primary)]"
                  />
                  <span className="text-[13px] font-medium text-text">
                    {m.enums.calcMethod[method]}
                  </span>
                </label>
              ))}
            </div>
          </Field>

          {plan.calcMethod === 'FIXED' ? (
            <Field label={t.monthly} required hint={t.monthlyHint}>
              <Input
                value={plan.monthlyPaymentInput}
                onChange={(e) => onChange({ monthlyPaymentInput: e.target.value })}
                inputMode="numeric"
                placeholder="0"
                suffixNode={unit}
                className="tabular"
              />
            </Field>
          ) : (
            <Field
              label={t.rate}
              hint={plan.calcMethod === 'FLAT' ? t.flatHint : t.annuityHint}
            >
              <Input
                value={plan.annualRatePercent}
                onChange={(e) => onChange({ annualRatePercent: e.target.value })}
                inputMode="decimal"
                placeholder="24"
                suffixNode={m.form.price.perYear}
                className="tabular"
              />
            </Field>
          )}

          <div className="grid grid-cols-2 gap-3">
            <Field label={t.payDay} hint={t.payDayHint}>
              <Input
                value={plan.paymentDay}
                onChange={(e) => onChange({ paymentDay: e.target.value })}
                inputMode="numeric"
                placeholder="5"
                className="tabular"
              />
            </Field>
            <Field label={t.start} hint={t.startHint}>
              <Input
                type="date"
                value={plan.startDate}
                onChange={(e) => onChange({ startDate: e.target.value })}
                className="tabular"
              />
            </Field>
          </div>

          {/* Qo'shimcha shartlar */}
          <div className="rounded-xl border border-border">
            <button
              type="button"
              onClick={() => setShowExtra((v) => !v)}
              aria-expanded={showExtra}
              className="flex w-full items-center justify-between gap-2 px-3.5 py-3 text-left"
            >
              <span className="text-[13px] font-semibold text-text">
                {t.extra}
              </span>
              <ChevronDown
                className={cn(
                  'size-4 text-subtle transition-transform',
                  showExtra && 'rotate-180',
                )}
              />
            </button>

            {showExtra ? (
              <div className="space-y-3 border-t border-border px-3.5 py-3">
                <SwitchRow
                  checked={plan.insuranceIncluded}
                  onCheckedChange={(v) => onChange({ insuranceIncluded: v })}
                  label={t.insurance}
                />
                <SwitchRow
                  checked={plan.cascoIncluded}
                  onCheckedChange={(v) => onChange({ cascoIncluded: v })}
                  label={t.casco}
                />
                <SwitchRow
                  checked={plan.maintenanceIncluded}
                  onCheckedChange={(v) => onChange({ maintenanceIncluded: v })}
                  label={t.maintenance}
                />
                <SwitchRow
                  checked={plan.ownershipTransfer}
                  onCheckedChange={(v) => onChange({ ownershipTransfer: v })}
                  label={t.ownership}
                  hint={t.ownershipHint}
                />
                <SwitchRow
                  checked={plan.earlyPayoffAllowed}
                  onCheckedChange={(v) => onChange({ earlyPayoffAllowed: v })}
                  label={t.early}
                />

                <div className="grid grid-cols-2 gap-3 pt-1">
                  {plan.planType === 'RENT' ? (
                    <Field label={t.daily} className="col-span-2">
                      <Input
                        value={plan.dailyPayment}
                        onChange={(e) => onChange({ dailyPayment: e.target.value })}
                        inputMode="numeric"
                        placeholder="350000"
                        suffixNode={unit}
                        className="tabular"
                      />
                    </Field>
                  ) : null}
                  <Field label={t.deposit}>
                    <Input
                      value={plan.depositAmount}
                      onChange={(e) => onChange({ depositAmount: e.target.value })}
                      inputMode="numeric"
                      placeholder="0"
                      className="tabular"
                    />
                  </Field>
                  <Field label={t.penalty}>
                    <Input
                      value={plan.penaltyPerDay}
                      onChange={(e) => onChange({ penaltyPerDay: e.target.value })}
                      inputMode="numeric"
                      placeholder="0"
                      className="tabular"
                    />
                  </Field>
                  <Field label={t.kmLimit}>
                    <Input
                      value={plan.mileageLimitPerYear}
                      onChange={(e) => onChange({ mileageLimitPerYear: e.target.value })}
                      inputMode="numeric"
                      placeholder="30000"
                      className="tabular"
                    />
                  </Field>
                  <Field label={t.extraKm}>
                    <Input
                      value={plan.extraMileageFee}
                      onChange={(e) => onChange({ extraMileageFee: e.target.value })}
                      inputMode="numeric"
                      placeholder="1500"
                      className="tabular"
                    />
                  </Field>
                </div>

                <Field label={t.docs}>
                  <Textarea
                    value={plan.requiredDocuments}
                    onChange={(e) => onChange({ requiredDocuments: e.target.value })}
                    rows={2}
                    placeholder={t.docsPlaceholder}
                  />
                </Field>

                <Field label={t.notes}>
                  <Textarea
                    value={plan.notes}
                    onChange={(e) => onChange({ notes: e.target.value })}
                    rows={2}
                    placeholder={t.notesPlaceholder}
                  />
                </Field>
              </div>
            ) : null}
          </div>
        </div>

        {/* ── O'ng: jonli hisob-kitob ────────────────────── */}
        <div className="lg:sticky lg:top-20 lg:self-start">
          <div className="rounded-xl border border-border bg-surface-2 p-4">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-subtle">
              {t.calc}
            </p>

            {!computed || carPrice <= 0 ? (
              <p className="mt-3 text-[13px] text-muted">
                {t.calcEmpty}
              </p>
            ) : (
              <>
                <div className="mt-3 space-y-2.5">
                  <div className="flex items-baseline justify-between gap-2">
                    <span className="text-[13px] text-muted">{t.monthlyPay}</span>
                    <span className="tabular text-xl font-bold text-primary">
                      {money(computed.monthlyPayment)}
                    </span>
                  </div>
                  {[
                    [t.downPay, money(downPayment)],
                    [t.financed, money(computed.financedAmount)],
                    [t.total, money(computed.totalPayable)],
                    [t.markup, `${money(computed.markupAmount)} (${pct(computed.overpayPercent)})`],
                    [t.effective, computed.markupPercent > 0 ? pct(computed.markupPercent, 2) : '—'],
                    [t.termLabel, formatTerm(termMonths, locale)],
                  ].map(([label, value]) => (
                    <div
                      key={label}
                      className="flex items-center justify-between gap-2 border-b border-border pb-2 last:border-0 last:pb-0"
                    >
                      <span className="text-[13px] text-muted">{label}</span>
                      <span className="tabular text-[13px] font-semibold text-text">
                        {value}
                      </span>
                    </div>
                  ))}
                </div>

                {/* Yillik xulosa */}
                {years.length > 0 ? (
                  <div className="mt-4">
                    <p className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-subtle">
                      {t.byYear}
                    </p>
                    <ul className="space-y-1">
                      {years.map((y) => (
                        <li
                          key={y.year}
                          className="flex items-center justify-between text-[12px]"
                        >
                          <span className="tabular text-muted">
                            {fmt(t.yearRow, { year: y.year, n: y.months })}
                          </span>
                          <span className="tabular font-medium text-text">
                            {money(y.total)}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </div>
                ) : null}

                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  block
                  className="mt-4"
                  onClick={() => setShowSchedule((v) => !v)}
                >
                  {showSchedule ? t.hideSchedule : fmt(t.showSchedule, { n: termMonths })}
                </Button>

                {showSchedule ? (
                  <div className="mt-3 max-h-72 overflow-y-auto rounded-lg border border-border bg-surface">
                    <table className="w-full text-[12px]">
                      <thead className="sticky top-0 bg-surface-2">
                        <tr className="text-left text-subtle">
                          <th className="px-2.5 py-2 font-semibold">№</th>
                          <th className="px-2.5 py-2 font-semibold">{t.thDate}</th>
                          <th className="px-2.5 py-2 text-right font-semibold">{t.thPay}</th>
                          <th className="px-2.5 py-2 text-right font-semibold">{t.thBalance}</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border">
                        {computed.schedule.map((row) => (
                          <tr key={row.monthIndex}>
                            <td className="tabular px-2.5 py-1.5 text-subtle">
                              {row.monthIndex}
                            </td>
                            <td className="tabular px-2.5 py-1.5 text-muted">
                              {formatDate(row.dueDate)}
                            </td>
                            <td className="tabular px-2.5 py-1.5 text-right font-medium text-text">
                              {money(row.amount)}
                            </td>
                            <td className="tabular px-2.5 py-1.5 text-right text-subtle">
                              {money(row.balanceAfter)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : null}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
