import type { Metadata } from 'next'
import Image from 'next/image'
import Link from 'next/link'
import { Inbox, MessageSquare, Phone } from 'lucide-react'
import { requireUser } from '@/lib/auth/guards'
import { prisma } from '@/lib/prisma'
import { LEAD_STATUS_LABELS } from '@/lib/constants'
import { formatMoney, formatPhone, formatRelative } from '@/lib/format'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { EmptyState } from '@/components/ui/empty'
import { LeadStatusForm } from './lead-status-form'

export const metadata: Metadata = { title: 'Arizalar' }

export default async function LeadsPage() {
  const user = await requireUser('/kabinet/arizalar')
  const isArendator = user.role !== 'USER'

  const leads = await prisma.lead.findMany({
    where: isArendator
      ? { listing: { ownerId: user.id } }
      : { userId: user.id },
    orderBy: [{ status: 'asc' }, { createdAt: 'desc' }],
    select: {
      id: true, fullName: true, phone: true, message: true,
      status: true, createdAt: true, ownerNote: true,
      listing: {
        select: {
          slug: true, title: true,
          images: { where: { isCover: true }, take: 1, select: { url: true } },
        },
      },
      plan: {
        select: {
          name: true, monthlyPayment: true, downPayment: true,
          termMonths: true, currency: true,
        },
      },
    },
  })

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-bold tracking-tight text-text sm:text-2xl">
          {isArendator ? 'Kelgan arizalar' : 'Mening arizalarim'}
        </h1>
        <p className="mt-1.5 text-sm text-muted">
          {isArendator
            ? 'Mijozlar eʼlonlaringiz boʻyicha qoldirgan murojaatlar'
            : 'Siz yuborgan murojaatlar va ularning holati'}
        </p>
      </div>

      {leads.length > 0 ? (
        <ul className="space-y-3">
          {leads.map((lead) => (
            <li key={lead.id} className="card p-4">
              <div className="flex flex-col gap-4 sm:flex-row">
                <Link
                  href={`/elon/${lead.listing.slug}`}
                  className="relative aspect-[16/10] w-full shrink-0 overflow-hidden rounded-lg bg-surface-2 sm:w-32"
                >
                  {lead.listing.images[0] ? (
                    <Image
                      src={lead.listing.images[0].url}
                      alt={lead.listing.title}
                      fill
                      sizes="128px"
                      className="object-cover"
                    />
                  ) : null}
                </Link>

                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="min-w-0">
                      <Link
                        href={`/elon/${lead.listing.slug}`}
                        className="line-clamp-1x text-[15px] font-semibold text-text hover:text-primary"
                      >
                        {lead.listing.title}
                      </Link>
                      {lead.plan ? (
                        <p className="tabular mt-1 text-[13px] text-muted">
                          {lead.plan.name} ·{' '}
                          {formatMoney(Number(lead.plan.monthlyPayment), lead.plan.currency, {
                            compact: true,
                          })}
                          /oy · boshlangʻich{' '}
                          {formatMoney(Number(lead.plan.downPayment), lead.plan.currency, {
                            compact: true,
                          })}
                        </p>
                      ) : null}
                    </div>

                    {isArendator ? (
                      <LeadStatusForm leadId={lead.id} status={lead.status} />
                    ) : (
                      <Badge
                        variant={
                          lead.status === 'APPROVED'
                            ? 'success'
                            : lead.status === 'REJECTED'
                              ? 'danger'
                              : lead.status === 'CONTACTED'
                                ? 'primary'
                                : 'warning'
                        }
                      >
                        {LEAD_STATUS_LABELS[lead.status]}
                      </Badge>
                    )}
                  </div>

                  {isArendator ? (
                    <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1.5 rounded-lg bg-surface-2 px-3 py-2.5">
                      <span className="text-[13px] font-medium text-text">
                        {lead.fullName}
                      </span>
                      <a
                        href={`tel:${lead.phone}`}
                        className="tabular inline-flex items-center gap-1.5 text-[13px] text-primary hover:underline"
                      >
                        <Phone className="size-3.5" /> {formatPhone(lead.phone)}
                      </a>
                    </div>
                  ) : null}

                  {lead.message ? (
                    <p className="mt-2.5 flex gap-2 text-[13px] leading-relaxed text-muted">
                      <MessageSquare className="mt-0.5 size-3.5 shrink-0 text-subtle" />
                      {lead.message}
                    </p>
                  ) : null}

                  {lead.ownerNote ? (
                    <p className="mt-2 rounded-lg bg-primary-soft px-3 py-2 text-[13px] text-primary">
                      Arendator izohi: {lead.ownerNote}
                    </p>
                  ) : null}

                  <p className="mt-2.5 text-[12px] text-subtle">
                    {formatRelative(lead.createdAt)}
                  </p>
                </div>
              </div>
            </li>
          ))}
        </ul>
      ) : (
        <EmptyState
          icon={<Inbox />}
          title={isArendator ? 'Hali ariza kelmagan' : 'Hali ariza yubormagansiz'}
          description={
            isArendator
              ? 'Eʼlonlaringiz koʻrilgach, mijozlar shu yerda murojaat qoldiradi.'
              : 'Yoqqan avtomobil boʻyicha arendatorga ariza qoldiring.'
          }
          action={
            <Button asChild>
              <Link href={isArendator ? '/kabinet/elon/yangi' : '/elonlar'}>
                {isArendator ? 'Eʼlon joylash' : 'Eʼlonlarni koʻrish'}
              </Link>
            </Button>
          }
        />
      )}
    </div>
  )
}
