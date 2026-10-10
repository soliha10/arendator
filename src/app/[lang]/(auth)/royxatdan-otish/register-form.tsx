'use client'

import * as React from 'react'
import {
  AlertCircle, ArrowRight, Building2, Check, Eye, EyeOff,
  Lock, Mail, Phone, Store, User,
} from 'lucide-react'
import { registerAction } from '@/server/actions/auth'
import { idleState } from '@/server/actions/types'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Field } from '@/components/ui/field'
import { Checkbox } from '@/components/ui/checkbox'
import { cn } from '@/lib/utils'
import { Link, useMessages, useValidationText } from '@/i18n/client'

type AccountType = 'INDIVIDUAL' | 'BUSINESS'


const iconInput = 'pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-subtle'

export function RegisterForm({
  defaultType,
  next,
}: {
  defaultType: AccountType
  next?: string
}) {
  const [state, formAction, pending] = React.useActionState(registerAction, idleState)
  // `action={...}` o'rniga onSubmit: React 19 action'dan keyin formani
  // tozalaydi — xato chiqqanda kiritilgan ism va telefon yo'qolmasin
  const [, startTransition] = React.useTransition()
  const submit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const data = new FormData(e.currentTarget)
    startTransition(() => formAction(data))
  }
  const [type, setType] = React.useState<AccountType>(defaultType)
  const [showPassword, setShowPassword] = React.useState(false)
  const [accepted, setAccepted] = React.useState(false)
  const m = useMessages().auth
  const t = m.register
  const tv = useValidationText()
  const errors = state.fieldErrors
  const err = (key: string) => tv(errors?.[key]?.[0])
  const ACCOUNT_TYPES = [
    { value: 'INDIVIDUAL' as const, icon: User, title: t.individualTitle, text: t.individualText },
    { value: 'BUSINESS' as const, icon: Building2, title: t.businessTitle, text: t.businessText },
  ]

  return (
    <form onSubmit={submit} className="mt-7 space-y-5" noValidate>
      <input type="hidden" name="accountType" value={type} />
      {next ? <input type="hidden" name="next" value={next} /> : null}

      {state.status === 'error' && state.message ? (
        <div
          role="alert"
          className="flex items-start gap-2.5 rounded-xl border border-danger/25 bg-danger-soft px-4 py-3 text-[13px] text-danger"
        >
          <AlertCircle className="mt-0.5 size-4 shrink-0" aria-hidden />
          {tv(state.message)}
        </div>
      ) : null}

      <fieldset>
        <legend className="mb-2 text-sm font-medium text-text">{t.accountType}</legend>
        <div className="grid grid-cols-2 gap-2.5" role="radiogroup">
          {ACCOUNT_TYPES.map((t) => {
            const active = type === t.value
            return (
              <button
                key={t.value}
                type="button"
                role="radio"
                aria-checked={active}
                onClick={() => setType(t.value)}
                className={cn(
                  'relative flex items-start gap-3 rounded-xl border-2 p-3 text-left transition-colors sm:p-3.5',
                  active
                    ? 'border-primary bg-primary-soft'
                    : 'border-border bg-surface-2 hover:border-border-strong',
                )}
              >
                <span
                  className={cn(
                    'flex size-9 shrink-0 items-center justify-center rounded-lg',
                    active ? 'bg-primary text-primary-fg' : 'bg-surface text-muted',
                  )}
                >
                  <t.icon className="size-4" aria-hidden />
                </span>
                <span className="min-w-0">
                  <span className="block text-[14px] font-semibold text-text">{t.title}</span>
                  <span className="block text-[12px] leading-snug text-muted">{t.text}</span>
                </span>
                {active ? (
                  <Check className="absolute right-2.5 top-2.5 size-4 text-primary" aria-hidden />
                ) : null}
              </button>
            )
          })}
        </div>
        {type === 'BUSINESS' ? (
          <p className="mt-2 text-[12px] leading-relaxed text-muted">
            {t.businessHint}
          </p>
        ) : null}
      </fieldset>

      {type === 'BUSINESS' ? (
        <Field
          label={t.companyName}
          htmlFor="companyName"
          required
          hint={t.companyHint}
          error={err('companyName')}
        >
          <div className="relative">
            <Store className={iconInput} aria-hidden />
            <Input
              id="companyName"
              name="companyName"
              placeholder={t.companyPlaceholder}
              autoComplete="organization"
              required
              className="pl-10"
              invalid={!!errors?.companyName}
            />
          </div>
        </Field>
      ) : null}

      <Field
        label={type === 'BUSINESS' ? t.fullNameBusiness : t.fullNameIndividual}
        htmlFor="fullName"
        required
        error={err('fullName')}
      >
        <div className="relative">
          <User className={iconInput} aria-hidden />
          <Input
            id="fullName"
            name="fullName"
            placeholder={t.fullNamePlaceholder}
            autoComplete="name"
            required
            className="pl-10"
            invalid={!!errors?.fullName}
          />
        </div>
      </Field>

      <div className="grid gap-5 sm:grid-cols-2">
        <Field label={t.phone} htmlFor="phone" required error={err('phone')}>
          <div className="relative">
            <Phone className={iconInput} aria-hidden />
            <Input
              id="phone"
              name="phone"
              type="tel"
              inputMode="tel"
              placeholder="+998 90 123 45 67"
              autoComplete="tel"
              required
              className="pl-10"
              invalid={!!errors?.phone}
            />
          </div>
        </Field>

        <Field label={t.email} htmlFor="email" hint={t.optional} error={err('email')}>
          <div className="relative">
            <Mail className={iconInput} aria-hidden />
            <Input
              id="email"
              name="email"
              type="email"
              placeholder="name@example.com"
              autoComplete="email"
              className="pl-10"
              invalid={!!errors?.email}
            />
          </div>
        </Field>
      </div>

      <Field
        label={t.password}
        htmlFor="password"
        required
        hint={t.passwordHint}
        error={err('password')}
      >
        <div className="relative">
          <Lock className={iconInput} aria-hidden />
          <Input
            id="password"
            name="password"
            type={showPassword ? 'text' : 'password'}
            autoComplete="new-password"
            placeholder={t.passwordPlaceholder}
            required
            className="pl-10 pr-11"
            invalid={!!errors?.password}
          />
          <button
            type="button"
            onClick={() => setShowPassword((v) => !v)}
            aria-label={showPassword ? m.login.hidePassword : m.login.showPassword}
            className="absolute right-1 top-1/2 flex size-9 -translate-y-1/2 items-center justify-center rounded-lg text-subtle transition-colors hover:text-text"
          >
            {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
          </button>
        </div>
      </Field>

      <div>
        <label className="flex cursor-pointer items-start gap-2.5">
          <Checkbox
            checked={accepted}
            onCheckedChange={(v) => setAccepted(v === true)}
            className="mt-0.5"
            aria-invalid={!!errors?.acceptTerms}
          />
          <input type="hidden" name="acceptTerms" value={accepted ? 'on' : ''} />
          <span className="text-[13px] leading-relaxed text-muted">
            {t.termsBefore}
            <Link href="/shartlar" target="_blank" className="font-medium text-primary hover:underline">
              {t.termsLink}
            </Link>
            {t.termsMiddle}
            <Link href="/maxfiylik" target="_blank" className="font-medium text-primary hover:underline">
              {t.privacyLink}
            </Link>
            {t.termsAfter}
          </span>
        </label>
        {errors?.acceptTerms ? (
          <p className="mt-1.5 text-[13px] text-danger">{err('acceptTerms')}</p>
        ) : null}
      </div>

      <Button type="submit" block size="lg" loading={pending} disabled={!accepted}>
        {type === 'BUSINESS' ? t.submitBusiness : t.submitIndividual} <ArrowRight />
      </Button>
    </form>
  )
}
