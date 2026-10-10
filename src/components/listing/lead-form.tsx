'use client'

import * as React from 'react'
import { CheckCircle2, Send } from 'lucide-react'
import { toast } from 'sonner'
import type { PlanDto } from '@/server/mappers'
import { createLeadAction } from '@/server/actions/leads'
import { formatMoney } from '@/lib/format'
import { track } from '@/lib/analytics'
import { useLocale, useMessages, useValidationText } from '@/i18n/client'
import { fmt } from '@/i18n/format'
import { selectPlan, useSelectedPlan } from './selected-plan'
import { Button } from '@/components/ui/button'
import { Input, Select, Textarea } from '@/components/ui/input'
import { Field } from '@/components/ui/field'
import { idleState } from '@/server/actions/types'

export function LeadForm({
  listingId,
  plans,
  defaultName = '',
  defaultPhone = '',
}: {
  listingId: string
  plans: PlanDto[]
  defaultName?: string
  defaultPhone?: string
}) {
  const [state, formAction, pending] = React.useActionState(
    createLeadAction,
    idleState,
  )
  const m = useMessages()
  const t = m.listing.lead
  const locale = useLocale()
  const tv = useValidationText()
  const defaultPlan = plans.find((p) => p.isDefault) ?? plans[0]
  // Vidjetda tanlangan shart formada ham tanlangan bo'ladi (va aksincha)
  const planId = useSelectedPlan(defaultPlan?.id ?? null)

  React.useEffect(() => {
    if (state.status === 'error' && state.message) toast.error(tv(state.message))
    if (state.status === 'success') track('lead_submit', { listing_id: listingId })
  }, [state, listingId, tv])

  if (state.status === 'success') {
    return (
      <div className="card p-5 text-center">
        <CheckCircle2 className="mx-auto size-10 text-success" />
        <h3 className="mt-3 text-base font-semibold text-text">{t.sentTitle}</h3>
        <p className="mt-1.5 text-sm text-muted">{state.message}</p>
        <Button
          variant="outline"
          block
          className="mt-4"
          onClick={() => window.location.reload()}
        >
          {t.again}
        </Button>
      </div>
    )
  }

  return (
    <div className="card p-5 sm:p-6">
      <h3 className="text-[17px] font-bold text-text">{t.title}</h3>
      <p className="mt-1 text-[13px] leading-relaxed text-muted">
        {t.subtitle}
      </p>

      <form action={formAction} className="mt-4 space-y-3">
        <input type="hidden" name="listingId" value={listingId} />

        {plans.length > 0 ? (
          <Field label={t.plan} htmlFor="planId">
            <Select
              id="planId"
              name="planId"
              value={planId ?? ''}
              onChange={(e) => selectPlan(e.target.value)}
            >
              {plans.map((p) => (
                <option key={p.id} value={p.id}>
                  {fmt(t.planOption, {
                    type: m.enums.planType[p.planType],
                    term: p.termMonths,
                    monthly: formatMoney(p.monthlyPayment, p.currency, { compact: true, locale }),
                  })}
                </option>
              ))}
            </Select>
          </Field>
        ) : null}

        <Field
          label={t.name}
          htmlFor="fullName"
          required
          error={state.fieldErrors?.fullName?.map((e) => tv(e) ?? e)}
        >
          <Input
            id="fullName"
            name="fullName"
            defaultValue={defaultName}
            placeholder={t.namePlaceholder}
            autoComplete="name"
            required
            invalid={!!state.fieldErrors?.fullName}
          />
        </Field>

        <Field
          label={t.phone}
          htmlFor="phone"
          required
          error={state.fieldErrors?.phone?.map((e) => tv(e) ?? e)}
        >
          <Input
            id="phone"
            name="phone"
            type="tel"
            defaultValue={defaultPhone}
            placeholder="+998 90 123 45 67"
            autoComplete="tel"
            required
            invalid={!!state.fieldErrors?.phone}
          />
        </Field>

        <Field label={t.message} htmlFor="message" error={state.fieldErrors?.message?.map((e) => tv(e) ?? e)}>
          <Textarea
            id="message"
            name="message"
            rows={3}
            placeholder={t.messagePlaceholder}
          />
        </Field>

        <Button type="submit" block size="lg" loading={pending}>
          <Send /> {t.submit}
        </Button>

        <p className="text-[12px] leading-relaxed text-subtle">
          {t.consent}
        </p>
      </form>
    </div>
  )
}
