'use client'

import * as React from 'react'
import {
  AlertCircle, Banknote, Check, CircleCheck, Eye, Info, KeyRound,
  LocateFixed, MapPin, Phone, Rocket, Save, Send, TrendingUp, X,
} from 'lucide-react'
import { toast } from 'sonner'
import { saveListingAction } from '@/server/actions/listings'
import { FEATURE_OPTIONS, PROMOTION_PLANS } from '@/lib/constants'
import { formatMoney } from '@/lib/format'
import { Button } from '@/components/ui/button'
import { Input, Select, Textarea } from '@/components/ui/input'
import { Field } from '@/components/ui/field'
import { Checkbox } from '@/components/ui/checkbox'
import { cn } from '@/lib/utils'
import { Link, useLocale, useMessages, useRouter, useValidationText } from '@/i18n/client'
import { fmt } from '@/i18n/format'
import { featureLabel } from '@/i18n/labels'
import { ImageUploader } from './image-uploader'
import { FinanceSection, groupDigits, num } from './finance-section'
import { ListingPreview } from './listing-preview'
import { Chip, SectionCard } from './section-card'
import {
  emptyForm, installmentPlan, rentPlan, toPayload,
  type ListingFormState,
} from './types'

export interface BrandWithModels {
  id: string
  name: string
  models: { id: string; name: string }[]
}

export interface RegionOption {
  id: string
  name: string
}

const CURRENT_YEAR = new Date().getFullYear()
const YEARS = Array.from({ length: CURRENT_YEAR - 1989 }, (_, i) => CURRENT_YEAR + 1 - i)
const POPULAR_BRANDS = ['Chevrolet', 'BYD', 'Kia', 'Hyundai', 'Chery', 'Toyota', 'Changan']
const DESCRIPTION_MAX = 2000

/** Progress bosqichlari va ular qaysi bo'limga olib boradi */
const STEPS = [
  { key: 'basic', section: 'sec-format' },
  { key: 'tech', section: 'sec-photos' },
  { key: 'price', section: 'sec-price' },
  { key: 'contact', section: 'sec-contact' },
] as const

/** Server xatosi kaliti → bo'lim */
function sectionForError(key: string): string {
  if (key.startsWith('plans') || key === 'cashPrice') return 'sec-price'
  if (key === 'images') return 'sec-photos'
  if (['description', 'features'].includes(key)) return 'sec-features'
  if (['regionId', 'address', 'contactPhone', 'contactName', 'telegram', 'latitude', 'longitude'].includes(key))
    return 'sec-contact'
  return 'sec-car'
}

const SECTION_ORDER = ['sec-format', 'sec-car', 'sec-photos', 'sec-price', 'sec-features', 'sec-contact']

function scrollToSection(id: string) {
  document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
}

export function ListingForm({
  brands,
  regions,
  initial,
  defaultPhone,
  defaultName,
  usdRate,
}: {
  brands: BrandWithModels[]
  regions: RegionOption[]
  initial?: ListingFormState
  defaultPhone: string
  defaultName: string
  usdRate: number
}) {
  const router = useRouter()
  const locale = useLocale()
  const m = useMessages()
  const t = m.form
  const tv = useValidationText()
  /** Maydon xatolari joriy tilda */
  const err = (key: string) => errors[key]?.map((e) => tv(e) ?? e)
  const [form, setForm] = React.useState<ListingFormState>(
    () => initial ?? emptyForm(defaultPhone, defaultName, locale),
  )
  const [pending, startTransition] = React.useTransition()
  const [errors, setErrors] = React.useState<Record<string, string[]>>({})
  const [globalError, setGlobalError] = React.useState<string | null>(null)
  const [locating, setLocating] = React.useState(false)
  const [showAllBrands, setShowAllBrands] = React.useState(false)

  const isEdit = Boolean(form.id)
  const set = <K extends keyof ListingFormState>(key: K, value: ListingFormState[K]) =>
    setForm((f) => ({ ...f, [key]: value }))

  const selectedBrand = brands.find((b) => b.id === form.brandId)
  const selectedModel = selectedBrand?.models.find((m) => m.id === form.modelId)
  const region = regions.find((r) => r.id === form.regionId)
  const carPrice = num(form.carPrice)

  const popularBrands = POPULAR_BRANDS.map((n) => brands.find((b) => b.name === n)).filter(
    (b): b is BrandWithModels => Boolean(b),
  )
  const brandIsPopular = popularBrands.some((b) => b.id === form.brandId)

  /**
   * Marka/model/yil tanlanganda sarlavhani avtomatik taklif qiladi.
   * Hodisa ishlovchisida bajariladi — bu foydalanuvchi harakatiga javob.
   */
  const withSuggestedTitle = (next: ListingFormState): ListingFormState => {
    const brand = brands.find((b) => b.id === next.brandId)
    const model = brand?.models.find((m) => m.id === next.modelId)
    if (!brand) return next
    // Qo'lda yozilgan sarlavhaga tegmaymiz
    const auto = /^[\p{L}\d .-]+ \d{4}$/u
    const untouched = next.title === '' || (auto.test(next.title) && brands.some((b) => next.title.startsWith(b.name)))
    if (!untouched) return next
    return { ...next, title: model ? `${brand.name} ${model.name} ${next.year}` : next.title }
  }

  // ── Sotuv formatlari ─────────────────────────────────────
  const hasInstallment = form.plans.some((p) => p.planType !== 'RENT')
  const hasRent = form.plans.some((p) => p.planType === 'RENT')
  const activeFormats = [form.hasCashSale, hasInstallment, hasRent].filter(Boolean).length

  const toggleFormat = (format: 'cash' | 'installment' | 'rent') => {
    const on =
      format === 'cash' ? form.hasCashSale : format === 'installment' ? hasInstallment : hasRent
    if (on && activeFormats === 1) {
      toast.error(t.toast.needOneFormat)
      return
    }
    setForm((f) => {
      if (format === 'cash') return { ...f, hasCashSale: !on }
      const isRent = format === 'rent'
      let plans = on
        ? f.plans.filter((p) => (isRent ? p.planType !== 'RENT' : p.planType === 'RENT'))
        : [...f.plans, isRent ? rentPlan(locale) : installmentPlan(locale)]
      if (plans.length > 0 && !plans.some((p) => p.isDefault)) {
        // Asosiy shart sifatida muddatli to'lov afzal
        const idx = Math.max(0, plans.findIndex((p) => p.planType !== 'RENT'))
        plans = plans.map((p, i) => ({ ...p, isDefault: i === idx }))
      }
      return { ...f, plans }
    })
  }

  // ── Progress ─────────────────────────────────────────────
  const plansOk =
    form.plans.every(
      (p) =>
        p.name.trim().length >= 2 &&
        num(p.termMonths) > 0 &&
        num(p.downPayment) < carPrice &&
        (p.calcMethod !== 'FIXED' || num(p.monthlyPaymentInput) > 0),
    )
  const stepStatus = [
    Boolean(form.brandId && form.modelId && form.year && form.title.trim().length >= 6),
    form.images.length > 0,
    carPrice > 0 && plansOk && (form.plans.length > 0 || form.hasCashSale),
    Boolean(form.regionId && form.contactPhone.trim()),
  ]
  const doneCount = stepStatus.filter(Boolean).length
  const currentStep = Math.max(0, stepStatus.findIndex((s) => !s))
  const allValid = doneCount === STEPS.length

  // ── Joylashuv ────────────────────────────────────────────
  const locate = () => {
    if (!('geolocation' in navigator)) {
      toast.error(t.toast.geoUnsupported)
      return
    }
    setLocating(true)
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLocating(false)
        setForm((f) => ({
          ...f,
          latitude: Math.round(pos.coords.latitude * 1e6) / 1e6,
          longitude: Math.round(pos.coords.longitude * 1e6) / 1e6,
        }))
        toast.success(t.toast.geoSet)
      },
      () => {
        setLocating(false)
        toast.error(t.toast.geoFailed)
      },
      { enableHighAccuracy: true, timeout: 10_000 },
    )
  }

  // ── Yuborish ─────────────────────────────────────────────
  const submit = (publish: boolean) => {
    setGlobalError(null)
    setErrors({})

    if (publish && !allValid) {
      const firstMissing = stepStatus.findIndex((s) => !s)
      const section = firstMissing === 0 && !(form.brandId && form.modelId) ? 'sec-car' : STEPS[firstMissing].section
      toast.error(fmt(t.toast.incomplete, { items: t.steps[STEPS[firstMissing].key].label }))
      scrollToSection(firstMissing === 0 ? 'sec-car' : section)
      return
    }

    startTransition(async () => {
      const result = await saveListingAction(toPayload(form, publish))

      if (result.status === 'error') {
        const fieldErrors = result.fieldErrors ?? {}
        setErrors(fieldErrors)
        setGlobalError(tv(result.message) ?? t.toast.dataError)
        toast.error(tv(result.message) ?? t.toast.error)
        const sections = Object.keys(fieldErrors).map(sectionForError)
        const first = SECTION_ORDER.find((s) => sections.includes(s))
        if (first) scrollToSection(first)
        return
      }

      toast.success(result.message ?? t.toast.saved)
      router.push('/kabinet/elonlarim')
      router.refresh()
    })
  }

  const descLen = form.description.length

  return (
    <div className="pb-24 lg:pb-0">
      {/* ── Progress ─────────────────────────────────────── */}
      <nav aria-label={t.progress.aria} className="rounded-xl border border-border bg-surface p-4 sm:p-5">
        <div className="mb-3 flex items-center justify-between text-[12px] font-bold uppercase tracking-wide sm:hidden">
          <span className="text-primary">{fmt(t.progress.step, { n: Math.min(currentStep + 1, 4) })}</span>
          <span className="tabular text-muted normal-case">{fmt(t.progress.filled, { n: doneCount * 25 })}</span>
        </div>
        <ol className="grid grid-cols-4 gap-2">
          {STEPS.map((s, i) => {
            const done = stepStatus[i]
            const active = i === currentStep && !done
            return (
              <li key={s.key}>
                <button
                  type="button"
                  onClick={() => scrollToSection(s.section)}
                  className="flex w-full flex-col items-center gap-1.5 text-center sm:flex-row sm:gap-3 sm:text-left"
                >
                  <span
                    className={cn(
                      'flex size-9 shrink-0 items-center justify-center rounded-full text-[14px] font-bold transition-colors sm:size-10',
                      done
                        ? 'bg-primary-soft text-primary'
                        : active
                          ? 'bg-primary text-primary-fg'
                          : 'bg-surface-2 text-subtle',
                    )}
                  >
                    {done ? <Check className="size-4" strokeWidth={3} /> : i + 1}
                  </span>
                  <span className="min-w-0">
                    <span className="hidden text-[11px] font-bold uppercase tracking-wide text-primary sm:block">
                      {fmt(t.progress.stepN, { n: i + 1 })}
                    </span>
                    <span
                      className={cn(
                        'block text-[11px] font-semibold leading-tight sm:text-[13px]',
                        active || done ? 'text-text' : 'text-muted',
                      )}
                    >
                      <span className="sm:hidden">{t.steps[s.key].short}</span>
                      <span className="hidden sm:inline">{t.steps[s.key].label}</span>
                    </span>
                  </span>
                </button>
              </li>
            )
          })}
        </ol>
        <div className="mt-4 h-1.5 overflow-hidden rounded-full bg-surface-2">
          <div
            className="h-full rounded-full bg-primary transition-[width] duration-500"
            style={{ width: `${doneCount * 25}%` }}
          />
        </div>
      </nav>

      {globalError ? (
        <div
          role="alert"
          className="mt-4 flex items-start gap-2.5 rounded-xl border border-danger/25 bg-danger-soft px-4 py-3 text-[13px] text-danger"
        >
          <AlertCircle className="mt-0.5 size-4 shrink-0" />
          {globalError}
        </div>
      ) : null}

      <div className="mt-5 grid gap-5 xl:grid-cols-[minmax(0,1fr)_340px]">
        <div className="min-w-0 space-y-5">
          {/* ── 1. Sotuv formati ─────────────────────────── */}
          <SectionCard
            id="sec-format"
            index={1}
            title={t.format.title}
            subtitle={t.format.subtitle}
            action={
              <span className="rounded-full bg-success-soft px-2.5 py-1 text-[11px] font-bold text-success">
                {t.format.multi}
              </span>
            }
          >
            <div className="grid gap-3 md:grid-cols-3">
              {[
                {
                  key: 'cash' as const,
                  on: form.hasCashSale,
                  icon: Banknote,
                  ...t.format.cash,
                },
                {
                  key: 'installment' as const,
                  on: hasInstallment,
                  icon: TrendingUp,
                  ...t.format.installment,
                },
                {
                  key: 'rent' as const,
                  on: hasRent,
                  icon: KeyRound,
                  ...t.format.rent,
                },
              ].map((f) => (
                <button
                  key={f.key}
                  type="button"
                  role="checkbox"
                  aria-checked={f.on}
                  onClick={() => toggleFormat(f.key)}
                  className={cn(
                    'relative flex gap-3 rounded-xl border p-4 text-left transition-all md:flex-col md:gap-2',
                    f.on
                      ? 'border-primary bg-primary-soft/60 shadow-sm'
                      : 'border-border bg-surface-2 hover:border-border-strong',
                  )}
                >
                  <span
                    className={cn(
                      'flex size-10 shrink-0 items-center justify-center rounded-lg',
                      f.on ? 'bg-primary text-primary-fg' : 'bg-surface text-muted',
                    )}
                  >
                    <f.icon className="size-5" />
                  </span>
                  <span className="min-w-0 flex-1 pr-6 md:pr-0">
                    <span className="block text-[15px] font-bold text-text">{f.title}</span>
                    <span className="mt-0.5 block text-[12px] leading-snug text-muted">{f.text}</span>
                    <span className="mt-2 hidden items-center gap-1 text-[11px] font-semibold text-success md:flex">
                      <CircleCheck className="size-3.5" /> {f.foot}
                    </span>
                  </span>
                  <span
                    className={cn(
                      'absolute right-3 top-3 flex size-5 items-center justify-center rounded-[5px] border',
                      f.on ? 'border-primary bg-primary text-primary-fg' : 'border-border-strong bg-surface',
                    )}
                    aria-hidden
                  >
                    {f.on ? <Check className="size-3.5" strokeWidth={3} /> : null}
                  </span>
                </button>
              ))}
            </div>
          </SectionCard>

          {/* ── 2. Avtomobil ma'lumotlari ────────────────── */}
          <SectionCard
            id="sec-car"
            index={2}
            title={t.car.title}
            subtitle={t.car.subtitle}
          >
            <p className="mb-2 text-[13px] font-semibold text-text">
              {t.car.brand} <span className="text-danger">*</span>
            </p>
            <div className="flex flex-wrap gap-2">
              {popularBrands.map((b) => (
                <Chip
                  key={b.id}
                  active={form.brandId === b.id}
                  onClick={() => {
                    setShowAllBrands(false)
                    setForm((f) => withSuggestedTitle({ ...f, brandId: b.id, modelId: '' }))
                  }}
                >
                  {b.name}
                </Chip>
              ))}
              <Chip
                active={showAllBrands || (!!form.brandId && !brandIsPopular)}
                onClick={() => setShowAllBrands((v) => !v)}
              >
                {form.brandId && !brandIsPopular ? selectedBrand?.name : t.car.otherBrands}
              </Chip>
            </div>
            {showAllBrands || (form.brandId && !brandIsPopular) ? (
              <Select
                className="mt-2.5 max-w-sm"
                value={form.brandId}
                aria-label={t.car.brand}
                onChange={(e) =>
                  setForm((f) => withSuggestedTitle({ ...f, brandId: e.target.value, modelId: '' }))
                }
              >
                <option value="">{t.car.allBrands}</option>
                {brands.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.name}
                  </option>
                ))}
              </Select>
            ) : null}
            {errors.brandId ? <p className="mt-1.5 text-[13px] text-danger">{err('brandId')?.[0]}</p> : null}

            <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <Field label={t.car.model} required error={err('modelId')}>
                <Select
                  value={form.modelId}
                  onChange={(e) => setForm((f) => withSuggestedTitle({ ...f, modelId: e.target.value }))}
                  disabled={!selectedBrand}
                  invalid={!!errors.modelId}
                >
                  <option value="">{selectedBrand ? t.car.choose : t.car.chooseBrandFirst}</option>
                  {selectedBrand?.models.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.name}
                    </option>
                  ))}
                </Select>
              </Field>

              <Field label={t.car.year} required error={err('year')}>
                <Select
                  value={form.year}
                  onChange={(e) => setForm((f) => withSuggestedTitle({ ...f, year: e.target.value }))}
                >
                  {YEARS.map((y) => (
                    <option key={y} value={y}>
                      {y}
                    </option>
                  ))}
                </Select>
              </Field>

              <Field label={t.car.condition} required>
                <div className="flex h-12 rounded-[10px] bg-surface-2 p-1 lg:h-10">
                  {(['USED', 'NEW'] as const).map((c) => (
                    <button
                      key={c}
                      type="button"
                      onClick={() =>
                        setForm((f) => ({ ...f, condition: c, mileage: c === 'NEW' ? '0' : f.mileage }))
                      }
                      className={cn(
                        'flex-1 rounded-lg text-[13px] font-semibold transition-colors',
                        form.condition === c ? 'bg-surface text-primary shadow-sm' : 'text-muted',
                      )}
                    >
                      {c === 'NEW' ? t.car.condNew : t.car.condUsed}
                    </button>
                  ))}
                </div>
              </Field>

              <Field label={t.car.mileage} required error={err('mileage')}>
                <Input
                  value={groupDigits(form.mileage)}
                  onChange={(e) => set('mileage', e.target.value.replace(/[^\d]/g, ''))}
                  inputMode="numeric"
                  disabled={form.condition === 'NEW'}
                  className="tabular"
                  suffixNode={locale === 'ru' ? 'км' : 'km'}
                />
              </Field>

              <Field label={t.car.body}>
                <Select value={form.bodyType} onChange={(e) => set('bodyType', e.target.value)}>
                  {Object.entries(m.enums.bodyType).map(([v, l]) => (
                    <option key={v} value={v}>
                      {l}
                    </option>
                  ))}
                </Select>
              </Field>

              <Field label={t.car.transmission}>
                <Select value={form.transmission} onChange={(e) => set('transmission', e.target.value)}>
                  {Object.entries(m.enums.transmission).map(([v, l]) => (
                    <option key={v} value={v}>
                      {l}
                    </option>
                  ))}
                </Select>
              </Field>

              <Field label={t.car.fuel}>
                <Select value={form.fuelType} onChange={(e) => set('fuelType', e.target.value)}>
                  {Object.entries(m.enums.fuelType).map(([v, l]) => (
                    <option key={v} value={v}>
                      {l}
                    </option>
                  ))}
                </Select>
              </Field>

              <Field label={t.car.drive}>
                <Select value={form.driveType} onChange={(e) => set('driveType', e.target.value)}>
                  {Object.entries(m.enums.driveTypeLong).map(([v, l]) => (
                    <option key={v} value={v}>
                      {l}
                    </option>
                  ))}
                </Select>
              </Field>

              <Field label={t.car.engine} error={err('engineVolume')}>
                <Input
                  value={form.engineVolume}
                  onChange={(e) => set('engineVolume', e.target.value)}
                  inputMode="decimal"
                  placeholder="1.5"
                  suffixNode="L"
                  className="tabular"
                />
              </Field>

              <Field label={t.car.color}>
                <Input
                  value={form.color}
                  onChange={(e) => set('color', e.target.value)}
                  placeholder={t.car.colorPlaceholder}
                  maxLength={40}
                />
              </Field>

              <Field label={t.car.seats} error={err('seats')}>
                <Input
                  value={form.seats}
                  onChange={(e) => set('seats', e.target.value.replace(/[^\d]/g, ''))}
                  inputMode="numeric"
                  className="tabular"
                />
              </Field>
            </div>

            <Field
              label={t.car.titleLabel}
              required
              error={err('title')}
              hint={t.car.titleHint}
              className="mt-4"
            >
              <Input
                value={form.title}
                onChange={(e) => set('title', e.target.value)}
                placeholder="Chevrolet Tracker 2 Premier 2024"
                maxLength={120}
                invalid={!!errors.title}
              />
            </Field>
          </SectionCard>

          {/* ── 3. Rasmlar ───────────────────────────────── */}
          <SectionCard
            id="sec-photos"
            index={3}
            title={t.photos.title}
            subtitle={t.photos.subtitle}
          >
            {errors.images ? <p className="mb-3 text-[13px] text-danger">{err('images')?.[0]}</p> : null}
            <ImageUploader images={form.images} onChange={(images) => set('images', images)} />
          </SectionCard>

          {/* ── 4. Moliyaviy shartlar ───────────────────── */}
          <SectionCard
            id="sec-price"
            index={4}
            title={t.price.title}
            subtitle={t.price.subtitle}
          >
            <FinanceSection form={form} setForm={setForm} usdRate={usdRate} errors={errors} />
          </SectionCard>

          {/* ── 5. Qulayliklar va tavsif ─────────────────── */}
          <SectionCard
            id="sec-features"
            index={5}
            title={t.features.title}
            subtitle={t.features.subtitle}
          >
            <div className="grid grid-cols-2 gap-2 xl:grid-cols-3">
              {FEATURE_OPTIONS.map((f) => {
                const on = form.features.includes(f.key)
                return (
                  <label
                    key={f.key}
                    className={cn(
                      'flex min-h-11 cursor-pointer items-center gap-2 rounded-lg px-2.5 py-2 text-[12px] font-medium leading-snug transition-colors sm:gap-2.5 sm:px-3 sm:text-[13px]',
                      on ? 'bg-primary-soft text-text' : 'bg-surface-2 text-muted hover:text-text',
                    )}
                  >
                    <Checkbox
                      checked={on}
                      onCheckedChange={(v) =>
                        setForm((s) => ({
                          ...s,
                          features: v === true ? [...s.features, f.key] : s.features.filter((k) => k !== f.key),
                        }))
                      }
                    />
                    {featureLabel(m, f.key)}
                  </label>
                )
              })}
            </div>

            <div className="mt-5">
              <div className="mb-1.5 flex items-center justify-between">
                <label htmlFor="listing-description" className="text-sm font-medium text-text">
                  {t.features.descLabel}
                </label>
                <span
                  className={cn(
                    'tabular text-[12px] font-medium',
                    descLen > DESCRIPTION_MAX * 0.9 ? 'text-warning' : 'text-subtle',
                  )}
                >
                  {fmt(t.features.counter, { n: descLen, max: DESCRIPTION_MAX })}
                </span>
              </div>
              <Textarea
                id="listing-description"
                value={form.description}
                onChange={(e) => set('description', e.target.value.slice(0, DESCRIPTION_MAX))}
                rows={6}
                maxLength={DESCRIPTION_MAX}
                placeholder={t.features.descPlaceholder}
                className="bg-surface-2"
              />
              {errors.description ? (
                <p className="mt-1.5 text-[13px] text-danger">{err('description')?.[0]}</p>
              ) : null}
            </div>
          </SectionCard>

          {/* ── 6. Aloqa va joylashuv ────────────────────── */}
          <SectionCard
            id="sec-contact"
            index={6}
            title={t.contact.title}
            subtitle={t.contact.subtitle}
          >
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label={t.contact.region} required error={err('regionId')}>
                <Select
                  value={form.regionId}
                  onChange={(e) => set('regionId', e.target.value)}
                  invalid={!!errors.regionId}
                >
                  <option value="">{t.car.choose}</option>
                  {regions.map((r) => (
                    <option key={r.id} value={r.id}>
                      {r.name}
                    </option>
                  ))}
                </Select>
              </Field>
              <Field label={t.contact.address} error={err('address')}>
                <Input
                  value={form.address}
                  onChange={(e) => set('address', e.target.value)}
                  placeholder={t.contact.addressPlaceholder}
                  maxLength={200}
                />
              </Field>
            </div>

            <div className="mt-4 rounded-xl bg-surface-2 p-3.5">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <p className="flex items-center gap-1.5 text-[13px] font-semibold text-text">
                    <MapPin className="size-4 text-primary" /> {t.contact.mapTitle}
                  </p>
                  <p className="mt-0.5 text-[12px] text-muted">
                    {t.contact.mapHint}
                  </p>
                </div>
                <div className="flex gap-1.5">
                  {form.latitude !== null ? (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => setForm((f) => ({ ...f, latitude: null, longitude: null }))}
                    >
                      <X /> {t.contact.removeLocation}
                    </Button>
                  ) : null}
                  <Button type="button" variant="soft" size="sm" onClick={locate} loading={locating}>
                    <LocateFixed /> {t.contact.myLocation}
                  </Button>
                </div>
              </div>
              {form.latitude !== null && form.longitude !== null ? (
                <div className="mt-3 overflow-hidden rounded-lg border border-border">
                  <iframe
                    title={t.contact.mapFrame}
                    className="block h-48 w-full"
                    loading="lazy"
                    src={`https://www.openstreetmap.org/export/embed.html?bbox=${form.longitude - 0.012},${form.latitude - 0.007},${form.longitude + 0.012},${form.latitude + 0.007}&layer=mapnik&marker=${form.latitude},${form.longitude}`}
                  />
                  <div className="flex flex-wrap items-center justify-between gap-2 bg-surface px-3 py-2 text-[12px]">
                    <span className="flex items-center gap-1.5 font-medium text-text">
                      <CircleCheck className="size-4 text-success" />
                      {t.contact.geoSet}
                    </span>
                    <a
                      href={`https://www.openstreetmap.org/?mlat=${form.latitude}&mlon=${form.longitude}#map=16/${form.latitude}/${form.longitude}`}
                      target="_blank"
                      rel="noreferrer noopener"
                      className="tabular rounded bg-surface-2 px-2 py-0.5 text-muted hover:text-primary"
                    >
                      {form.latitude.toFixed(4)}° N, {form.longitude.toFixed(4)}° E
                    </a>
                  </div>
                </div>
              ) : null}
            </div>

            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <Field label={t.contact.phone} required error={err('contactPhone')}>
                <Input
                  value={form.contactPhone}
                  onChange={(e) => set('contactPhone', e.target.value)}
                  type="tel"
                  placeholder="+998 90 123 45 67"
                  prefixNode={<Phone />}
                  invalid={!!errors.contactPhone}
                />
              </Field>
              <Field label="Telegram username" error={err('telegram')} hint={t.contact.telegramHint}>
                <Input
                  value={form.telegram}
                  onChange={(e) => set('telegram', e.target.value.trim())}
                  placeholder="avto_mutaxassis"
                  prefixNode={<span className="text-sm font-semibold">@</span>}
                  maxLength={40}
                  invalid={!!errors.telegram}
                />
              </Field>
              <Field label={t.contact.contactName} error={err('contactName')}>
                <Input
                  value={form.contactName}
                  onChange={(e) => set('contactName', e.target.value)}
                  placeholder={t.contact.namePlaceholder}
                  maxLength={80}
                />
              </Field>
            </div>
          </SectionCard>
        </div>

        {/* ── O'ng ustun: prevyu va chop etish ──────────── */}
        <aside id="listing-preview" className="scroll-offset space-y-4 xl:sticky xl:top-[calc(var(--header-h)+1rem)] xl:self-start">
          <ListingPreview
            form={form}
            brandName={selectedBrand?.name}
            modelName={selectedModel?.name}
            regionName={region?.name}
          />

          <div className="rounded-xl border border-border bg-surface p-4">
            <p className="font-display flex items-center gap-2 text-[16px] font-bold text-text">
              <Rocket className="size-4 text-primary" /> {t.promo.title}
            </p>
            <p className="mt-1 text-[12px] leading-relaxed text-muted">
              {t.promo.text}
            </p>
            <ul className="mt-3 space-y-2">
              <li className="flex items-center justify-between gap-2 rounded-lg bg-surface-2 px-3 py-2.5">
                <span>
                  <span className="block text-[13px] font-semibold text-text">{t.promo.basic}</span>
                  <span className="block text-[11px] text-muted">{t.promo.basicHint}</span>
                </span>
                <span className="text-[13px] font-bold text-success">{t.promo.free}</span>
              </li>
              {PROMOTION_PLANS.map((p) => (
                <li key={p.tier} className="flex items-center justify-between gap-2 rounded-lg bg-surface-2 px-3 py-2.5">
                  <span className="min-w-0">
                    <span className="block text-[13px] font-semibold text-text">
                      {fmt(t.promo.days, { title: m.enums.promotion[p.tier].title, n: p.days })}
                    </span>
                    <span className="block text-[11px] text-muted">{m.enums.promotion[p.tier].hint}</span>
                  </span>
                  <span className="tabular shrink-0 text-[13px] font-bold text-primary">
                    {formatMoney(p.priceUzs, 'UZS', { locale })}
                  </span>
                </li>
              ))}
            </ul>
          </div>

          <div className="hidden space-y-2 lg:block">
            <Button type="button" size="lg" block onClick={() => submit(true)} loading={pending}>
              <Send /> {isEdit ? t.submit.savePublish : t.submit.publish}
            </Button>
            <Button type="button" variant="secondary" block onClick={() => submit(false)} disabled={pending}>
              <Save /> {t.submit.draft}
            </Button>
            {!allValid ? (
              <p className="flex items-start gap-1.5 text-[12px] text-warning">
                <Info className="mt-0.5 size-3.5 shrink-0" />
                {t.submit.incomplete}{' '}
                {STEPS.filter((_, i) => !stepStatus[i])
                  .map((s) => t.steps[s.key].label)
                  .join(', ')}
              </p>
            ) : null}
            <p className="text-center text-[11px] leading-relaxed text-subtle">
              {t.submit.termsBefore}
              <Link href="/shartlar" className="text-primary hover:underline">
                {t.submit.termsLink}
              </Link>
              {t.submit.termsAnd}
              <Link href="/maxfiylik" className="text-primary hover:underline">
                {t.submit.privacyLink}
              </Link>
              {t.submit.termsAfter}
            </p>
          </div>
        </aside>
      </div>

      {/* ── Mobil: yopishqoq panel ───────────────────────── */}
      <div className="fixed inset-x-0 bottom-0 z-30 border-t border-border bg-surface/95 px-4 pb-[calc(0.75rem+var(--safe-b))] pt-3 backdrop-blur-lg lg:hidden">
        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="secondary"
            onClick={() => submit(false)}
            disabled={pending}
            aria-label={t.submit.draftAria}
            className="shrink-0 px-3"
          >
            <Save />
          </Button>
          <Button
            type="button"
            variant="secondary"
            onClick={() => scrollToSection('listing-preview')}
            aria-label={t.submit.previewAria}
            className="shrink-0 px-3"
          >
            <Eye />
          </Button>
          <Button type="button" onClick={() => submit(true)} loading={pending} className="flex-1">
            <Send />
            <span className="truncate">{isEdit ? t.submit.savePublish : t.submit.publishMobile}</span>
          </Button>
        </div>
        <p className="tabular mt-1.5 text-center text-[11px] text-muted">
          {fmt(t.progress.filled, { n: doneCount * 25 })}
        </p>
      </div>
    </div>
  )
}
