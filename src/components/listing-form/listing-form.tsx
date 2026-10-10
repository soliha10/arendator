'use client'

import * as React from 'react'
import { useRouter } from 'next/navigation'
import {
  AlertCircle, ArrowLeft, ArrowRight, Car, Check, CreditCard,
  FileText, Images, Plus, Save, Send,
} from 'lucide-react'
import { toast } from 'sonner'
import type { Currency } from '@prisma/client'
import { saveListingAction } from '@/server/actions/listings'
import {
  BODY_TYPE_LABELS, CONDITION_LABELS, DRIVE_TYPE_LABELS,
  FUEL_TYPE_LABELS, MAX_PLANS_PER_LISTING, TRANSMISSION_LABELS,
} from '@/lib/constants'
import { formatMoney } from '@/lib/format'
import { Button } from '@/components/ui/button'
import { Input, Select, Textarea } from '@/components/ui/input'
import { Field } from '@/components/ui/field'
import { cn } from '@/lib/utils'
import { ImageUploader } from './image-uploader'
import { PlanEditor } from './plan-editor'
import {
  emptyForm, emptyPlan, newKey, toPayload,
  type ListingFormState, type PlanDraft,
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

const STEPS = [
  { key: 'car', label: 'Avtomobil', icon: Car },
  { key: 'details', label: 'Tavsif', icon: FileText },
  { key: 'images', label: 'Rasmlar', icon: Images },
  { key: 'plans', label: 'Toʻlov shartlari', icon: CreditCard },
] as const

const CURRENT_YEAR = new Date().getFullYear()
const YEARS = Array.from({ length: CURRENT_YEAR - 1989 }, (_, i) => CURRENT_YEAR - i)

const num = (v: string) => {
  const n = Number(v.replace(/[\s ]/g, '').replace(',', '.'))
  return Number.isFinite(n) ? n : 0
}

export function ListingForm({
  brands,
  regions,
  initial,
  defaultPhone,
  defaultName,
}: {
  brands: BrandWithModels[]
  regions: RegionOption[]
  initial?: ListingFormState
  defaultPhone: string
  defaultName: string
}) {
  const router = useRouter()
  const [form, setForm] = React.useState<ListingFormState>(
    () => initial ?? emptyForm(defaultPhone, defaultName),
  )
  const [step, setStep] = React.useState(0)
  const [pending, startTransition] = React.useTransition()
  const [errors, setErrors] = React.useState<Record<string, string[]>>({})
  const [globalError, setGlobalError] = React.useState<string | null>(null)

  const isEdit = Boolean(form.id)
  const set = <K extends keyof ListingFormState>(key: K, value: ListingFormState[K]) =>
    setForm((f) => ({ ...f, [key]: value }))

  const selectedBrand = brands.find((b) => b.id === form.brandId)
  const carPrice = num(form.carPrice)

  /**
   * Marka/model/yil tanlanganda sarlavhani avtomatik taklif qiladi.
   * Effekt emas — hodisa ishlovchisida bajariladi, chunki bu foydalanuvchi
   * harakatiga javob, holatlarni sinxronlash emas.
   */
  const withSuggestedTitle = (next: ListingFormState): ListingFormState => {
    if (isEdit) return next
    const brand = brands.find((b) => b.id === next.brandId)
    const model = brand?.models.find((m) => m.id === next.modelId)
    if (!brand || !model) return next
    // Foydalanuvchi sarlavhani qoʻlda oʻzgartirgan boʻlsa, tegmaymiz
    const untouched = next.title === '' || next.title.startsWith(brand.name)
    return untouched ? { ...next, title: `${brand.name} ${model.name} ${next.year}` } : next
  }

  const updatePlan = (key: string, patch: Partial<PlanDraft>) =>
    setForm((f) => ({
      ...f,
      plans: f.plans.map((p) => (p.key === key ? { ...p, ...patch } : p)),
    }))

  const makeDefault = (key: string) =>
    setForm((f) => ({
      ...f,
      plans: f.plans.map((p) => ({ ...p, isDefault: p.key === key })),
    }))

  const addPlan = () => {
    if (form.plans.length >= MAX_PLANS_PER_LISTING) {
      toast.error(`Koʻpi bilan ${MAX_PLANS_PER_LISTING} ta shart qoʻshish mumkin`)
      return
    }
    const last = form.plans[form.plans.length - 1]
    const nextTerm = last ? String(Math.min(60, num(last.termMonths) + 12)) : '12'
    setForm((f) => ({
      ...f,
      plans: [
        ...f.plans,
        emptyPlan({
          name: `${nextTerm} oylik rassrochka`,
          termMonths: nextTerm,
          downPayment: last?.downPayment ?? '',
          annualRatePercent: last?.annualRatePercent ?? '24',
        }),
      ],
    }))
  }

  const duplicatePlan = (key: string) => {
    if (form.plans.length >= MAX_PLANS_PER_LISTING) {
      toast.error(`Koʻpi bilan ${MAX_PLANS_PER_LISTING} ta shart`)
      return
    }
    setForm((f) => {
      const source = f.plans.find((p) => p.key === key)
      if (!source) return f
      const copy: PlanDraft = {
        ...source,
        key: newKey(),
        id: undefined,
        name: `${source.name} (nusxa)`,
        isDefault: false,
      }
      return { ...f, plans: [...f.plans, copy] }
    })
  }

  const removePlan = (key: string) =>
    setForm((f) => {
      const plans = f.plans.filter((p) => p.key !== key)
      if (plans.length > 0 && !plans.some((p) => p.isDefault)) plans[0].isDefault = true
      return { ...f, plans }
    })

  /** Har bir qadamning to'ldirilganligi */
  const stepStatus = React.useMemo(() => {
    const carOk = Boolean(form.brandId && form.modelId && form.year)
    const detailsOk = Boolean(
      form.title.trim().length >= 6 && form.regionId && form.contactPhone,
    )
    const imagesOk = form.images.length > 0
    const plansOk =
      carPrice > 0 &&
      form.plans.length > 0 &&
      form.plans.every(
        (p) =>
          p.name.trim().length >= 2 &&
          num(p.termMonths) > 0 &&
          num(p.downPayment) < carPrice &&
          (p.calcMethod !== 'FIXED' || num(p.monthlyPaymentInput) > 0),
      )
    return [carOk, detailsOk, imagesOk, plansOk]
  }, [form, carPrice])

  const allValid = stepStatus.every(Boolean)

  const submit = (publish: boolean) => {
    setGlobalError(null)
    setErrors({})

    startTransition(async () => {
      const result = await saveListingAction(toPayload(form, publish))

      if (result.status === 'error') {
        setErrors(result.fieldErrors ?? {})
        setGlobalError(result.message ?? 'Maʼlumotlarda xatolik bor')
        toast.error(result.message ?? 'Xatolik')

        // Xato qaysi qadamda ekanini topib, oʻsha qadamga oʻtamiz
        const keys = Object.keys(result.fieldErrors ?? {})
        if (keys.some((k) => k.startsWith('plans'))) setStep(3)
        else if (keys.some((k) => k === 'images')) setStep(2)
        else if (keys.some((k) => ['title', 'regionId', 'contactPhone', 'description'].includes(k)))
          setStep(1)
        else if (keys.length) setStep(0)
        return
      }

      toast.success(result.message ?? 'Saqlandi')
      router.push('/kabinet/elonlarim')
      router.refresh()
    })
  }

  const StepIcon = STEPS[step].icon

  return (
    <div className="space-y-5">
      {/* Qadamlar */}
      <nav className="card hide-scrollbar overflow-x-auto p-1.5">
        <ol className="flex min-w-max items-center gap-1">
          {STEPS.map((s, i) => {
            const done = stepStatus[i]
            const active = i === step
            return (
              <li key={s.key} className="flex-1">
                <button
                  type="button"
                  onClick={() => setStep(i)}
                  className={cn(
                    'flex w-full items-center gap-2.5 rounded-[10px] px-3.5 py-2.5 text-left transition-colors',
                    active ? 'bg-primary-soft' : 'hover:bg-surface-2',
                  )}
                >
                  <span
                    className={cn(
                      'flex size-7 shrink-0 items-center justify-center rounded-full text-[12px] font-bold',
                      done
                        ? 'bg-success text-white'
                        : active
                          ? 'bg-primary text-primary-fg'
                          : 'bg-surface-3 text-muted',
                    )}
                  >
                    {done ? <Check className="size-3.5" strokeWidth={3} /> : i + 1}
                  </span>
                  <span
                    className={cn(
                      'whitespace-nowrap text-[13px] font-medium',
                      active ? 'text-primary' : 'text-muted',
                    )}
                  >
                    {s.label}
                  </span>
                </button>
              </li>
            )
          })}
        </ol>
      </nav>

      {globalError ? (
        <div
          role="alert"
          className="flex items-start gap-2.5 rounded-xl border border-danger/25 bg-danger-soft px-4 py-3 text-[13px] text-danger"
        >
          <AlertCircle className="mt-0.5 size-4 shrink-0" />
          {globalError}
        </div>
      ) : null}

      <div className="card p-4 sm:p-5">
        <h2 className="mb-5 flex items-center gap-2.5 text-[17px] font-semibold text-text sm:text-lg">
          <StepIcon className="size-5 text-primary" />
          {STEPS[step].label}
        </h2>

        {/* ── 1: Avtomobil ─────────────────────────────── */}
        {step === 0 ? (
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Marka" required error={errors.brandId}>
              <Select
                value={form.brandId}
                onChange={(e) =>
                  setForm((f) =>
                    withSuggestedTitle({ ...f, brandId: e.target.value, modelId: '' }),
                  )
                }
                invalid={!!errors.brandId}
              >
                <option value="">Tanlang…</option>
                {brands.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.name}
                  </option>
                ))}
              </Select>
            </Field>

            <Field label="Model" required error={errors.modelId}>
              <Select
                value={form.modelId}
                onChange={(e) =>
                  setForm((f) => withSuggestedTitle({ ...f, modelId: e.target.value }))
                }
                disabled={!selectedBrand}
                invalid={!!errors.modelId}
              >
                <option value="">
                  {selectedBrand ? 'Tanlang…' : 'Avval markani tanlang'}
                </option>
                {selectedBrand?.models.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.name}
                  </option>
                ))}
              </Select>
            </Field>

            <Field label="Ishlab chiqarilgan yil" required error={errors.year}>
              <Select
                value={form.year}
                onChange={(e) =>
                  setForm((f) => withSuggestedTitle({ ...f, year: e.target.value }))
                }
              >
                {YEARS.map((y) => (
                  <option key={y} value={y}>
                    {y}
                  </option>
                ))}
              </Select>
            </Field>

            <Field label="Holati" required>
              <Select
                value={form.condition}
                onChange={(e) =>
                  setForm((f) => ({
                    ...f,
                    condition: e.target.value,
                    mileage: e.target.value === 'NEW' ? '0' : f.mileage,
                  }))
                }
              >
                {Object.entries(CONDITION_LABELS).map(([v, l]) => (
                  <option key={v} value={v}>
                    {l}
                  </option>
                ))}
              </Select>
            </Field>

            <Field label="Yurgan masofa" error={errors.mileage}>
              <Input
                value={form.mileage}
                onChange={(e) => set('mileage', e.target.value)}
                inputMode="numeric"
                disabled={form.condition === 'NEW'}
                className="tabular"
                suffixNode="km"
              />
            </Field>

            <Field label="Kuzov" required>
              <Select value={form.bodyType} onChange={(e) => set('bodyType', e.target.value)}>
                {Object.entries(BODY_TYPE_LABELS).map(([v, l]) => (
                  <option key={v} value={v}>
                    {l}
                  </option>
                ))}
              </Select>
            </Field>

            <Field label="Uzatmalar qutisi" required>
              <Select
                value={form.transmission}
                onChange={(e) => set('transmission', e.target.value)}
              >
                {Object.entries(TRANSMISSION_LABELS).map(([v, l]) => (
                  <option key={v} value={v}>
                    {l}
                  </option>
                ))}
              </Select>
            </Field>

            <Field label="Yoqilgʻi" required>
              <Select value={form.fuelType} onChange={(e) => set('fuelType', e.target.value)}>
                {Object.entries(FUEL_TYPE_LABELS).map(([v, l]) => (
                  <option key={v} value={v}>
                    {l}
                  </option>
                ))}
              </Select>
            </Field>

            <Field label="Uzatma" required>
              <Select value={form.driveType} onChange={(e) => set('driveType', e.target.value)}>
                {Object.entries(DRIVE_TYPE_LABELS).map(([v, l]) => (
                  <option key={v} value={v}>
                    {l}
                  </option>
                ))}
              </Select>
            </Field>

            <Field label="Dvigatel hajmi" error={errors.engineVolume} hint="Masalan: 1.5">
              <Input
                value={form.engineVolume}
                onChange={(e) => set('engineVolume', e.target.value)}
                inputMode="decimal"
                placeholder="1.5"
                suffixNode="L"
                className="tabular"
              />
            </Field>

            <Field label="Rangi">
              <Input
                value={form.color}
                onChange={(e) => set('color', e.target.value)}
                placeholder="Oq"
              />
            </Field>

            <Field label="Oʻrindiqlar soni">
              <Input
                value={form.seats}
                onChange={(e) => set('seats', e.target.value)}
                inputMode="numeric"
                className="tabular"
              />
            </Field>
          </div>
        ) : null}

        {/* ── 2: Tavsif va joylashuv ───────────────────── */}
        {step === 1 ? (
          <div className="space-y-4">
            <Field
              label="Eʼlon sarlavhasi"
              required
              error={errors.title}
              hint="Qidiruvda shu matn koʻrinadi"
            >
              <Input
                value={form.title}
                onChange={(e) => set('title', e.target.value)}
                placeholder="Chevrolet Cobalt 2024"
                maxLength={120}
                invalid={!!errors.title}
              />
            </Field>

            <Field
              label="Tavsif"
              error={errors.description}
              hint={`${form.description.length}/5000 · avtomobil holati, hujjatlari, qoʻshimcha jihozlari`}
            >
              <Textarea
                value={form.description}
                onChange={(e) => set('description', e.target.value)}
                rows={7}
                maxLength={5000}
                placeholder="Avtomobil holati, texnik koʻrik, hujjatlar, qoʻshimcha jihozlar haqida yozing…"
              />
            </Field>

            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Viloyat" required error={errors.regionId}>
                <Select
                  value={form.regionId}
                  onChange={(e) => set('regionId', e.target.value)}
                  invalid={!!errors.regionId}
                >
                  <option value="">Tanlang…</option>
                  {regions.map((r) => (
                    <option key={r.id} value={r.id}>
                      {r.name}
                    </option>
                  ))}
                </Select>
              </Field>

              <Field label="Manzil" error={errors.address} hint="Ixtiyoriy">
                <Input
                  value={form.address}
                  onChange={(e) => set('address', e.target.value)}
                  placeholder="Chilonzor tumani, avtosalon"
                />
              </Field>

              <Field label="Aloqa raqami" required error={errors.contactPhone}>
                <Input
                  value={form.contactPhone}
                  onChange={(e) => set('contactPhone', e.target.value)}
                  type="tel"
                  placeholder="+998 90 123 45 67"
                  invalid={!!errors.contactPhone}
                />
              </Field>

              <Field label="Aloqa uchun ism" error={errors.contactName}>
                <Input
                  value={form.contactName}
                  onChange={(e) => set('contactName', e.target.value)}
                  placeholder="Ism Familiya"
                />
              </Field>
            </div>
          </div>
        ) : null}

        {/* ── 3: Rasmlar ───────────────────────────────── */}
        {step === 2 ? (
          <div>
            {errors.images ? (
              <p className="mb-3 text-[13px] text-danger">{errors.images[0]}</p>
            ) : null}
            <ImageUploader images={form.images} onChange={(images) => set('images', images)} />
          </div>
        ) : null}

        {/* ── 4: To'lov shartlari ──────────────────────── */}
        {step === 3 ? (
          <div className="space-y-5">
            <div className="rounded-xl border border-border bg-surface-2 p-4">
              <div className="grid gap-4 sm:grid-cols-[1fr_140px]">
                <Field
                  label="Avtomobilning toʻliq narxi"
                  required
                  hint="Barcha shartlar shu narxdan hisoblanadi"
                  error={errors['plans.0.carPrice']}
                >
                  <Input
                    value={form.carPrice}
                    onChange={(e) => set('carPrice', e.target.value)}
                    inputMode="numeric"
                    placeholder="180000000"
                    className="tabular text-lg"
                    suffixNode={form.currency === 'UZS' ? 'soʻm' : '$'}
                  />
                </Field>
                <Field label="Valyuta">
                  <Select
                    value={form.currency}
                    onChange={(e) => set('currency', e.target.value as Currency)}
                  >
                    <option value="UZS">soʻm</option>
                    <option value="USD">USD</option>
                  </Select>
                </Field>
              </div>
              {carPrice > 0 ? (
                <p className="mt-2 text-[13px] text-muted">
                  Kiritilgan narx:{' '}
                  <span className="tabular font-semibold text-text">
                    {formatMoney(carPrice, form.currency)}
                  </span>
                </p>
              ) : null}
            </div>

            {form.plans.map((plan, i) => (
              <PlanEditor
                key={plan.key}
                plan={plan}
                index={i}
                total={form.plans.length}
                carPrice={carPrice}
                currency={form.currency}
                onChange={(patch) => updatePlan(plan.key, patch)}
                onRemove={() => removePlan(plan.key)}
                onDuplicate={() => duplicatePlan(plan.key)}
                onMakeDefault={() => makeDefault(plan.key)}
              />
            ))}

            {form.plans.length < MAX_PLANS_PER_LISTING ? (
              <Button type="button" variant="outline" block onClick={addPlan}>
                <Plus /> Yana shart qoʻshish
              </Button>
            ) : null}

            <p className="text-[13px] leading-relaxed text-muted">
              Bir nechta shart qoʻshsangiz, mijoz oʻziga qulayini tanlaydi.
              Odatda 12, 24 va 36 oylik variantlar taklif qilinadi.
            </p>
          </div>
        ) : null}
      </div>

      {/* Pastki panel */}
      <div className="sticky bottom-0 z-20 -mx-1 rounded-t-xl border-t border-border bg-surface/95 p-3 pb-[calc(0.75rem+var(--safe-b))] backdrop-blur-lg sm:p-4 sm:pb-4">
        {/*
          Telefonda uchta tugma bir qatorga sigʻmaydi — yordamchi
          tugmalar faqat belgiga qisqaradi, asosiy amal esa keng qoladi.
        */}
        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => setStep((s) => Math.max(0, s - 1))}
            disabled={step === 0}
            aria-label="Orqaga"
            className="shrink-0 px-3 sm:px-4"
          >
            <ArrowLeft />
            <span className="hidden sm:inline">Orqaga</span>
          </Button>

          <Button
            type="button"
            variant="outline"
            onClick={() => submit(false)}
            loading={pending}
            aria-label="Qoralama saqlash"
            className="shrink-0 px-3 sm:px-4"
          >
            <Save />
            <span className="hidden sm:inline">Qoralama saqlash</span>
          </Button>

          {step < STEPS.length - 1 ? (
            <Button
              type="button"
              onClick={() => setStep((s) => s + 1)}
              className="ml-auto flex-1 sm:flex-none"
            >
              Keyingisi <ArrowRight />
            </Button>
          ) : (
            <Button
              type="button"
              onClick={() => submit(true)}
              loading={pending}
              disabled={!allValid}
              className="ml-auto flex-1 sm:flex-none"
            >
              <Send />
              <span className="truncate">
                {isEdit ? 'Saqlash va chop etish' : 'Chop etishga yuborish'}
              </span>
            </Button>
          )}
        </div>

        {step === STEPS.length - 1 && !allValid ? (
          <p className="mt-2 text-[13px] text-warning">
            Chop etish uchun barcha qadamlarni toʻldiring:{' '}
            {STEPS.filter((_, i) => !stepStatus[i])
              .map((s) => s.label)
              .join(', ')}
          </p>
        ) : null}
      </div>
    </div>
  )
}
