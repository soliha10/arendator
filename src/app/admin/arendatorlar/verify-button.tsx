'use client'

import * as React from 'react'
import { useRouter } from 'next/navigation'
import { ShieldCheck, ShieldX } from 'lucide-react'
import { toast } from 'sonner'
import { toggleProfileVerificationAction } from '@/server/actions/admin'
import { Button } from '@/components/ui/button'

export function VerifyButton({
  profileId,
  isVerified,
}: {
  profileId: string
  isVerified: boolean
}) {
  const router = useRouter()
  const [pending, startTransition] = React.useTransition()

  const toggle = () =>
    startTransition(async () => {
      const result = await toggleProfileVerificationAction(profileId)
      if (result.status === 'error') toast.error(result.message ?? 'Xatolik')
      else {
        toast.success(result.message ?? 'Bajarildi')
        router.refresh()
      }
    })

  return (
    <Button
      size="sm"
      variant={isVerified ? 'outline' : 'primary'}
      loading={pending}
      onClick={toggle}
    >
      {isVerified ? (
        <>
          <ShieldX /> Tasdiqni olib tashlash
        </>
      ) : (
        <>
          <ShieldCheck /> Tasdiqlash
        </>
      )}
    </Button>
  )
}
