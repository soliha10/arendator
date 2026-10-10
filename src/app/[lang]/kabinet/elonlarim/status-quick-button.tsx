'use client'

import * as React from 'react'
import { useMessages, useRouter } from '@/i18n/client'
import { Pause, Play } from 'lucide-react'
import { toast } from 'sonner'
import type { ListingStatus } from '@prisma/client'
import { changeListingStatusAction } from '@/server/actions/listings'

/** Kartadagi "Deaktivatsiya" / "Faollashtirish" — eng ko'p ishlatiladigan amal */
export function StatusQuickButton({ listingId, status }: { listingId: string; status: ListingStatus }) {
  const router = useRouter()
  const m = useMessages().cabinet
  const [pending, startTransition] = React.useTransition()

  const action =
    status === 'ACTIVE' ? 'pause' : status === 'PAUSED' || status === 'RENTED' ? 'activate' : null
  if (!action) return null

  const run = () =>
    startTransition(async () => {
      const res = await changeListingStatusAction(listingId, action)
      if (res.status === 'error') toast.error(res.message ?? m.common.error)
      else {
        toast.success(res.message ?? m.common.done)
        router.refresh()
      }
    })

  return (
    <button
      type="button"
      onClick={run}
      disabled={pending}
      className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-surface-2 px-3 text-[13px] font-semibold text-muted transition-colors hover:bg-surface-3 hover:text-text disabled:opacity-50"
    >
      {action === 'pause' ? <Pause className="size-4" aria-hidden /> : <Play className="size-4" aria-hidden />}
      {action === 'pause' ? m.rowActions.deactivate : m.rowActions.activate}
    </button>
  )
}
