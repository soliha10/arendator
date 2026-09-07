'use client'

import * as React from 'react'
import { AlertCircle, Building2, Eye, EyeOff, User, UserPlus } from 'lucide-react'
import { registerAction } from '@/server/actions/auth'
import { idleState } from '@/server/actions/types'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Field } from '@/components/ui/field'
import { Checkbox } from '@/components/ui/checkbox'
import { cn } from '@/lib/utils'

const ROLES = [
  {
    value: 'USER' as const,
    icon: User,
    title: 'Avtomobil izlayapman',
    text: 'Eʼlonlarni koʻrish, taqqoslash va ariza qoldirish',
  },
  {
    value: 'ARENDATOR' as const,
    icon: Building2,
    title: 'Arendatorman',
    text: 'Avtomobillarni rassrochka yoki arendaga qoʻyaman',
  },
]

export function RegisterForm({ defaultArendator }: { defaultArendator: boolean }) {
  const [state, formAction, pending] = React.useActionState(registerAction, idleState)
  const [role, setRole] = React.useState<'USER' | 'ARENDATOR'>(
    defaultArendator ? 'ARENDATOR' : 'USER',
  )
  const [showPassword, setShowPassword] = React.useState(false)
  const [accepted, setAccepted] = React.useState(false)

  return (
    <form action={formAction} className="mt-7 space-y-4">
      <input type="hidden" name="role" value={role} />

      {state.status === 'error' && state.message ? (
        <div
          role="alert"
          className="flex items-start gap-2.5 rounded-xl border border-danger/25 bg-danger-soft px-4 py-3 text-[13px] text-danger"
        >
          <AlertCircle className="mt-0.5 size-4 shrink-0" />
          {state.message}
        </div>
      ) : null}

      {/* Rol tanlash */}
      <fieldset>
        <legend className="mb-2 text-sm font-medium text-text">Kim sifatida?</legend>
        <div className="grid gap-2.5 sm:grid-cols-2">
          {ROLES.map((r) => (
            <button
              key={r.value}
              type="button"
              onClick={() => setRole(r.value)}
              aria-pressed={role === r.value}
              className={cn(
                'rounded-xl border p-3.5 text-left transition-colors',
                role === r.value
                  ? 'border-primary bg-primary-soft'
                  : 'border-border hover:border-border-strong',
              )}
            >
              <r.icon
                className={cn(
                  'size-5',
                  role === r.value ? 'text-primary' : 'text-subtle',
                )}
              />
              <span className="mt-2 block text-[13px] font-semibold text-text">
                {r.title}
              </span>
              <span className="mt-0.5 block text-[12px] leading-snug text-muted">
                {r.text}
              </span>
            </button>
          ))}
        </div>
      </fieldset>

      <Field
        label="Ism-familiya"
        htmlFor="fullName"
        required
        error={state.fieldErrors?.fullName}
      >
        <Input
          id="fullName"
          name="fullName"
          placeholder="Ism Familiya"
          autoComplete="name"
          required
          invalid={!!state.fieldErrors?.fullName}
        />
      </Field>

      {role === 'ARENDATOR' ? (
        <Field
          label="Kompaniya nomi"
          htmlFor="companyName"
          required
          hint="Mijozlar sizni shu nom bilan koʻradi"
          error={state.fieldErrors?.companyName}
        >
          <Input
            id="companyName"
            name="companyName"
            placeholder="Masalan: Avto Kredit Servis"
            required
            invalid={!!state.fieldErrors?.companyName}
          />
        </Field>
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
          required
          invalid={!!state.fieldErrors?.phone}
        />
      </Field>

      <Field
        label="Email"
        htmlFor="email"
        hint="Ixtiyoriy"
        error={state.fieldErrors?.email}
      >
        <Input
          id="email"
          name="email"
          type="email"
          placeholder="siz@example.com"
          autoComplete="email"
          invalid={!!state.fieldErrors?.email}
        />
      </Field>

      <Field
        label="Parol"
        htmlFor="password"
        required
        hint="Kamida 8 ta belgi, harf va raqam"
        error={state.fieldErrors?.password}
      >
        <div className="relative">
          <Input
            id="password"
            name="password"
            type={showPassword ? 'text' : 'password'}
            autoComplete="new-password"
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

      <Field
        label="Parolni tasdiqlang"
        htmlFor="confirmPassword"
        required
        error={state.fieldErrors?.confirmPassword}
      >
        <Input
          id="confirmPassword"
          name="confirmPassword"
          type={showPassword ? 'text' : 'password'}
          autoComplete="new-password"
          required
          invalid={!!state.fieldErrors?.confirmPassword}
        />
      </Field>

      <label className="flex cursor-pointer items-start gap-2.5 pt-1">
        <Checkbox
          checked={accepted}
          onCheckedChange={(v) => setAccepted(v === true)}
          name="acceptTerms"
          value="on"
          className="mt-0.5"
        />
        <input type="hidden" name="acceptTerms" value={accepted ? 'on' : ''} />
        <span className="text-[13px] leading-relaxed text-muted">
          <a href="/shartlar" className="text-primary hover:underline">
            Foydalanish shartlari
          </a>{' '}
          va{' '}
          <a href="/maxfiylik" className="text-primary hover:underline">
            maxfiylik siyosati
          </a>
          ga roziman
        </span>
      </label>
      {state.fieldErrors?.acceptTerms ? (
        <p className="text-[13px] text-danger">{state.fieldErrors.acceptTerms[0]}</p>
      ) : null}

      <Button type="submit" block size="lg" loading={pending} disabled={!accepted}>
        <UserPlus /> Roʻyxatdan oʻtish
      </Button>
    </form>
  )
}
