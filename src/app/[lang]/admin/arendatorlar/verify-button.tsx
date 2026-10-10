'use client'

import * as React from 'react'
import { useMessages, useRouter } from '@/i18n/client'
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
  const m = useMessages().admin
  const [pending, startTransition] = React.useTransition()

  const toggle = () =>
    startTransition(async () => {
      const result = await toggleProfileVerificationAction(profileId)
      if (result.status === 'error') toast.error(result.message ?? m.common.error)
      else {
        toast.success(result.message ?? m.common.done)
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
          <ShieldX /> {m.dealers.unverify}
        </>
      ) : (
        <>
          <ShieldCheck /> {m.dealers.verify}
        </>
      )}
    </Button>
  )
}
