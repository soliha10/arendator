'use client'

import * as React from 'react'
import { useMessages, useRouter } from '@/i18n/client'
import { Check, X } from 'lucide-react'
import { toast } from 'sonner'
import { resolvePromotionAction } from '@/server/actions/promotions'
import { Button } from '@/components/ui/button'

export function ResolveButtons({ requestId }: { requestId: string }) {
  const router = useRouter()
  const m = useMessages().admin.common
  const [pending, startTransition] = React.useTransition()

  const run = (approve: boolean) =>
    startTransition(async () => {
      const res = await resolvePromotionAction(requestId, approve)
      if (res.status === 'error') toast.error(res.message ?? m.error)
      else {
        toast.success(res.message ?? m.done)
        router.refresh()
      }
    })

  return (
    <div className="flex gap-2">
      <Button size="sm" onClick={() => run(true)} loading={pending}>
        <Check /> {m.approve}
      </Button>
      <Button size="sm" variant="outline" onClick={() => run(false)} disabled={pending}>
        <X /> {m.reject}
      </Button>
    </div>
  )
}
