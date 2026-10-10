'use client'

import * as React from 'react'
import { usePathname, useSearchParams } from 'next/navigation'
import { BellPlus, BellRing } from 'lucide-react'
import { toast } from 'sonner'
import { saveSearchAction } from '@/server/actions/saved-searches'
import { cn } from '@/lib/utils'
import { useMessages, useRouter, useValidationText } from '@/i18n/client'
import { splitLocale } from '@/i18n/config'

/**
 * Joriy filtrlarni saqlaydi — mos yangi e'lon chiqsa bildirishnoma keladi.
 * Kirmagan foydalanuvchi kirish sahifasiga, keyin shu qidiruvga qaytadi.
 */
export function SaveSearchButton({
  name,
  disabled,
  className,
}: {
  /** Server tomonda filtrlardan tuzilgan odamga tushunarli nom */
  name: string
  disabled?: boolean
  className?: string
}) {
  const router = useRouter()
  const t = useMessages().catalog.save
  const tv = useValidationText()
  const pathname = splitLocale(usePathname()).path
  const searchParams = useSearchParams()
  const [saved, setSaved] = React.useState<string | null>(null)
  const [pending, startTransition] = React.useTransition()

  const query = searchParams.toString()
  const isSaved = saved === query

  const onClick = () => {
    if (disabled) {
      toast.info(t.needFilter)
      return
    }
    startTransition(async () => {
      const res = await saveSearchAction({ name, query })
      if (res.status === 'success') {
        setSaved(query)
        toast.success(tv(res.message) ?? t.success)
        return
      }
      if (res.data?.requiresAuth) {
        const next = `${pathname}${query ? `?${query}` : ''}`
        router.push(`/kirish?next=${encodeURIComponent(next)}`)
        return
      }
      toast.error(tv(res.message) ?? t.failed)
    })
  }

  const Icon = isSaved ? BellRing : BellPlus

  return (
    <button
      type="button"
      onClick={onClick}
      aria-busy={pending}
      className={cn(
        'inline-flex h-11 items-center justify-center gap-2 whitespace-nowrap rounded-lg border px-4 text-[13px] font-semibold transition-colors lg:h-10',
        isSaved
          ? 'border-success/30 bg-success-soft text-success'
          : 'border-border bg-surface text-text hover:bg-surface-2',
        pending && 'opacity-70',
        className,
      )}
    >
      <Icon className="size-4" aria-hidden />
      {isSaved ? t.saved : t.button}
    </button>
  )
}
