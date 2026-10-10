import type { Metadata } from 'next'
import Image from 'next/image'
import { Inbox, MessageSquare, Phone, StickyNote } from 'lucide-react'
import type { LeadStatus, Prisma } from '@prisma/client'
import { requireUser } from '@/lib/auth/guards'
import { prisma } from '@/lib/prisma'
import { formatMoney, formatPhone, formatRelative } from '@/lib/format'
import { Button } from '@/components/ui/button'
import { EmptyState } from '@/components/ui/empty'
import { LEAD_STATUS_TONE, initials } from '@/components/cabinet/lead-mini-card'
import { cn } from '@/lib/utils'
import { LeadStatusForm } from './lead-status-form'
import { Link } from '@/i18n/client'
import { getLocale, getMessages } from '@/i18n/server'
import { fmt } from '@/i18n/format'
import { regionLabel } from '@/i18n/labels'

export async function generateMetadata(): Promise<Metadata> {
  return { title: (await getMessages()).cabinet.meta.leads }
}

const STATUSES: LeadStatus[] = ['NEW', 'CONTACTED', 'APPROVED', 'REJECTED', 'CANCELLED']

export default async function LeadsPage(props: PageProps<'/[lang]/kabinet/arizalar'>) {
  const user = await requireUser('/kabinet/arizalar')
  const seller = user.role !== 'USER'
  const [m, locale] = await Promise.all([getMessages(), getLocale()])
  const t = m.cabinet.leads
  const c = m.cabinet.common
  const sp = await props.searchParams
  const status = STATUSES.find((s) => s === sp.status) ?? null

  const base: Prisma.LeadWhereInput = seller ? { listing: { ownerId: user.id } } : { userId: user.id }

  const [leads, counts] = await Promise.all([
    prisma.lead.findMany({
      where: { ...base, ...(status ? { status } : {}) },
      orderBy: [{ status: 'asc' }, { createdAt: 'desc' }],
      take: 100,
      select: {
        id: true, fullName: true, phone: true, message: true,
        status: true, createdAt: true, ownerNote: true,
        listing: {
          select: {
            slug: true, title: true,
            region: { select: { name: true, slug: true } },
            images: { orderBy: [{ isCover: 'desc' }, { position: 'asc' }], take: 1, select: { url: true } },
          },
        },
        plan: {
          select: {
            name: true, planType: true, monthlyPayment: true, downPayment: true,
            carPrice: true, termMonths: true, currency: true,
          },
        },
      },
    }),
    prisma.lead.groupBy({ by: ['status'], where: base, _count: true }),
  ])

  const countBy = Object.fromEntries(counts.map((c) => [c.status, c._count])) as Partial<Record<LeadStatus, number>>
  const total = counts.reduce((s, c) => s + c._count, 0)

  return (
    <div className="space-y-4">
      <div>
        <h1 className="font-display text-xl font-extrabold text-text sm:text-2xl">
          {seller ? t.sellerTitle : t.buyerTitle}
        </h1>
        <p className="mt-1 text-sm text-muted">
          {seller
            ? t.sellerHint
            : t.buyerHint}
        </p>
      </div>

      <div className="hide-scrollbar -mx-1 flex gap-1.5 overflow-x-auto px-1">
        {[null, ...STATUSES].map((s) => {
          const count = s ? (countBy[s] ?? 0) : total
          if (s && count === 0 && s !== status) return null
          const active = s === status
          return (
            <Link
              key={s ?? 'all'}
              href={s ? `/kabinet/arizalar?status=${s}` : '/kabinet/arizalar'}
              className={cn(
                'inline-flex h-9 shrink-0 items-center gap-1.5 rounded-full px-4 text-[13px] font-semibold transition-colors',
                active ? 'bg-primary text-primary-fg' : 'border border-border bg-surface text-text hover:bg-surface-2',
              )}
            >
              {s ? m.enums.leadStatus[s] : c.all}
              <span className="tabular opacity-75">({count})</span>
            </Link>
          )
        })}
      </div>

      {leads.length > 0 ? (
        <ul className="grid gap-3 xl:grid-cols-2">
          {leads.map((lead) => {
            const p = lead.plan
            const pct = p && Number(p.carPrice) > 0 ? Math.round((Number(p.downPayment) / Number(p.carPrice)) * 100) : null
            return (
              <li
                key={lead.id}
                className={cn(
                  'flex flex-col rounded-xl border border-border bg-surface p-4',
                  lead.status === 'NEW' && 'border-l-4 border-l-primary',
                )}
              >
                <div className="flex items-start gap-3">
                  {seller ? (
                    <span className="flex size-11 shrink-0 items-center justify-center rounded-full bg-primary-soft text-[14px] font-bold text-primary">
                      {initials(lead.fullName)}
                    </span>
                  ) : (
                    <Link href={`/elon/${lead.listing.slug}`} className="relative aspect-[4/3] w-20 shrink-0 overflow-hidden rounded-lg bg-surface-2">
                      {lead.listing.images[0] ? (
                        <Image src={lead.listing.images[0].url} alt={lead.listing.title} fill sizes="80px" className="object-cover" />
                      ) : null}
                    </Link>
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[15px] font-bold text-text">
                      {seller ? lead.fullName : lead.listing.title}
                    </p>
                    <p className="text-[12px] text-subtle">
                      {formatRelative(lead.createdAt, locale)} • {regionLabel(m, lead.listing.region.slug, lead.listing.region.name)}
                    </p>
                  </div>
                  {seller ? (
                    <LeadStatusForm leadId={lead.id} status={lead.status} />
                  ) : (
                    <span className={cn('shrink-0 rounded-md px-2 py-0.5 text-[12px] font-semibold', LEAD_STATUS_TONE[lead.status])}>
                      {m.enums.leadStatus[lead.status]}
                    </span>
                  )}
                </div>

                <div className="mt-3 rounded-lg bg-surface-2 px-3 py-2.5">
                  {seller ? (
                    <>
                      <p className="text-[11px] font-medium text-subtle">{c.selectedCar}</p>
                      <Link href={`/elon/${lead.listing.slug}`} className="line-clamp-1x text-[14px] font-semibold text-primary hover:underline">
                        {lead.listing.title}
                      </Link>
                    </>
                  ) : null}
                  {p ? (
                    <p className="tabular mt-1 flex flex-wrap justify-between gap-x-3 gap-y-1 text-[12px] text-muted">
                      <span>{p.name}</span>
                      <span>
                        {fmt(c.downPayment, {
                          pct: pct !== null ? `${pct}% ` : '',
                          amount: formatMoney(Number(p.downPayment), p.currency, { compact: true, locale }),
                        })}
                      </span>
                      <span className="font-semibold text-text">
                        {fmt(c.perMonth, { amount: formatMoney(Number(p.monthlyPayment), p.currency, { compact: true, locale }) })}
                        {' · '}
                        {fmt(c.months, { n: p.termMonths })}
                      </span>
                    </p>
                  ) : (
                    <p className="text-[12px] text-muted">{t.general}</p>
                  )}
                </div>

                {lead.message ? (
                  <p className="mt-2.5 flex gap-2 text-[13px] leading-relaxed text-muted">
                    <MessageSquare className="mt-0.5 size-3.5 shrink-0 text-subtle" aria-hidden />
                    {lead.message}
                  </p>
                ) : null}
                {lead.ownerNote ? (
                  <p className="mt-2 flex gap-2 rounded-lg bg-primary-soft px-3 py-2 text-[13px] text-primary">
                    <StickyNote className="mt-0.5 size-3.5 shrink-0" aria-hidden />
                    {seller ? t.yourNote : t.dealerNote}: {lead.ownerNote}
                  </p>
                ) : null}

                {seller ? (
                  <div className="mt-auto pt-3">
                    <a
                      href={`tel:${lead.phone}`}
                      className={cn(
                        'tabular inline-flex h-10 w-full items-center justify-center gap-2 rounded-lg text-[14px] font-semibold transition-colors',
                        lead.status === 'NEW'
                          ? 'bg-primary text-primary-fg hover:bg-primary-hover'
                          : 'bg-primary-soft text-primary hover:brightness-95',
                      )}
                    >
                      <Phone className="size-4" aria-hidden /> {formatPhone(lead.phone)}
                    </a>
                  </div>
                ) : null}
              </li>
            )
          })}
        </ul>
      ) : (
        <EmptyState
          icon={<Inbox />}
          title={status ? t.emptyStatus : seller ? t.emptySeller : t.emptyBuyer}
          description={seller ? t.emptySellerHint : t.emptyBuyerHint}
          action={
            <Button asChild>
              <Link href={seller ? '/kabinet/elon/yangi' : '/elonlar'}>
                {seller ? c.postAd : c.browseCars}
              </Link>
            </Button>
          }
        />
      )}
    </div>
  )
}
