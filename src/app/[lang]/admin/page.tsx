import type { Metadata } from 'next'
import {
  Building2, CarFront, Crown, CreditCard, Inbox, ShieldAlert, Users,
} from 'lucide-react'
import { prisma } from '@/lib/prisma'
import { getRates } from '@/server/exchange'
import { formatDateLong, formatRelative } from '@/lib/format'
import { Card, CardBody, CardHeader, CardTitle } from '@/components/ui/card'
import { ExchangeRateForm } from './exchange-rate-form'
import { Link } from '@/i18n/client'
import { getLocale, getMessages } from '@/i18n/server'
import { fmt, plural } from '@/i18n/format'

export async function generateMetadata(): Promise<Metadata> {
  return { title: (await getMessages()).admin.meta.dashboard }
}

export default async function AdminDashboard() {
  const [m, locale] = await Promise.all([getMessages(), getLocale()])
  const t = m.admin.dashboard
  const [
    listings, pending, users, arendators, unverified, plans, leads, rates, audit, promos,
  ] = await Promise.all([
    prisma.listing.count({ where: { status: 'ACTIVE' } }),
    prisma.listing.count({ where: { status: 'PENDING' } }),
    prisma.user.count(),
    prisma.arendatorProfile.count(),
    prisma.arendatorProfile.count({ where: { isVerified: false } }),
    prisma.rentalPlan.count(),
    prisma.lead.count(),
    getRates(),
    prisma.auditLog.findMany({
      orderBy: { createdAt: 'desc' },
      take: 12,
      select: {
        id: true, action: true, entityType: true, createdAt: true,
        actor: { select: { fullName: true } },
      },
    }),
    prisma.promotionRequest.count({ where: { status: 'PENDING' } }),
  ])

  const stats = [
    { label: t.activeListings, value: listings, icon: CarFront, href: '/elonlar' },
    { label: t.pending, value: pending, icon: ShieldAlert, href: '/admin/moderatsiya', highlight: pending > 0 },
    { label: t.promotions, value: promos, icon: Crown, href: '/admin/reklama', highlight: promos > 0 },
    { label: t.users, value: users, icon: Users, href: '/admin/foydalanuvchilar' },
    { label: t.dealers, value: arendators, icon: Building2, href: '/admin/arendatorlar' },
    { label: t.plans, value: plans, icon: CreditCard },
    { label: t.leads, value: leads, icon: Inbox },
  ]

  return (
    <div className="space-y-5">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {stats.map((s) => {
          const inner = (
            <>
              <s.icon
                className={s.highlight ? 'size-5 text-warning' : 'size-5 text-primary'}
              />
              <p className="tabular mt-3 text-2xl font-bold text-text">{s.value}</p>
              <p className="mt-0.5 text-sm text-muted">{s.label}</p>
            </>
          )
          return s.href ? (
            <Link
              key={s.label}
              href={s.href}
              className={
                s.highlight
                  ? 'card border-warning/40 bg-warning-soft/40 p-5 transition-colors hover:border-warning'
                  : 'card p-5 transition-colors hover:border-primary'
              }
            >
              {inner}
            </Link>
          ) : (
            <div key={s.label} className="card p-5">
              {inner}
            </div>
          )
        })}
      </div>

      {unverified > 0 ? (
        <div className="rounded-xl border border-warning/30 bg-warning-soft px-4 py-3 text-[13px] text-warning">
          {plural(locale, unverified, t.unverified)}{' '}
          <Link href="/admin/arendatorlar" className="underline underline-offset-4">
            {t.review}
          </Link>
        </div>
      ) : null}

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>{t.rate}</CardTitle>
          </CardHeader>
          <CardBody>
            <ExchangeRateForm current={rates.USD} />
          </CardBody>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{t.recent}</CardTitle>
          </CardHeader>
          <CardBody>
            {audit.length > 0 ? (
              <ul className="divide-y divide-border">
                {audit.map((log) => (
                  <li key={log.id} className="flex items-center justify-between gap-3 py-2.5">
                    <div className="min-w-0">
                      <p className="text-[13px] font-medium text-text">{log.action}</p>
                      <p className="text-[12px] text-subtle">
                        {log.actor?.fullName ?? t.system} · {log.entityType}
                      </p>
                    </div>
                    <span className="shrink-0 text-[12px] text-subtle">
                      {formatRelative(log.createdAt, locale)}
                    </span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="py-4 text-center text-sm text-muted">
                {t.noActions}
              </p>
            )}
          </CardBody>
        </Card>
      </div>

      <p className="text-[12px] text-subtle">
        {fmt(t.reportDate, { date: formatDateLong(new Date(), locale) })}
      </p>
    </div>
  )
}
