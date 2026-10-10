'use client'

import * as React from 'react'
import { Phone } from 'lucide-react'
import { toast } from 'sonner'
import { revealPhoneAction } from '@/server/actions/listings'
import { formatPhone } from '@/lib/format'
import { track } from '@/lib/analytics'
import { cn } from '@/lib/utils'
import { useMessages } from '@/i18n/client'

/**
 * Raqam sahifa HTML'ida turmaydi — bosilganda serverdan olinadi
 * (botlardan himoya) va e'lon egasining statistikasiga yoziladi.
 * Telefonda darhol qo'ng'iroq oynasi ochiladi, kompyuterda raqam ko'rsatiladi.
 */
export function CallButton({
  listingId,
  className,
  label,
  variant = 'soft',
}: {
  listingId: string
  className?: string
  label?: string
  variant?: 'soft' | 'primary' | 'outline'
}) {
  const t = useMessages().common.call
  const [phone, setPhone] = React.useState<string | null>(null)
  const [pending, startTransition] = React.useTransition()

  const onClick = (e: React.MouseEvent) => {
    if (phone) return // <a href="tel:"> o'zi ishlaydi
    e.preventDefault()
    startTransition(async () => {
      const res = await revealPhoneAction(listingId)
      if (!res.ok || !res.phone) {
        toast.error(t.error)
        return
      }
      setPhone(res.phone)
      track('phone_reveal', { listing_id: listingId })
      if (window.matchMedia('(pointer: coarse)').matches) {
        window.location.href = `tel:${res.phone}`
      }
    })
  }

  return (
    <a
      href={phone ? `tel:${phone}` : '#'}
      onClick={onClick}
      aria-busy={pending}
      className={cn(
        'inline-flex h-10 items-center justify-center gap-1.5 whitespace-nowrap rounded-lg px-3 text-[13px] font-semibold transition-colors',
        variant === 'primary' && 'bg-primary text-primary-fg hover:bg-primary-hover',
        variant === 'soft' && 'bg-primary-soft text-primary hover:brightness-95',
        variant === 'outline' && 'border border-border-strong bg-surface text-text hover:bg-surface-2',
        pending && 'opacity-70',
        className,
      )}
    >
      <Phone className="size-4 shrink-0" aria-hidden />
      <span className="tabular truncate">{phone ? formatPhone(phone) : (label ?? t.call)}</span>
    </a>
  )
}
