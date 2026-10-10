'use client'

import * as React from 'react'
import { useMessages, useRouter, useValidationText } from '@/i18n/client'
import { Check, X } from 'lucide-react'
import { toast } from 'sonner'
import { moderateListingAction } from '@/server/actions/admin'
import { idleState } from '@/server/actions/types'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent } from '@/components/ui/dialog'
import { Textarea } from '@/components/ui/input'
import { Field } from '@/components/ui/field'

export function ModerationActions({ listingId }: { listingId: string }) {
  const router = useRouter()
  const m = useMessages().admin
  const tv = useValidationText()
  const [pending, startTransition] = React.useTransition()
  const [rejectOpen, setRejectOpen] = React.useState(false)
  const [reason, setReason] = React.useState('')
  const [error, setError] = React.useState<string | null>(null)

  const submit = (action: 'approve' | 'reject') => {
    setError(null)
    startTransition(async () => {
      const formData = new FormData()
      formData.set('listingId', listingId)
      formData.set('action', action)
      if (action === 'reject') formData.set('reason', reason)

      const result = await moderateListingAction(idleState, formData)
      if (result.status === 'error') {
        setError(tv(result.message) ?? m.common.error)
        if (action === 'approve') toast.error(tv(result.message) ?? m.common.error)
        return
      }
      toast.success(result.message ?? m.common.done)
      setRejectOpen(false)
      setReason('')
      router.refresh()
    })
  }

  return (
    <>
      <div className="flex gap-2">
        <Button size="sm" loading={pending} onClick={() => submit('approve')}>
          <Check /> {m.common.approve}
        </Button>
        <Button
          size="sm"
          variant="outline"
          disabled={pending}
          onClick={() => setRejectOpen(true)}
        >
          <X /> {m.common.reject}
        </Button>
      </div>

      <Dialog open={rejectOpen} onOpenChange={setRejectOpen}>
        <DialogContent
          title={m.moderation.rejectTitle}
          description={m.moderation.rejectHint}
          size="sm"
        >
          <Field label={m.moderation.reason} required error={error}>
            <Textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={4}
              placeholder={m.moderation.reasonPlaceholder}
              autoFocus
            />
          </Field>
          <div className="mt-4 flex justify-end gap-2">
            <Button variant="outline" onClick={() => setRejectOpen(false)}>
              {m.common.cancel}
            </Button>
            <Button variant="danger" loading={pending} onClick={() => submit('reject')}>
              {m.common.reject}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
