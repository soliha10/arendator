'use client'

import * as React from 'react'
import { AlertCircle, ArrowRight, Eye, EyeOff, Lock, Phone } from 'lucide-react'
import { loginAction } from '@/server/actions/auth'
import { idleState } from '@/server/actions/types'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Field } from '@/components/ui/field'
import { useMessages, useValidationText } from '@/i18n/client'

export function LoginForm({ next, showDemo = false }: { next?: string; showDemo?: boolean }) {
  const [state, formAction, pending] = React.useActionState(loginAction, idleState)
  // `action={...}` o'rniga onSubmit: React 19 action'dan keyin formani
  // tozalaydi — xato chiqqanda kiritilgan ism va telefon yo'qolmasin
  const [, startTransition] = React.useTransition()
  const submit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const data = new FormData(e.currentTarget)
    startTransition(() => formAction(data))
  }
  const [showPassword, setShowPassword] = React.useState(false)
  const t = useMessages().auth.login
  const tv = useValidationText()

  return (
    <form onSubmit={submit} className="mt-8 space-y-4">
      {next ? <input type="hidden" name="next" value={next} /> : null}

      {state.status === 'error' && state.message ? (
        <div
          role="alert"
          className="flex items-start gap-2.5 rounded-xl border border-danger/25 bg-danger-soft px-4 py-3 text-[13px] text-danger"
        >
          <AlertCircle className="mt-0.5 size-4 shrink-0" />
          {tv(state.message)}
        </div>
      ) : null}

      <Field
        label={t.phone}
        htmlFor="phone"
        required
        error={tv(state.fieldErrors?.phone?.[0])}
      >
        <div className="relative">
          <Phone className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-subtle" aria-hidden />
          <Input
            id="phone"
            name="phone"
            type="tel"
            inputMode="tel"
            placeholder="+998 90 123 45 67"
            autoComplete="tel"
            autoFocus
            required
            className="pl-10"
            invalid={!!state.fieldErrors?.phone}
          />
        </div>
      </Field>

      <Field label={t.password} htmlFor="password" required error={tv(state.fieldErrors?.password?.[0])}>
        <div className="relative">
          <Lock className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-subtle" aria-hidden />
          <Input
            id="password"
            name="password"
            type={showPassword ? 'text' : 'password'}
            placeholder="••••••••"
            autoComplete="current-password"
            required
            className="pl-10 pr-11"
            invalid={!!state.fieldErrors?.password}
          />
          <button
            type="button"
            onClick={() => setShowPassword((v) => !v)}
            aria-label={showPassword ? t.hidePassword : t.showPassword}
            className="absolute right-1 top-1/2 flex size-8 -translate-y-1/2 items-center justify-center rounded-lg text-subtle transition-colors hover:text-text"
          >
            {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
          </button>
        </div>
      </Field>

      <Button type="submit" block size="lg" loading={pending}>
        {t.submit} <ArrowRight />
      </Button>

      {showDemo ? (
      <div className="rounded-xl border border-dashed border-border-strong bg-surface-2 p-3.5">
        <p className="text-[12px] font-semibold text-text">{t.demoTitle}</p>
        <ul className="mt-1.5 space-y-1 text-[12px] leading-relaxed text-muted">
          <li>
            {t.demoDealer}: <span className="tabular font-medium text-text">+998901234501</span>
          </li>
          <li>
            {t.demoUser}: <span className="tabular font-medium text-text">+998905551100</span>
          </li>
          <li>
            {t.demoAdmin}: <span className="tabular font-medium text-text">+998901112233</span>
          </li>
          <li>
            {t.demoPassword}:{' '}
            <span className="font-medium text-text">parol12345</span>
          </li>
        </ul>
      </div>
      ) : null}
    </form>
  )
}
