'use client'

import * as React from 'react'
import { useMessages, useRouter } from '@/i18n/client'
import { Ban, CircleCheck } from 'lucide-react'
import { toast } from 'sonner'
import { toggleUserBlockAction } from '@/server/actions/admin'
import { Button } from '@/components/ui/button'

export function BlockButton({
  userId,
  isBlocked,
  disabled,
}: {
  userId: string
  isBlocked: boolean
  disabled?: boolean
}) {
  const router = useRouter()
  const m = useMessages().admin
  const [pending, startTransition] = React.useTransition()

  const toggle = () =>
    startTransition(async () => {
      const result = await toggleUserBlockAction(userId)
      if (result.status === 'error') toast.error(result.message ?? m.common.error)
      else {
        toast.success(result.message ?? m.common.done)
        router.refresh()
      }
    })

  return (
    <Button
      size="sm"
      variant={isBlocked ? 'outline' : 'ghost'}
      loading={pending}
      disabled={disabled}
      onClick={toggle}
      className={isBlocked ? '' : 'text-danger'}
    >
      {isBlocked ? (
        <>
          <CircleCheck /> {m.users.unblock}
        </>
      ) : (
        <>
          <Ban /> {m.users.block}
        </>
      )}
    </Button>
  )
}
