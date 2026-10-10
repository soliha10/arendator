import { Eye, Phone } from 'lucide-react'
import type { Currency, LeadStatus } from '@prisma/client'
import { formatMoney, formatRelative } from '@/lib/format'
import { cn } from '@/lib/utils'
import { Link } from '@/i18n/client'
import { getLocale, getMessages } from '@/i18n/server'
import { fmt } from '@/i18n/format'

export interface LeadMini {
  id: string
  fullName: string
  phone: string
  status: LeadStatus
  createdAt: Date
  listing: { title: string; slug: string }
  plan: {
    downPayment: unknown
    carPrice: unknown
    termMonths: number
    currency: Currency
  } | null
}

export const LEAD_STATUS_TONE: Record<LeadStatus, string> = {
  NEW: 'bg-primary text-primary-fg',
  CONTACTED: 'bg-surface-3 text-muted',
  APPROVED: 'bg-success-soft text-success',
  REJECTED: 'bg-danger-soft text-danger',
  CANCELLED: 'bg-surface-3 text-subtle',
}

export function initials(name: string) {
  return name
    .split(' ')
    .slice(0, 2)
    .map((w) => w[0])
    .join('')
    .toUpperCase()
}

/** Dizayndagi o'ng panel kartasi: xaridor, tanlangan mashina, shart va bog'lanish */
export async function LeadMiniCard({ lead, className }: { lead: LeadMini; className?: string }) {
  const [m, locale] = await Promise.all([getMessages(), getLocale()])
  const c = m.cabinet.common
  const t = m.cabinet.leadCard
  const down = lead.plan ? Number(lead.plan.downPayment) : null
  const price = lead.plan ? Number(lead.plan.carPrice) : null
  const pct = down !== null && price ? Math.round((down / price) * 100) : null
  const isNew = lead.status === 'NEW'

  return (
    <article
      className={cn(
        'rounded-xl border border-border bg-surface p-4',
        isNew && 'border-l-4 border-l-primary',
        className,
      )}
    >
      <div className="flex items-start gap-3">
        <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-primary-soft text-[13px] font-bold text-primary">
          {initials(lead.fullName)}
        </span>
        <div className="min-w-0 flex-1">
          <p className="truncate text-[15px] font-semibold text-text">{lead.fullName}</p>
          <p className="text-[12px] text-subtle">{formatRelative(lead.createdAt, locale)}</p>
        </div>
        <span
          className={cn(
            'shrink-0 rounded-md px-2 py-0.5 text-[11px] font-semibold',
            LEAD_STATUS_TONE[lead.status],
          )}
        >
          {m.enums.leadStatus[lead.status]}
        </span>
      </div>

      <div className="mt-3 rounded-lg bg-surface-2 px-3 py-2.5">
        <p className="text-[11px] font-medium text-subtle">{c.selectedCar}</p>
        <Link
          href={`/elon/${lead.listing.slug}`}
          className="line-clamp-1x text-[13px] font-semibold text-primary hover:underline"
        >
          {lead.listing.title}
        </Link>
        {lead.plan ? (
          <p className="tabular mt-1.5 flex justify-between gap-2 text-[12px] text-muted">
            <span>
              {fmt(c.downPayment, {
                pct: pct !== null ? `${pct}% ` : '',
                amount: formatMoney(down, lead.plan.currency, { compact: true, locale }),
              })}
            </span>
            <span>{fmt(c.term, { n: lead.plan.termMonths })}</span>
          </p>
        ) : null}
      </div>

      <div className="mt-3 flex gap-2">
        <a
          href={`tel:${lead.phone}`}
          className={cn(
            'inline-flex h-9 flex-1 items-center justify-center gap-1.5 rounded-lg text-[13px] font-semibold transition-colors',
            isNew
              ? 'bg-primary text-primary-fg hover:bg-primary-hover'
              : 'bg-primary-soft text-primary hover:brightness-95',
          )}
        >
          <Phone className="size-4" aria-hidden /> {isNew ? t.contact : t.callAgain}
        </a>
        <Link
          href="/kabinet/arizalar"
          aria-label={t.view}
          className="inline-flex size-9 items-center justify-center rounded-lg border border-border text-muted transition-colors hover:bg-surface-2 hover:text-text"
        >
          <Eye className="size-4" aria-hidden />
        </Link>
      </div>
    </article>
  )
}

export const LEAD_MINI_SELECT = {
  id: true,
  fullName: true,
  phone: true,
  status: true,
  createdAt: true,
  listing: { select: { title: true, slug: true } },
  plan: { select: { downPayment: true, carPrice: true, termMonths: true, currency: true } },
} as const
