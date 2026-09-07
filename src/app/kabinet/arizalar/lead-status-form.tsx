'use client'

import * as React from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import type { LeadStatus } from '@prisma/client'
import { updateLeadStatusAction } from '@/server/actions/leads'
import { LEAD_STATUS_LABELS } from '@/lib/constants'
import { Select } from '@/components/ui/input'

export function LeadStatusForm({
  leadId,
  status,
}: {
  leadId: string
  status: LeadStatus
}) {
  const router = useRouter()
  const [value, setValue] = React.useState<LeadStatus>(status)
  const [pending, startTransition] = React.useTransition()

  const change = (next: LeadStatus) => {
    const previous = value
    setValue(next)
    startTransition(async () => {
      const formData = new FormData()
      formData.set('leadId', leadId)
      formData.set('status', next)
      const result = await updateLeadStatusAction({ status: 'idle' }, formData)
      if (result.status === 'error') {
        setValue(previous)
        toast.error(result.message ?? 'Xatolik')
      } else {
        toast.success(result.message ?? 'Yangilandi')
        router.refresh()
      }
    })
  }

  return (
    <Select
      value={value}
      onChange={(e) => change(e.target.value as LeadStatus)}
      disabled={pending}
      aria-label="Ariza holati"
      className="h-9 w-40 text-[13px]"
    >
      {Object.entries(LEAD_STATUS_LABELS).map(([v, label]) => (
        <option key={v} value={v}>
          {label}
        </option>
      ))}
    </Select>
  )
}
