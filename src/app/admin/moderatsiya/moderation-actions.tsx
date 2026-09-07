'use client'

import * as React from 'react'
import { useRouter } from 'next/navigation'
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
        setError(result.message ?? 'Xatolik')
        if (action === 'approve') toast.error(result.message ?? 'Xatolik')
        return
      }
      toast.success(result.message ?? 'Bajarildi')
      setRejectOpen(false)
      setReason('')
      router.refresh()
    })
  }

  return (
    <>
      <div className="flex gap-2">
        <Button size="sm" loading={pending} onClick={() => submit('approve')}>
          <Check /> Tasdiqlash
        </Button>
        <Button
          size="sm"
          variant="outline"
          disabled={pending}
          onClick={() => setRejectOpen(true)}
        >
          <X /> Rad etish
        </Button>
      </div>

      <Dialog open={rejectOpen} onOpenChange={setRejectOpen}>
        <DialogContent
          title="Eʼlonni rad etish"
          description="Sabab arendatorga koʻrsatiladi — u tuzatib qayta yuborishi mumkin."
          size="sm"
        >
          <Field label="Rad etish sababi" required error={error}>
            <Textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={4}
              placeholder="Masalan: rasmlar sifatsiz, toʻlov shartlari notoʻgʻri kiritilgan…"
              autoFocus
            />
          </Field>
          <div className="mt-4 flex justify-end gap-2">
            <Button variant="outline" onClick={() => setRejectOpen(false)}>
              Bekor qilish
            </Button>
            <Button variant="danger" loading={pending} onClick={() => submit('reject')}>
              Rad etish
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
