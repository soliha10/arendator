'use client'

import * as React from 'react'
import { useLocale, useMessages, useRouter } from '@/i18n/client'
import { fmt } from '@/i18n/format'
import { Clock, Crown, Rocket } from 'lucide-react'
import { toast } from 'sonner'
import type { PromotionTier } from '@prisma/client'
import { requestPromotionAction } from '@/server/actions/promotions'
import { PROMOTION_PLANS } from '@/lib/constants'
import { formatMoney } from '@/lib/format'
import {
  Dropdown, DropdownContent, DropdownItem, DropdownLabel, DropdownTrigger,
} from '@/components/ui/dropdown'
import { cn } from '@/lib/utils'

/**
 * VIP / TOP so'rovi. To'lov tizimi ulanmagan — so'rov admin'ga boradi,
 * shuning uchun "kutilmoqda" holati alohida ko'rsatiladi.
 */
export function PromoteButton({
  listingId,
  canPromote,
  activeTier,
  daysLeft,
  pendingTier,
}: {
  listingId: string
  canPromote: boolean
  activeTier: PromotionTier
  daysLeft: number | null
  pendingTier: PromotionTier | null
}) {
  const router = useRouter()
  const locale = useLocale()
  const m = useMessages()
  const t = m.cabinet.promote
  const [pending, startTransition] = React.useTransition()

  if (pendingTier) {
    return (
      <span className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-warning-soft px-3 text-[13px] font-semibold text-warning">
        <Clock className="size-4" aria-hidden /> {fmt(t.pending, { tier: pendingTier })}
      </span>
    )
  }

  const request = (tier: 'VIP' | 'TOP') =>
    startTransition(async () => {
      const res = await requestPromotionAction(listingId, tier)
      if (res.status === 'error') toast.error(res.message ?? m.cabinet.common.error)
      else {
        toast.success(res.message ?? t.sent)
        router.refresh()
      }
    })

  return (
    <Dropdown>
      <DropdownTrigger asChild>
        <button
          type="button"
          disabled={!canPromote || pending}
          title={canPromote ? undefined : t.onlyActive}
          className={cn(
            'inline-flex h-9 items-center gap-1.5 rounded-lg px-3 text-[13px] font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-50',
            activeTier !== 'NONE'
              ? 'bg-primary-soft text-primary hover:brightness-95'
              : 'bg-primary text-primary-fg hover:bg-primary-hover',
          )}
        >
          {activeTier !== 'NONE' ? <Crown className="size-4" aria-hidden /> : <Rocket className="size-4" aria-hidden />}
          {activeTier !== 'NONE'
            ? daysLeft !== null
              ? fmt(t.activeDays, { tier: activeTier, n: daysLeft })
              : fmt(t.active, { tier: activeTier })
            : t.boost}
        </button>
      </DropdownTrigger>
      <DropdownContent>
        <DropdownLabel>{activeTier !== 'NONE' ? t.extend : t.promote}</DropdownLabel>
        {PROMOTION_PLANS.map((p) => (
          <DropdownItem key={p.tier} onSelect={() => request(p.tier)}>
            <span className="flex flex-col">
              <span className="font-semibold text-text">
                {fmt(t.option, {
                  title: m.enums.promotion[p.tier].title,
                  days: p.days,
                  price: formatMoney(p.priceUzs, 'UZS', { locale }),
                })}
              </span>
              <span className="text-[12px] text-muted">{m.enums.promotion[p.tier].hint}</span>
            </span>
          </DropdownItem>
        ))}
      </DropdownContent>
    </Dropdown>
  )
}
