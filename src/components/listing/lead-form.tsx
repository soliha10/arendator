'use client'

import * as React from 'react'
import { CheckCircle2, Phone, Send } from 'lucide-react'
import { toast } from 'sonner'
import type { PlanDto } from '@/server/mappers'
import { createLeadAction } from '@/server/actions/leads'
import { formatMoney, formatPhone } from '@/lib/format'
import { Button } from '@/components/ui/button'
import { Input, Select, Textarea } from '@/components/ui/input'
import { Field } from '@/components/ui/field'
import { idleState } from '@/server/actions/types'

export function LeadForm({
  listingId,
  plans,
  contactPhone,
  defaultName = '',
  defaultPhone = '',
}: {
  listingId: string
  plans: PlanDto[]
  contactPhone: string
  defaultName?: string
  defaultPhone?: string
}) {
  const [state, formAction, pending] = React.useActionState(
    createLeadAction,
    idleState,
  )
  const [revealed, setRevealed] = React.useState(false)

  React.useEffect(() => {
    if (state.status === 'error' && state.message) toast.error(state.message)
  }, [state])

  if (state.status === 'success') {
    return (
      <div className="card p-5 text-center">
        <CheckCircle2 className="mx-auto size-10 text-success" />
        <h3 className="mt-3 text-base font-semibold text-text">Ariza yuborildi</h3>
        <p className="mt-1.5 text-sm text-muted">{state.message}</p>
        <Button
          variant="outline"
          block
          className="mt-4"
          onClick={() => window.location.reload()}
        >
          Yana ariza qoldirish
        </Button>
      </div>
    )
  }

  const defaultPlan = plans.find((p) => p.isDefault) ?? plans[0]

  return (
    <div className="card p-5">
      <h3 className="text-base font-semibold text-text">Arendator bilan bogʻlanish</h3>
      <p className="mt-1 text-[13px] text-muted">
        Ariza qoldiring — arendator siz bilan bogʻlanadi
      </p>

      <Button
        variant={revealed ? 'outline' : 'primary'}
        block
        size="lg"
        className="mt-4"
        asChild={revealed}
        onClick={revealed ? undefined : () => setRevealed(true)}
      >
        {revealed ? (
          <a href={`tel:${contactPhone}`}>
            <Phone /> {formatPhone(contactPhone)}
          </a>
        ) : (
          <span>
            <Phone /> Raqamni koʻrsatish
          </span>
        )}
      </Button>

      <div className="my-4 flex items-center gap-3">
        <span className="h-px flex-1 bg-border" />
        <span className="text-[12px] text-subtle">yoki</span>
        <span className="h-px flex-1 bg-border" />
      </div>

      <form action={formAction} className="space-y-3">
        <input type="hidden" name="listingId" value={listingId} />

        {plans.length > 0 ? (
          <Field label="Qaysi shart boʻyicha?" htmlFor="planId">
            <Select id="planId" name="planId" defaultValue={defaultPlan?.id}>
              {plans.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} — {formatMoney(p.monthlyPayment, p.currency, { compact: true })}/oy
                </option>
              ))}
            </Select>
          </Field>
        ) : null}

        <Field
          label="Ismingiz"
          htmlFor="fullName"
          required
          error={state.fieldErrors?.fullName}
        >
          <Input
            id="fullName"
            name="fullName"
            defaultValue={defaultName}
            placeholder="Ism Familiya"
            autoComplete="name"
            required
            invalid={!!state.fieldErrors?.fullName}
          />
        </Field>

        <Field
          label="Telefon raqamingiz"
          htmlFor="phone"
          required
          error={state.fieldErrors?.phone}
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

        <Field label="Xabar" htmlFor="message" error={state.fieldErrors?.message}>
          <Textarea
            id="message"
            name="message"
            rows={3}
            placeholder="Savolingiz yoki qoʻshimcha maʼlumot…"
          />
        </Field>

        <Button type="submit" block size="lg" loading={pending}>
          <Send /> Ariza yuborish
        </Button>

        <p className="text-[12px] leading-relaxed text-subtle">
          Ariza yuborish orqali telefon raqamingiz arendatorga koʻrsatilishiga
          rozilik bildirasiz.
        </p>
      </form>
    </div>
  )
}
