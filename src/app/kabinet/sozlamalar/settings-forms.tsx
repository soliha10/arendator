'use client'

import * as React from 'react'
import { AlertCircle, Building2, CheckCircle2, KeyRound, Save, User } from 'lucide-react'
import { toast } from 'sonner'
import { changePasswordAction } from '@/server/actions/auth'
import { saveArendatorProfileAction, updateProfileAction } from '@/server/actions/profile'
import { idleState, type ActionState } from '@/server/actions/types'
import { Button } from '@/components/ui/button'
import { Input, Textarea, Select } from '@/components/ui/input'
import { Field } from '@/components/ui/field'
import { Card, CardBody, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

function StatusBanner({ state }: { state: ActionState }) {
  if (state.status === 'idle' || !state.message) return null
  const error = state.status === 'error'
  return (
    <div
      role="alert"
      className={
        error
          ? 'mb-4 flex items-start gap-2.5 rounded-xl border border-danger/25 bg-danger-soft px-4 py-3 text-[13px] text-danger'
          : 'mb-4 flex items-start gap-2.5 rounded-xl border border-success/25 bg-success-soft px-4 py-3 text-[13px] text-success'
      }
    >
      {error ? (
        <AlertCircle className="mt-0.5 size-4 shrink-0" />
      ) : (
        <CheckCircle2 className="mt-0.5 size-4 shrink-0" />
      )}
      {state.message}
    </div>
  )
}

export function ProfileForm({
  fullName,
  email,
  phone,
}: {
  fullName: string
  email: string
  phone: string
}) {
  const [state, formAction, pending] = React.useActionState(updateProfileAction, idleState)

  React.useEffect(() => {
    if (state.status === 'success') toast.success(state.message ?? 'Saqlandi')
  }, [state])

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <User className="size-[18px] text-primary" /> Shaxsiy maʼlumotlar
        </CardTitle>
        <CardDescription>Ismingiz eʼlonlarda va arizalarda koʻrinadi</CardDescription>
      </CardHeader>
      <CardBody>
        <StatusBanner state={state} />
        <form action={formAction} className="space-y-4">
          <Field label="Ism-familiya" required error={state.fieldErrors?.fullName}>
            <Input
              name="fullName"
              defaultValue={fullName}
              required
              invalid={!!state.fieldErrors?.fullName}
            />
          </Field>

          <Field label="Email" error={state.fieldErrors?.email} hint="Ixtiyoriy">
            <Input
              name="email"
              type="email"
              defaultValue={email}
              invalid={!!state.fieldErrors?.email}
            />
          </Field>

          <Field label="Telefon raqami" hint="Raqamni oʻzgartirish uchun qoʻllab-quvvatlashga murojaat qiling">
            <Input value={phone} disabled className="tabular" />
          </Field>

          <Button type="submit" loading={pending}>
            <Save /> Saqlash
          </Button>
        </form>
      </CardBody>
    </Card>
  )
}

export interface ArendatorProfileData {
  companyName: string
  legalName: string
  inn: string
  about: string
  address: string
  regionId: string
  website: string
  telegram: string
  instagram: string
  workingHours: string
}

export function ArendatorProfileForm({
  profile,
  regions,
  isNew,
}: {
  profile: ArendatorProfileData
  regions: { id: string; name: string }[]
  isNew: boolean
}) {
  const [state, formAction, pending] = React.useActionState(
    saveArendatorProfileAction,
    idleState,
  )

  React.useEffect(() => {
    if (state.status === 'success') toast.success(state.message ?? 'Saqlandi')
  }, [state])

  return (
    <Card id="arendator">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Building2 className="size-[18px] text-primary" />
          {isNew ? 'Arendator boʻlish' : 'Kompaniya maʼlumotlari'}
        </CardTitle>
        <CardDescription>
          {isNew
            ? 'Maʼlumotlarni toʻldiring — shundan soʻng eʼlon joylash imkoniyati ochiladi'
            : 'Bu maʼlumotlar sizning ommaviy sahifangizda koʻrinadi'}
        </CardDescription>
      </CardHeader>
      <CardBody>
        <StatusBanner state={state} />
        <form action={formAction} className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field
              label="Kompaniya / nom"
              required
              error={state.fieldErrors?.companyName}
              className="sm:col-span-2"
            >
              <Input
                name="companyName"
                defaultValue={profile.companyName}
                placeholder="Avto Kredit Servis"
                required
                invalid={!!state.fieldErrors?.companyName}
              />
            </Field>

            <Field label="Yuridik nomi" error={state.fieldErrors?.legalName}>
              <Input
                name="legalName"
                defaultValue={profile.legalName}
                placeholder='"Avto Kredit Servis" MChJ'
              />
            </Field>

            <Field label="STIR" error={state.fieldErrors?.inn} hint="9 ta raqam">
              <Input
                name="inn"
                defaultValue={profile.inn}
                inputMode="numeric"
                maxLength={9}
                className="tabular"
                invalid={!!state.fieldErrors?.inn}
              />
            </Field>

            <Field label="Viloyat">
              <Select name="regionId" defaultValue={profile.regionId}>
                <option value="">Tanlang…</option>
                {regions.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.name}
                  </option>
                ))}
              </Select>
            </Field>

            <Field label="Manzil" error={state.fieldErrors?.address}>
              <Input
                name="address"
                defaultValue={profile.address}
                placeholder="Toshkent, Amir Temur koʻchasi 15"
              />
            </Field>

            <Field label="Ish vaqti">
              <Input
                name="workingHours"
                defaultValue={profile.workingHours}
                placeholder="Dush–Shan 09:00–19:00"
              />
            </Field>

            <Field label="Veb-sayt" error={state.fieldErrors?.website}>
              <Input
                name="website"
                defaultValue={profile.website}
                placeholder="https://example.uz"
                invalid={!!state.fieldErrors?.website}
              />
            </Field>

            <Field label="Telegram">
              <Input name="telegram" defaultValue={profile.telegram} placeholder="username" />
            </Field>

            <Field label="Instagram">
              <Input name="instagram" defaultValue={profile.instagram} placeholder="username" />
            </Field>
          </div>

          <Field
            label="Kompaniya haqida"
            error={state.fieldErrors?.about}
            hint="Tajriba, shartlar, afzalliklaringiz"
          >
            <Textarea
              name="about"
              defaultValue={profile.about}
              rows={5}
              maxLength={2000}
              placeholder="2016-yildan beri avtomobillarni rassrochkaga beramiz…"
            />
          </Field>

          <Button type="submit" loading={pending}>
            <Save /> {isNew ? 'Arendator boʻlish' : 'Saqlash'}
          </Button>
        </form>
      </CardBody>
    </Card>
  )
}

export function PasswordForm() {
  const [state, formAction, pending] = React.useActionState(changePasswordAction, idleState)
  const formRef = React.useRef<HTMLFormElement>(null)

  React.useEffect(() => {
    if (state.status === 'success') {
      toast.success(state.message ?? 'Parol yangilandi')
      formRef.current?.reset()
    }
  }, [state])

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <KeyRound className="size-[18px] text-primary" /> Parolni oʻzgartirish
        </CardTitle>
        <CardDescription>
          Parol oʻzgargach barcha boshqa qurilmalardagi sessiyalar bekor qilinadi
        </CardDescription>
      </CardHeader>
      <CardBody>
        <StatusBanner state={state} />
        <form ref={formRef} action={formAction} className="space-y-4">
          <Field label="Joriy parol" required error={state.fieldErrors?.currentPassword}>
            <Input
              name="currentPassword"
              type="password"
              autoComplete="current-password"
              required
              invalid={!!state.fieldErrors?.currentPassword}
            />
          </Field>

          <div className="grid gap-4 sm:grid-cols-2">
            <Field
              label="Yangi parol"
              required
              error={state.fieldErrors?.newPassword}
              hint="Kamida 8 ta belgi"
            >
              <Input
                name="newPassword"
                type="password"
                autoComplete="new-password"
                required
                invalid={!!state.fieldErrors?.newPassword}
              />
            </Field>

            <Field label="Tasdiqlang" required error={state.fieldErrors?.confirmPassword}>
              <Input
                name="confirmPassword"
                type="password"
                autoComplete="new-password"
                required
                invalid={!!state.fieldErrors?.confirmPassword}
              />
            </Field>
          </div>

          <Button type="submit" loading={pending}>
            <KeyRound /> Parolni yangilash
          </Button>
        </form>
      </CardBody>
    </Card>
  )
}
