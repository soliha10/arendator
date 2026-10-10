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
import { useMessages, useValidationText } from '@/i18n/client'

/** Server qaytargan maydon xatosini joriy tilda (birinchisi) */
function useFieldError(state: ActionState) {
  const tv = useValidationText()
  return (key: string) => tv(state.fieldErrors?.[key]?.[0])
}

function StatusBanner({ state }: { state: ActionState }) {
  const tv = useValidationText()
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
      {tv(state.message)}
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
  const m = useMessages()
  const t = m.cabinet.settings
  const err = useFieldError(state)

  React.useEffect(() => {
    if (state.status === 'success') toast.success(state.message ?? m.cabinet.common.saved)
  }, [state, m])

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <User className="size-4.5 text-primary" /> {t.personal}
        </CardTitle>
        <CardDescription>{t.personalHint}</CardDescription>
      </CardHeader>
      <CardBody>
        <StatusBanner state={state} />
        <form action={formAction} className="space-y-4">
          <Field label={t.fullName} required error={err('fullName')}>
            <Input
              name="fullName"
              defaultValue={fullName}
              required
              invalid={!!state.fieldErrors?.fullName}
            />
          </Field>

          <Field label={t.email} error={err('email')} hint={t.optional}>
            <Input
              name="email"
              type="email"
              defaultValue={email}
              invalid={!!state.fieldErrors?.email}
            />
          </Field>

          <Field label={t.phone} hint={t.phoneHint}>
            <Input value={phone} disabled className="tabular" />
          </Field>

          <Button type="submit" loading={pending}>
            <Save /> {t.save}
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
  regions: { id: string; name: string; slug?: string }[]
  isNew: boolean
}) {
  const [state, formAction, pending] = React.useActionState(
    saveArendatorProfileAction,
    idleState,
  )
  const m = useMessages()
  const t = m.cabinet.settings
  const err = useFieldError(state)

  React.useEffect(() => {
    if (state.status === 'success') toast.success(state.message ?? m.cabinet.common.saved)
  }, [state, m])

  return (
    <Card id="arendator">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Building2 className="size-4.5 text-primary" />
          {isNew ? t.becomeDealer : t.company}
        </CardTitle>
        <CardDescription>
          {isNew
            ? t.becomeDealerHint
            : t.companyHint}
        </CardDescription>
      </CardHeader>
      <CardBody>
        <StatusBanner state={state} />
        <form action={formAction} className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field
              label={t.companyName}
              required
              error={err('companyName')}
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

            <Field label={t.legalName} error={err('legalName')}>
              <Input
                name="legalName"
                defaultValue={profile.legalName}
                placeholder={t.legalNamePlaceholder}
              />
            </Field>

            <Field label={t.inn} error={err('inn')} hint={t.innHint}>
              <Input
                name="inn"
                defaultValue={profile.inn}
                inputMode="numeric"
                maxLength={9}
                className="tabular"
                invalid={!!state.fieldErrors?.inn}
              />
            </Field>

            <Field label={t.region}>
              <Select name="regionId" defaultValue={profile.regionId}>
                <option value="">{t.choose}</option>
                {regions.map((r) => (
                  <option key={r.id} value={r.id}>
                    {(r.slug && m.enums.region[r.slug]) || r.name}
                  </option>
                ))}
              </Select>
            </Field>

            <Field label={t.address} error={err('address')}>
              <Input
                name="address"
                defaultValue={profile.address}
                placeholder={t.addressPlaceholder}
              />
            </Field>

            <Field label={t.hours}>
              <Input
                name="workingHours"
                defaultValue={profile.workingHours}
                placeholder={t.hoursPlaceholder}
              />
            </Field>

            <Field label={t.website} error={err('website')}>
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
            label={t.about}
            error={err('about')}
            hint={t.aboutHint}
          >
            <Textarea
              name="about"
              defaultValue={profile.about}
              rows={5}
              maxLength={2000}
              placeholder={t.aboutPlaceholder}
            />
          </Field>

          <Button type="submit" loading={pending}>
            <Save /> {isNew ? t.becomeDealer : t.save}
          </Button>
        </form>
      </CardBody>
    </Card>
  )
}

export function PasswordForm() {
  const [state, formAction, pending] = React.useActionState(changePasswordAction, idleState)
  const formRef = React.useRef<HTMLFormElement>(null)
  const t = useMessages().cabinet.settings
  const err = useFieldError(state)

  React.useEffect(() => {
    if (state.status === 'success') {
      toast.success(state.message ?? t.passwordUpdated)
      formRef.current?.reset()
    }
  }, [state, t])

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <KeyRound className="size-4.5 text-primary" /> {t.password}
        </CardTitle>
        <CardDescription>
          {t.passwordHint}
        </CardDescription>
      </CardHeader>
      <CardBody>
        <StatusBanner state={state} />
        <form ref={formRef} action={formAction} className="space-y-4">
          <Field label={t.currentPassword} required error={err('currentPassword')}>
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
              label={t.newPassword}
              required
              error={err('newPassword')}
              hint={t.newPasswordHint}
            >
              <Input
                name="newPassword"
                type="password"
                autoComplete="new-password"
                required
                invalid={!!state.fieldErrors?.newPassword}
              />
            </Field>

            <Field label={t.confirm} required error={err('confirmPassword')}>
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
            <KeyRound /> {t.updatePassword}
          </Button>
        </form>
      </CardBody>
    </Card>
  )
}
