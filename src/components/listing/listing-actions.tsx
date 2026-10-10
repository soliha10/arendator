'use client'

import * as React from 'react'
import { Check, Heart, Scale } from 'lucide-react'
import { toast } from 'sonner'
import { toggleFavoriteAction } from '@/server/actions/favorites'
import { useCompare, type CompareItem } from '@/lib/compare-store'
import { MAX_COMPARE_ITEMS } from '@/lib/constants'
import { cn } from '@/lib/utils'
import { useMessages, useRouter } from '@/i18n/client'
import { fmt } from '@/i18n/format'

export function CompareButton({
  item,
  className,
  withLabel = false,
}: {
  item: CompareItem
  className?: string
  withLabel?: boolean
}) {
  const { has, toggle, isFull, isReady } = useCompare()
  const t = useMessages().common.compare
  const active = isReady && has(item.id)

  const onClick = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (!active && isFull) {
      toast.error(fmt(t.full, { max: MAX_COMPARE_ITEMS }))
      return
    }
    toggle(item)
    toast.success(active ? t.removed : t.added)
  }

  return (
    <button
      type="button"
      onClick={onClick}
      title={active ? t.remove : t.add}
      aria-label={active ? t.remove : t.add}
      aria-pressed={active}
      className={cn(
        'inline-flex items-center justify-center gap-2 rounded-[10px] border transition-colors',
        withLabel ? 'h-11 px-4 text-sm font-medium' : 'size-10',
        active
          ? 'border-primary bg-primary text-primary-fg'
          : 'border-border bg-surface/90 text-muted backdrop-blur hover:text-text',
        className,
      )}
    >
      {active ? <Check className="size-[18px]" /> : <Scale className="size-[18px]" />}
      {withLabel ? <span>{active ? t.inCompare : t.label}</span> : null}
    </button>
  )
}

export function FavoriteButton({
  listingId,
  initialFavorited = false,
  className,
  withLabel = false,
}: {
  listingId: string
  initialFavorited?: boolean
  className?: string
  withLabel?: boolean
}) {
  const router = useRouter()
  const t = useMessages().common.favorite
  const [favorited, setFavorited] = React.useState(initialFavorited)
  const [syncedInitial, setSyncedInitial] = React.useState(initialFavorited)
  const [pending, startTransition] = React.useTransition()

  // Serverdan yangi qiymat kelsa (masalan sahifa yangilangach) moslaymiz
  if (initialFavorited !== syncedInitial) {
    setSyncedInitial(initialFavorited)
    setFavorited(initialFavorited)
  }

  const onClick = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    const optimistic = !favorited
    setFavorited(optimistic) // optimistik yangilanish

    startTransition(async () => {
      const result = await toggleFavoriteAction(listingId)
      if (result.requiresAuth) {
        setFavorited(!optimistic)
        toast.error(t.loginRequired)
        router.push('/kirish?next=' + encodeURIComponent(window.location.pathname))
        return
      }
      if (!result.ok) {
        setFavorited(!optimistic)
        toast.error(t.error)
        return
      }
      setFavorited(result.favorited ?? optimistic)
      toast.success(result.favorited ? t.added : t.removed)
    })
  }

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={pending}
      title={favorited ? t.remove : t.add}
      aria-label={favorited ? t.remove : t.add}
      aria-pressed={favorited}
      className={cn(
        'inline-flex items-center justify-center gap-2 rounded-[10px] border transition-colors disabled:opacity-60',
        withLabel ? 'h-11 px-4 text-sm font-medium' : 'size-10',
        favorited
          ? 'border-danger/30 bg-danger-soft text-danger'
          : 'border-border bg-surface/90 text-muted backdrop-blur hover:text-text',
        className,
      )}
    >
      <Heart className={cn('size-[18px]', favorited && 'fill-current')} />
      {withLabel ? <span>{favorited ? t.saved : t.add}</span> : null}
    </button>
  )
}
