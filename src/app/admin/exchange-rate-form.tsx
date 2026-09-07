'use client'

import * as React from 'react'
import { Save } from 'lucide-react'
import { toast } from 'sonner'
import { updateExchangeRateAction } from '@/server/actions/admin'
import { idleState } from '@/server/actions/types'
import { Input } from '@/components/ui/input'
import { Field } from '@/components/ui/field'
import { Button } from '@/components/ui/button'

export function ExchangeRateForm({ current }: { current: number }) {
  const [state, formAction, pending] = React.useActionState(
    updateExchangeRateAction,
    idleState,
  )

  React.useEffect(() => {
    if (state.status === 'success') toast.success(state.message ?? 'Saqlandi')
    if (state.status === 'error') toast.error(state.message ?? 'Xatolik')
  }, [state])

  return (
    <form action={formAction} className="flex flex-wrap items-end gap-3">
      <Field
        label="1 USD = ? soʻm"
        error={state.fieldErrors?.usdRate}
        hint="Dollardagi eʼlonlar shu kurs boʻyicha soʻmga oʻgiriladi"
        className="flex-1 min-w-48"
      >
        <Input
          name="usdRate"
          defaultValue={String(current)}
          inputMode="numeric"
          className="tabular"
        />
      </Field>
      <Button type="submit" loading={pending}>
        <Save /> Saqlash
      </Button>
    </form>
  )
}
