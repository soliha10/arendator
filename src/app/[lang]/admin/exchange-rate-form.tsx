'use client'

import * as React from 'react'
import { Save } from 'lucide-react'
import { toast } from 'sonner'
import { updateExchangeRateAction } from '@/server/actions/admin'
import { idleState } from '@/server/actions/types'
import { Input } from '@/components/ui/input'
import { Field } from '@/components/ui/field'
import { Button } from '@/components/ui/button'
import { useMessages, useValidationText } from '@/i18n/client'

export function ExchangeRateForm({ current }: { current: number }) {
  const [state, formAction, pending] = React.useActionState(
    updateExchangeRateAction,
    idleState,
  )
  const m = useMessages().admin
  const tv = useValidationText()

  React.useEffect(() => {
    if (state.status === 'success') toast.success(state.message ?? m.common.saved)
    if (state.status === 'error') toast.error(tv(state.message) ?? m.common.error)
  }, [state, m, tv])

  return (
    <form action={formAction} className="flex flex-wrap items-end gap-3">
      <Field
        label={m.dashboard.rateLabel}
        error={tv(state.fieldErrors?.usdRate?.[0])}
        hint={m.dashboard.rateHint}
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
        <Save /> {m.common.save}
      </Button>
    </form>
  )
}
