'use client'

import * as React from 'react'
import { useRouter } from 'next/navigation'
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
  const [pending, startTransition] = React.useTransition()

  const toggle = () =>
    startTransition(async () => {
      const result = await toggleUserBlockAction(userId)
      if (result.status === 'error') toast.error(result.message ?? 'Xatolik')
      else {
        toast.success(result.message ?? 'Bajarildi')
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
          <CircleCheck /> Blokni yechish
        </>
      ) : (
        <>
          <Ban /> Bloklash
        </>
      )}
    </Button>
  )
}
