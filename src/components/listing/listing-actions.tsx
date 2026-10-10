'use client'

import * as React from 'react'
import { useRouter } from 'next/navigation'
import { Check, Heart, Scale } from 'lucide-react'
import { toast } from 'sonner'
import { toggleFavoriteAction } from '@/server/actions/favorites'
import { useCompare, type CompareItem } from '@/lib/compare-store'
import { MAX_COMPARE_ITEMS } from '@/lib/constants'
import { cn } from '@/lib/utils'

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
  const active = isReady && has(item.id)

  const onClick = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (!active && isFull) {
      toast.error(`Taqqoslashga koʻpi bilan ${MAX_COMPARE_ITEMS} ta avtomobil qoʻshiladi`)
      return
    }
    toggle(item)
    toast.success(active ? 'Taqqoslashdan olib tashlandi' : 'Taqqoslashga qoʻshildi')
  }

  return (
    <button
      type="button"
      onClick={onClick}
      title={active ? 'Taqqoslashdan olib tashlash' : 'Taqqoslashga qoʻshish'}
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
      {withLabel ? <span>{active ? 'Taqqoslashda' : 'Taqqoslash'}</span> : null}
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
        toast.error('Saqlash uchun tizimga kiring')
        router.push('/kirish?next=' + encodeURIComponent(window.location.pathname))
        return
      }
      if (!result.ok) {
        setFavorited(!optimistic)
        toast.error(result.error ?? 'Xatolik yuz berdi')
        return
      }
      setFavorited(result.favorited ?? optimistic)
      toast.success(result.favorited ? 'Saqlanganlarga qoʻshildi' : 'Saqlanganlardan olib tashlandi')
    })
  }

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={pending}
      title={favorited ? 'Saqlanganlardan olib tashlash' : 'Saqlash'}
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
      {withLabel ? <span>{favorited ? 'Saqlangan' : 'Saqlash'}</span> : null}
    </button>
  )
}
