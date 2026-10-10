'use client'

import { Share2 } from 'lucide-react'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import { useMessages } from '@/i18n/client'

/** Telefonda tizim "Ulashish" oynasi, kompyuterda — havolani nusxalash */
export function ShareButton({
  title,
  text,
  className,
  withLabel = false,
}: {
  title: string
  text?: string
  className?: string
  withLabel?: boolean
}) {
  const t = useMessages().listing.share
  const onClick = async () => {
    const url = window.location.href.split('#')[0]
    if (navigator.share) {
      try {
        await navigator.share({ title, text, url })
        return
      } catch (e) {
        // Foydalanuvchi oynani yopdi — xato emas
        if (e instanceof DOMException && e.name === 'AbortError') return
      }
    }
    try {
      await navigator.clipboard.writeText(url)
      toast.success(t.copied)
    } catch {
      toast.error(t.failed)
    }
  }

  return (
    <button
      type="button"
      onClick={onClick}
      title={t.label}
      aria-label={withLabel ? undefined : t.label}
      className={cn(
        'inline-flex items-center justify-center gap-2 rounded-[10px] border border-border bg-surface/90 text-muted transition-colors hover:text-text',
        withLabel ? 'h-11 px-4 text-sm font-medium' : 'size-10',
        className,
      )}
    >
      <Share2 className="size-[18px]" aria-hidden />
      {withLabel ? <span>{t.label}</span> : null}
    </button>
  )
}
