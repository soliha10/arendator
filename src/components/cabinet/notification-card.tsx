'use client'

import * as React from 'react'
import Image from 'next/image'
import { Link, useLocale, useMessages, useRouter } from '@/i18n/client'
import { fmt } from '@/i18n/format'
import type { Messages } from '@/i18n/messages'
import {
  BarChart3, Check, ClipboardCheck, Search, ShieldCheck, Trash2, TrendingDown,
  UserRound, type LucideIcon,
} from 'lucide-react'
import { toast } from 'sonner'
import type { NotificationType } from '@prisma/client'
import {
  deleteNotificationAction, markNotificationReadAction,
} from '@/server/actions/notifications'
import { formatMoney, formatPhone, formatRelative } from '@/lib/format'
import { cn } from '@/lib/utils'

type CtaKey = keyof Messages['cabinet']['notifications']['cta']

const TYPE_STYLE: Record<NotificationType, { icon: LucideIcon; tile: string; bar: string; cta: CtaKey }> = {
  PRICE_DROP: { icon: TrendingDown, tile: 'bg-success-soft text-success', bar: 'before:bg-success', cta: 'viewListing' },
  SAVED_SEARCH: { icon: Search, tile: 'bg-primary-soft text-primary', bar: 'before:bg-primary', cta: 'viewListing' },
  LEAD_NEW: { icon: UserRound, tile: 'bg-primary-soft text-primary', bar: 'before:bg-primary', cta: 'toLeads' },
  LEAD_STATUS: { icon: ShieldCheck, tile: 'bg-primary-soft text-primary', bar: 'before:bg-primary', cta: 'viewListing' },
  LISTING_STATUS: { icon: ClipboardCheck, tile: 'bg-warning-soft text-warning', bar: 'before:bg-warning', cta: 'open' },
  SYSTEM: { icon: BarChart3, tile: 'bg-surface-3 text-muted', bar: 'before:bg-border-strong', cta: 'open' },
}

/**
 * Shablondagi {kalit} joylariga React elementlarini qo'yadi —
 * tarjimada so'z tartibi har xil bo'lsa ham bezak (chizilgan narx) saqlanadi.
 */
function richFmt(template: string, parts: Record<string, React.ReactNode>): React.ReactNode[] {
  return template.split(/(\{\w+\})/g).map((chunk, i) => {
    const key = chunk.match(/^\{(\w+)\}$/)?.[1]
    return key && key in parts ? <React.Fragment key={i}>{parts[key]}</React.Fragment> : chunk
  })
}

export interface NotificationView {
  id: string
  type: NotificationType
  title: string
  body: string
  link: string | null
  readAt: string | null
  createdAt: string
  data: Record<string, unknown> | null
  listing: { title: string; slug: string; imageUrl: string | null; region: string } | null
}

const num = (v: unknown) => (typeof v === 'number' && Number.isFinite(v) ? v : null)
const str = (v: unknown) => (typeof v === 'string' ? v : null)

export function NotificationCard({ n }: { n: NotificationView }) {
  const router = useRouter()
  const locale = useLocale()
  const m = useMessages()
  const t = m.cabinet.notifications
  const money = (v: number) => formatMoney(v, 'UZS', { locale })
  const [read, setRead] = React.useState(Boolean(n.readAt))
  const [removed, setRemoved] = React.useState(false)
  const [pending, startTransition] = React.useTransition()
  const style = TYPE_STYLE[n.type]

  const markRead = () => {
    if (read) return
    setRead(true)
    startTransition(async () => {
      const res = await markNotificationReadAction(n.id)
      if (res.status === 'error') setRead(false)
      router.refresh()
    })
  }

  const remove = () =>
    startTransition(async () => {
      setRemoved(true)
      const res = await deleteNotificationAction(n.id)
      if (res.status === 'error') {
        setRemoved(false)
        toast.error(res.message ?? m.cabinet.common.error)
      } else router.refresh()
    })

  if (removed) return null

  const oldPrice = num(n.data?.oldPriceUzs)
  const newPrice = num(n.data?.newPriceUzs)
  const newMonthly = num(n.data?.newMonthlyUzs)
  const phone = str(n.data?.phone)

  return (
    <article
      onClick={markRead}
      className={cn(
        'relative overflow-hidden rounded-xl border border-border bg-surface p-4 pl-5 transition-colors sm:p-5 sm:pl-6',
        'before:absolute before:inset-y-0 before:left-0 before:w-1',
        read ? 'before:bg-transparent' : style.bar,
        pending && 'opacity-80',
      )}
    >
      <div className="flex gap-3 sm:gap-4">
        <span className={cn('flex size-11 shrink-0 items-center justify-center rounded-xl', style.tile)}>
          <style.icon className="size-5" aria-hidden />
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-3">
            <h3 className={cn('text-[16px] leading-snug text-text', read ? 'font-semibold' : 'font-bold')}>
              {n.title}
              {oldPrice !== null && newPrice !== null && oldPrice > newPrice ? (
                <span className="tabular ml-2 inline-block rounded-md bg-success-soft px-1.5 py-0.5 align-middle text-[11px] font-bold text-success">
                  −{formatMoney(oldPrice - newPrice, 'UZS', { compact: true, locale })}
                </span>
              ) : null}
            </h3>
            <span className="flex shrink-0 items-center gap-2 text-[12px] text-subtle">
              {formatRelative(n.createdAt, locale)}
              {!read ? <span className="size-2 rounded-full bg-primary" aria-label={t.unreadAria} /> : null}
            </span>
          </div>

          <p className="mt-1 text-[14px] leading-relaxed text-muted">
            {oldPrice !== null && newPrice !== null && n.listing ? (
              <>
                {richFmt(t.priceDropBody, {
                  listing: <strong className="text-text">{n.listing.title}</strong>,
                  old: <span className="tabular text-subtle line-through">{money(oldPrice)}</span>,
                  new: <strong className="tabular text-success">{money(newPrice)}</strong>,
                })}
                {newMonthly ? (
                  <>
                    {' '}
                    {richFmt(t.newMonthly, {
                      amount: (
                        <strong className="tabular text-primary">
                          {fmt(m.cabinet.common.perMonth, { amount: money(newMonthly) })}
                        </strong>
                      ),
                    })}
                  </>
                ) : null}
              </>
            ) : (
              n.body
            )}
          </p>

          {n.listing && (n.type === 'PRICE_DROP' || n.type === 'SAVED_SEARCH') ? (
            <div className="mt-3 flex flex-col gap-3 rounded-lg bg-surface-2 p-3 sm:flex-row sm:items-center">
              <span className="relative h-12 w-16 shrink-0 overflow-hidden rounded-md bg-surface-3">
                {n.listing.imageUrl ? (
                  <Image src={n.listing.imageUrl} alt="" fill sizes="64px" className="object-cover" />
                ) : null}
              </span>
              <span className="min-w-0 flex-1">
                <span className="line-clamp-1x text-[13px] font-semibold text-text">{n.listing.title}</span>
                <span className="text-[12px] text-muted">{n.listing.region}</span>
              </span>
            </div>
          ) : null}

          {phone && n.type === 'LEAD_NEW' ? (
            <p className="tabular mt-2 text-[12px] text-success">{fmt(t.phone, { phone: formatPhone(phone) })}</p>
          ) : null}

          <div className="mt-3 flex flex-wrap items-center gap-2">
            {n.link ? (
              <Link
                href={n.link}
                onClick={markRead}
                className="inline-flex h-9 items-center rounded-lg bg-primary px-3.5 text-[13px] font-semibold text-primary-fg hover:bg-primary-hover"
              >
                {t.cta[style.cta]}
              </Link>
            ) : null}
            {phone && n.type === 'LEAD_NEW' ? (
              <a
                href={`tel:${phone}`}
                className="inline-flex h-9 items-center rounded-lg bg-primary-soft px-3.5 text-[13px] font-semibold text-primary hover:brightness-95"
              >
                {t.call}
              </a>
            ) : null}
            {n.type === 'PRICE_DROP' && n.listing ? (
              <Link
                href={`/elon/${n.listing.slug}#tolov`}
                onClick={markRead}
                className="inline-flex h-9 items-center rounded-lg bg-primary-soft px-3.5 text-[13px] font-semibold text-primary hover:brightness-95"
              >
                {t.calcPayment}
              </Link>
            ) : null}
            <span className="ml-auto flex gap-1">
              {!read ? (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation()
                    markRead()
                  }}
                  aria-label={t.markRead}
                  title={t.markRead}
                  className="rounded-lg p-2 text-subtle hover:bg-surface-2 hover:text-text"
                >
                  <Check className="size-4" />
                </button>
              ) : null}
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation()
                  remove()
                }}
                aria-label={t.delete}
                title={t.deleteShort}
                className="rounded-lg p-2 text-subtle hover:bg-danger-soft hover:text-danger"
              >
                <Trash2 className="size-4" />
              </button>
            </span>
          </div>
        </div>
      </div>
    </article>
  )
}
