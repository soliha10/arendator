'use client'

import * as React from 'react'
import { AlertCircle, Eye, EyeOff, LogIn } from 'lucide-react'
import { loginAction } from '@/server/actions/auth'
import { idleState } from '@/server/actions/types'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Field } from '@/components/ui/field'

export function LoginForm({ next }: { next?: string }) {
  const [state, formAction, pending] = React.useActionState(loginAction, idleState)
  const [showPassword, setShowPassword] = React.useState(false)

  return (
    <form action={formAction} className="mt-8 space-y-4">
      {next ? <input type="hidden" name="next" value={next} /> : null}

      {state.status === 'error' && state.message ? (
        <div
          role="alert"
          className="flex items-start gap-2.5 rounded-xl border border-danger/25 bg-danger-soft px-4 py-3 text-[13px] text-danger"
        >
          <AlertCircle className="mt-0.5 size-4 shrink-0" />
          {state.message}
        </div>
      ) : null}

      <Field
        label="Telefon raqami"
        htmlFor="phone"
        required
        error={state.fieldErrors?.phone}
      >
        <Input
          id="phone"
          name="phone"
          type="tel"
          placeholder="+998 90 123 45 67"
          autoComplete="tel"
          autoFocus
          required
          invalid={!!state.fieldErrors?.phone}
        />
      </Field>

      <Field label="Parol" htmlFor="password" required error={state.fieldErrors?.password}>
        <div className="relative">
          <Input
            id="password"
            name="password"
            type={showPassword ? 'text' : 'password'}
            placeholder="••••••••"
            autoComplete="current-password"
            required
            className="pr-11"
            invalid={!!state.fieldErrors?.password}
          />
          <button
            type="button"
            onClick={() => setShowPassword((v) => !v)}
            aria-label={showPassword ? 'Parolni yashirish' : 'Parolni koʻrsatish'}
            className="absolute right-1 top-1/2 flex size-8 -translate-y-1/2 items-center justify-center rounded-lg text-subtle transition-colors hover:text-text"
          >
            {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
          </button>
        </div>
      </Field>

      <Button type="submit" block size="lg" loading={pending}>
        <LogIn /> Kirish
      </Button>

      <div className="rounded-xl border border-border bg-surface-2 p-3.5">
        <p className="text-[12px] font-semibold text-text">Demo hisoblar</p>
        <ul className="mt-1.5 space-y-1 text-[12px] leading-relaxed text-muted">
          <li>
            Arendator: <span className="tabular font-medium text-text">+998901234501</span>
          </li>
          <li>
            Foydalanuvchi: <span className="tabular font-medium text-text">+998905551100</span>
          </li>
          <li>
            Admin: <span className="tabular font-medium text-text">+998901112233</span>
          </li>
          <li>
            Parol (hammasi uchun):{' '}
            <span className="font-medium text-text">parol12345</span>
          </li>
        </ul>
      </div>
    </form>
  )
}
