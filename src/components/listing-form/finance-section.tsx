'use client'

import * as React from 'react'
import {
  BarChart3, Banknote, ChevronDown, KeyRound, Landmark, Plus,
} from 'lucide-react'
import { toast } from 'sonner'
import type { Currency } from '@prisma/client'
import { computePlan, type CalcMethod } from '@/lib/finance'
import { CURRENCY_PRECISION, MAX_PLANS_PER_LISTING } from '@/lib/constants'
import { currencyLabel, formatMoney, formatPercent } from '@/lib/format'
import { Input } from '@/components/ui/input'
import { Field } from '@/components/ui/field'
import { Checkbox } from '@/components/ui/checkbox'
import { SwitchRow } from '@/components/ui/checkbox'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { useLocale, useMessages, useValidationText } from '@/i18n/client'
import { fmt } from '@/i18n/format'
import { PlanEditor } from './plan-editor'
import { Chip } from './section-card'
import {
  autoPlanName, installmentPlan, isAutoPlanName, newKey,
  type ListingFormState, type PlanDraft,
} from './types'

export const num = (v: string): number => {
  const n = Number(v.replace(/[\s ]/g, '').replace(',', '.'))
  return Number.isFinite(n) ? n : 0
}

/** Raqamni kiritishda bo'shliq bilan ajratib ko'rsatadi: 245000000 → "245 000 000" */
export const groupDigits = (v: string): string => {
  const digits = v.replace(/[^\d]/g, '')
  return digits ? digits.replace(/\B(?=(\d{3})+(?!\d))/g, ' ') : ''
}

const INSTALLMENT_TERMS = [12, 24, 36, 48, 60]
const RENT_TERMS = [12, 24, 36]

/** Shartni jonli hisoblaydi — serverdagi bilan bir xil modul */
export function computeDraft(plan: PlanDraft, carPrice: number, currency: Currency) {
  if (carPrice <= 0) return null
  const term = Math.max(1, Math.round(num(plan.termMonths)) || 1)
  try {
    return computePlan({
      carPrice,
      downPayment: num(plan.downPayment),
      termMonths: term,
      method: plan.calcMethod as CalcMethod,
      annualRatePercent: num(plan.annualRatePercent),
      monthlyPayment: num(plan.monthlyPaymentInput),
      paymentDay: Math.round(num(plan.paymentDay)) || 5,
      startDate: plan.startDate ? new Date(plan.startDate) : new Date(),
      precision: CURRENCY_PRECISION[currency],
    })
  } catch {
    return null
  }
}

export function FinanceSection({
  form,
  setForm,
  usdRate,
  errors,
}: {
  form: ListingFormState
  setForm: React.Dispatch<React.SetStateAction<ListingFormState>>
  usdRate: number
  errors: Record<string, string[]>
}) {
  const [showAdvanced, setShowAdvanced] = React.useState(false)
  const locale = useLocale()
  const t = useMessages().form
  const tv = useValidationText()
  const carPrice = num(form.carPrice)
  const currency = form.currency
  const unit = currencyLabel(currency, locale)
  const money = (n: number) => formatMoney(n, currency, { locale })

  const instIdx = form.plans.findIndex((p) => p.planType !== 'RENT')
  const rentIdx = form.plans.findIndex((p) => p.planType === 'RENT')
  const inst = instIdx >= 0 ? form.plans[instIdx] : null
  const rent = rentIdx >= 0 ? form.plans[rentIdx] : null

  /** Shartni yangilaydi; nom avtomatik bo'lsa — u ham moslashadi */
  const patchPlan = (key: string, patch: Partial<PlanDraft>) =>
    setForm((f) => ({
      ...f,
      plans: f.plans.map((p) => {
        if (p.key !== key) return p
        const next = { ...p, ...patch }
        if (!('name' in patch) && (p.name === '' || isAutoPlanName(p.name))) {
          next.name = autoPlanName(next, locale)
        }
        return next
      }),
    }))

  const makeDefault = (key: string) =>
    setForm((f) => ({ ...f, plans: f.plans.map((p) => ({ ...p, isDefault: p.key === key })) }))

  const removePlan = (key: string) =>
    setForm((f) => {
      const plans = f.plans.filter((p) => p.key !== key)
      if (plans.length > 0 && !plans.some((p) => p.isDefault)) {
        plans[0] = { ...plans[0], isDefault: true }
      }
      return { ...f, plans }
    })

  const duplicatePlan = (key: string) => {
    if (form.plans.length >= MAX_PLANS_PER_LISTING) {
      toast.error(fmt(t.toast.maxPlans, { max: MAX_PLANS_PER_LISTING }))
      return
    }
    setForm((f) => {
      const source = f.plans.find((p) => p.key === key)
      if (!source) return f
      return {
        ...f,
        plans: [...f.plans, { ...source, key: newKey(), id: undefined, name: `${source.name}${t.price.copySuffix}`, isDefault: false }],
      }
    })
  }

  const addPlan = () => {
    if (form.plans.length >= MAX_PLANS_PER_LISTING) {
      toast.error(fmt(t.toast.maxPlans, { max: MAX_PLANS_PER_LISTING }))
      return
    }
    const last = form.plans.filter((p) => p.planType !== 'RENT').at(-1)
    const term = last ? String(Math.min(60, num(last.termMonths) + 12)) : '24'
    setForm((f) => ({
      ...f,
      plans: [
        ...f.plans,
        installmentPlan(locale, {
          termMonths: term,
          downPayment: last?.downPayment ?? '',
          annualRatePercent: last?.annualRatePercent ?? '24',
          isDefault: f.plans.length === 0,
        }),
      ],
    }))
  }

  const instCalc = inst ? computeDraft(inst, carPrice, currency) : null
  const instDownPct = inst && carPrice > 0 ? Math.round((num(inst.downPayment) / carPrice) * 100) : 0

  const planErrors = Object.entries(errors)
    .filter(([k]) => k.startsWith('plans'))
    .map(([k, msgs]) => {
      const i = Number(k.split('.')[1])
      const name = Number.isFinite(i) ? form.plans[i]?.name : null
      return `${name ? `${name}: ` : ''}${tv(msgs[0])}`
    })

  return (
    <div className="space-y-4">
      {/* ── Narx ─────────────────────────────────────────── */}
      <div className="rounded-xl bg-surface-2 p-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="flex items-center gap-2 text-sm font-semibold text-text">
            <Banknote className="size-4 text-primary" />
            {form.hasCashSale ? t.price.cashPrice : t.price.carPrice}
            <span className="text-danger">*</span>
          </p>
          {carPrice > 0 && currency === 'UZS' && usdRate > 0 ? (
            <span className="tabular text-[12px] text-muted">
              {t.price.approx} <strong className="text-primary">{formatMoney(Math.round(carPrice / usdRate), 'USD', { compact: false }).replace(/\.00$/, '')}</strong>
            </span>
          ) : null}
          {carPrice > 0 && currency === 'USD' && usdRate > 0 ? (
            <span className="tabular text-[12px] text-muted">
              {t.price.approx} <strong className="text-primary">{formatMoney(carPrice * usdRate, 'UZS', { locale })}</strong>
            </span>
          ) : null}
        </div>
        <div className="mt-2.5 flex gap-2">
          <Input
            value={groupDigits(form.carPrice)}
            onChange={(e) => {
              const raw = e.target.value.replace(/[^\d]/g, '')
              const price = num(raw)
              setForm((f) => ({
                ...f,
                carPrice: raw,
                // Narx o'zgarsa boshlang'ich to'lov foizi saqlanadi; hali
                // kiritilmagan bo'lsa — bozordagi odatiy 20%
                plans: f.plans.map((p) => {
                  if (p.planType === 'RENT' || price <= 0) return p
                  const oldPrice = num(f.carPrice)
                  const pct =
                    p.downPayment === '' || oldPrice < 1000 ? 0.2 : num(p.downPayment) / oldPrice
                  return { ...p, downPayment: String(Math.round(price * pct)) }
                }),
              }))
            }}
            inputMode="numeric"
            placeholder="245 000 000"
            aria-label={t.price.carPrice}
            invalid={!!errors.cashPrice || !!errors['plans.0.carPrice']}
            className="tabular h-12 text-lg font-bold lg:h-12"
            suffixNode={unit}
          />
          <div className="flex shrink-0 rounded-lg bg-surface p-1" role="radiogroup" aria-label={t.price.currency}>
            {(['UZS', 'USD'] as const).map((c) => (
              <button
                key={c}
                type="button"
                role="radio"
                aria-checked={currency === c}
                onClick={() => setForm((f) => ({ ...f, currency: c }))}
                className={cn(
                  'rounded-md px-3 text-[13px] font-semibold transition-colors',
                  currency === c ? 'bg-primary text-primary-fg' : 'text-muted hover:text-text',
                )}
              >
                {c === 'UZS' ? currencyLabel('UZS', locale) : 'USD'}
              </button>
            ))}
          </div>
        </div>
        {errors.cashPrice ? <p className="mt-1.5 text-[13px] text-danger">{tv(errors.cashPrice[0])}</p> : null}
        <label className="mt-3 flex cursor-pointer items-center gap-2 text-[13px] font-medium text-text">
          <Checkbox
            checked={form.isNegotiable}
            onCheckedChange={(v) => setForm((f) => ({ ...f, isNegotiable: v === true }))}
          />
          {t.price.negotiable}
        </label>
        <p className="mt-2 text-[12px] text-subtle">
          {t.price.basisNote}
        </p>
      </div>

      {/* ── Muddatli to'lov / lizing ─────────────────────── */}
      {inst ? (
        <div className="rounded-xl bg-surface-2 p-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="flex items-center gap-2 text-[15px] font-semibold text-text">
              <Landmark className="size-4 text-primary" />
              {t.price.installmentTitle}
            </p>
            <div className="flex rounded-lg bg-surface p-1">
              {(['INSTALLMENT', 'LEASING'] as const).map((pt) => (
                <button
                  key={pt}
                  type="button"
                  onClick={() => patchPlan(inst.key, { planType: pt, ownershipTransfer: true })}
                  className={cn(
                    'rounded-md px-2.5 py-1 text-[12px] font-semibold transition-colors',
                    inst.planType === pt ? 'bg-primary text-primary-fg' : 'text-muted hover:text-text',
                  )}
                >
                  {pt === 'INSTALLMENT' ? t.price.installment : t.price.leasing}
                </button>
              ))}
            </div>
          </div>

          <div className="mt-4 grid gap-5 md:grid-cols-2">
            <div>
              <div className="flex items-baseline justify-between gap-2">
                <span className="text-[13px] font-medium text-muted">
                  {fmt(t.price.minDown, { pct: instDownPct })}
                </span>
                <span className="tabular text-[17px] font-bold text-primary">
                  {carPrice > 0 ? money(num(inst.downPayment)) : '—'}
                </span>
              </div>
              <input
                type="range"
                min={0}
                max={80}
                step={5}
                value={instDownPct}
                disabled={carPrice <= 0}
                onChange={(e) =>
                  patchPlan(inst.key, {
                    downPayment: String(Math.round((carPrice * Number(e.target.value)) / 100)),
                  })
                }
                aria-label={t.price.downAria}
                className="mt-3 w-full accent-[var(--primary)] disabled:opacity-50"
              />
              <div className="tabular mt-1 flex justify-between text-[11px] text-subtle">
                <span>0%</span>
                <span>20%</span>
                <span>40%</span>
                <span>60%</span>
                <span>80%</span>
              </div>
              <Field label={t.price.rate} className="mt-4">
                <Input
                  value={inst.annualRatePercent}
                  onChange={(e) => patchPlan(inst.key, { annualRatePercent: e.target.value, calcMethod: inst.calcMethod === 'FIXED' ? 'ANNUITY' : inst.calcMethod })}
                  inputMode="decimal"
                  placeholder="24"
                  suffixNode={t.price.perYear}
                  className="tabular"
                />
              </Field>
            </div>

            <div>
              <p className="text-[13px] font-medium text-muted">{t.price.maxTerm}</p>
              <div className="mt-2 grid grid-cols-5 gap-1.5">
                {INSTALLMENT_TERMS.map((n) => (
                  <Chip
                    key={n}
                    active={num(inst.termMonths) === n}
                    onClick={() => patchPlan(inst.key, { termMonths: String(n) })}
                    className="px-0"
                  >
                    {fmt(t.price.months, { n })}
                  </Chip>
                ))}
              </div>

              <div className="mt-4 flex items-center gap-3 rounded-xl bg-surface p-3.5">
                <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-success-soft text-success">
                  <BarChart3 className="size-5" />
                </span>
                <div className="min-w-0">
                  <p className="text-[12px] text-muted">{t.price.estimate}</p>
                  <p className="tabular text-[18px] font-bold text-primary">
                    {instCalc ? fmt(t.price.perMonthApprox, { amount: money(instCalc.monthlyPayment) }) : t.price.enterPrice}
                  </p>
                  {instCalc && instCalc.markupAmount > 0 ? (
                    <p className="tabular text-[11px] text-subtle">
                      {fmt(t.price.totalMarkup, {
                        amount: money(instCalc.markupAmount),
                        pct: formatPercent(instCalc.overpayPercent, 1, locale),
                      })}
                    </p>
                  ) : null}
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : null}

      {/* ── Arenda ───────────────────────────────────────── */}
      {rent ? (
        <div className="rounded-xl bg-surface-2 p-4">
          <p className="flex items-center gap-2 text-[15px] font-semibold text-text">
            <KeyRound className="size-4 text-primary" />
            {t.price.rentTitle}
          </p>
          <div className="mt-4 grid gap-3 sm:grid-cols-3">
            <Field label={t.price.daily}>
              <Input
                value={groupDigits(rent.dailyPayment)}
                onChange={(e) => patchPlan(rent.key, { dailyPayment: e.target.value.replace(/[^\d]/g, '') })}
                inputMode="numeric"
                placeholder="350 000"
                suffixNode={unit}
                className="tabular"
              />
            </Field>
            <Field label={t.price.monthly} required>
              <Input
                value={groupDigits(rent.monthlyPaymentInput)}
                onChange={(e) =>
                  patchPlan(rent.key, {
                    monthlyPaymentInput: e.target.value.replace(/[^\d]/g, ''),
                    calcMethod: 'FIXED',
                  })
                }
                inputMode="numeric"
                placeholder="7 500 000"
                suffixNode={unit}
                className="tabular"
                invalid={!!errors[`plans.${rentIdx}.monthlyPaymentInput`]}
              />
            </Field>
            <Field label={t.price.deposit}>
              <Input
                value={groupDigits(rent.depositAmount)}
                onChange={(e) => patchPlan(rent.key, { depositAmount: e.target.value.replace(/[^\d]/g, '') })}
                inputMode="numeric"
                placeholder="3 000 000"
                suffixNode={unit}
                className="tabular"
              />
            </Field>
          </div>
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <span className="text-[13px] font-medium text-muted">{t.price.contractTerm}</span>
            {RENT_TERMS.map((n) => (
              <Chip
                key={n}
                active={num(rent.termMonths) === n}
                onClick={() => patchPlan(rent.key, { termMonths: String(n) })}
                className={num(rent.termMonths) === n ? undefined : 'bg-surface'}
              >
                {fmt(t.price.months, { n })}
              </Chip>
            ))}
          </div>
          <div className="mt-3 rounded-xl bg-surface px-3.5 py-1.5">
            <SwitchRow
              checked={rent.ownershipTransfer}
              onCheckedChange={(v) => patchPlan(rent.key, { ownershipTransfer: v })}
              label={t.price.rentToOwn}
              hint={t.price.rentToOwnHint}
            />
          </div>
        </div>
      ) : null}

      {planErrors.length > 0 ? (
        <ul role="alert" className="space-y-1 rounded-xl border border-danger/25 bg-danger-soft px-4 py-3 text-[13px] text-danger">
          {planErrors.map((e) => (
            <li key={e}>{e}</li>
          ))}
        </ul>
      ) : null}

      {/* ── Kengaytirilgan: barcha shartlar ──────────────── */}
      {form.plans.length > 0 ? (
        <div className="rounded-xl border border-border">
          <button
            type="button"
            onClick={() => setShowAdvanced((v) => !v)}
            aria-expanded={showAdvanced}
            className="flex w-full items-center justify-between gap-3 px-4 py-3.5 text-left"
          >
            <span>
              <span className="block text-sm font-semibold text-text">
                {fmt(t.price.advanced, { n: form.plans.length })}
              </span>
              <span className="mt-0.5 block text-[12px] text-muted">
                {t.price.advancedHint}
              </span>
            </span>
            <ChevronDown className={cn('size-5 shrink-0 text-subtle transition-transform', showAdvanced && 'rotate-180')} />
          </button>
          {showAdvanced ? (
            <div className="space-y-4 border-t border-border p-3 sm:p-4">
              {form.plans.map((plan, i) => (
                <PlanEditor
                  key={plan.key}
                  plan={plan}
                  index={i}
                  total={form.hasCashSale ? form.plans.length + 1 : form.plans.length}
                  carPrice={carPrice}
                  currency={currency}
                  onChange={(patch) => patchPlan(plan.key, patch)}
                  onRemove={() => removePlan(plan.key)}
                  onDuplicate={() => duplicatePlan(plan.key)}
                  onMakeDefault={() => makeDefault(plan.key)}
                />
              ))}
              {form.plans.length < MAX_PLANS_PER_LISTING ? (
                <Button type="button" variant="outline" block onClick={addPlan}>
                  <Plus /> {t.price.addPlan}
                </Button>
              ) : null}
            </div>
          ) : null}
        </div>
      ) : null}
    </div>
  )
}
