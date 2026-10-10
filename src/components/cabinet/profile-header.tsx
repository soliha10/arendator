import Image from 'next/image'
import {
  CalendarDays, ExternalLink, Pencil, PlusCircle, ShieldCheck, Star, Store,
} from 'lucide-react'
import { initials } from './lead-mini-card'
import { Link } from '@/i18n/client'
import { getLocale, getMessages } from '@/i18n/server'
import { fmt, plural } from '@/i18n/format'
import type { Locale } from '@/i18n/config'
import type { Messages } from '@/i18n/messages'

function sinceLabel(createdAt: Date, t: Messages['cabinet']['profile'], locale: Locale) {
  const months = Math.max(
    0,
    (new Date().getFullYear() - createdAt.getFullYear()) * 12 +
      new Date().getMonth() -
      createdAt.getMonth(),
  )
  if (months < 1) return t.sinceThisMonth
  if (months < 12) return plural(locale, months, t.sinceMonths)
  return plural(locale, Math.floor(months / 12), t.sinceYears)
}

export interface ProfileHeaderData {
  fullName: string
  avatarUrl: string | null
  createdAt: Date
  accountType: 'INDIVIDUAL' | 'BUSINESS'
  role: 'USER' | 'ARENDATOR' | 'ADMIN'
  profile: {
    companyName: string
    slug: string
    logoUrl: string | null
    isVerified: boolean
    ratingAvg: number
    reviewCount: number
  } | null
}

/** Kabinet bosh kartasi: kim, qaysi kompaniya, ishonch ko'rsatkichlari */
export async function ProfileHeader({ user }: { user: ProfileHeaderData }) {
  const [m, locale] = await Promise.all([getMessages(), getLocale()])
  const t = m.cabinet.profile
  const image = user.profile?.logoUrl ?? user.avatarUrl
  const seller = user.role !== 'USER'
  const verified = user.profile?.isVerified ?? false

  return (
    <section className="flex flex-col gap-5 rounded-2xl border border-border bg-surface p-5 sm:p-6 lg:flex-row lg:items-center">
      <div className="flex min-w-0 flex-1 items-start gap-4 sm:gap-5">
        <div className="relative shrink-0">
          {image ? (
            <Image
              src={image}
              alt={user.fullName}
              width={96}
              height={96}
              className="size-16 rounded-xl object-cover sm:size-24"
            />
          ) : (
            <span className="font-display flex size-16 items-center justify-center rounded-xl bg-primary-soft text-xl font-extrabold text-primary sm:size-24 sm:text-3xl">
              {initials(user.fullName)}
            </span>
          )}
          {verified ? (
            <span className="absolute -bottom-1.5 -right-1.5 flex size-7 items-center justify-center rounded-full bg-success text-white ring-4 ring-surface">
              <ShieldCheck className="size-4" aria-label={t.verifiedAria} />
            </span>
          ) : null}
        </div>

        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="font-display truncate text-xl font-extrabold text-text sm:text-[28px]">
              {user.fullName}
            </h1>
            {verified ? (
              <span className="inline-flex items-center gap-1 rounded-full bg-success-soft px-2.5 py-0.5 text-[12px] font-semibold text-success">
                <ShieldCheck className="size-3.5" aria-hidden /> {t.dealerVerified}
              </span>
            ) : null}
          </div>

          <p className="mt-1.5 flex flex-wrap items-center gap-x-2 text-[14px] text-muted">
            {user.profile ? (
              <span className="inline-flex items-center gap-1.5 font-semibold text-text">
                <Store className="size-4 text-primary" aria-hidden /> {user.profile.companyName}
              </span>
            ) : null}
            <span>
              {user.accountType === 'BUSINESS'
                ? t.business
                : seller
                  ? t.individual
                  : t.buyer}
            </span>
          </p>

          <div className="mt-3 flex flex-wrap gap-2 text-[12px] text-muted">
            {user.profile && user.profile.reviewCount > 0 ? (
              <span className="inline-flex items-center gap-1 rounded-lg bg-surface-2 px-2.5 py-1">
                <Star className="size-3.5 fill-warning text-warning" aria-hidden />
                <strong className="tabular text-text">{user.profile.ratingAvg.toFixed(1)}</strong>
                {plural(locale, user.profile.reviewCount, t.reviews)}
              </span>
            ) : null}
            <span className="inline-flex items-center gap-1 rounded-lg bg-surface-2 px-2.5 py-1">
              <CalendarDays className="size-3.5" aria-hidden /> {fmt(t.onPlatform, { since: sinceLabel(user.createdAt, t, locale) })}
            </span>
          </div>
        </div>
      </div>

      <div className="flex flex-wrap gap-2 lg:flex-col lg:items-stretch">
        <Link
          href="/kabinet/elon/yangi"
          className="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-primary px-4 text-[14px] font-semibold text-primary-fg transition-colors hover:bg-primary-hover"
        >
          <PlusCircle className="size-4" aria-hidden /> {t.postAd}
        </Link>
        <div className="flex gap-2">
          <Link
            href="/kabinet/sozlamalar"
            className="inline-flex h-10 flex-1 items-center justify-center gap-2 rounded-lg bg-primary-soft px-4 text-[13px] font-semibold text-primary transition-colors hover:brightness-95"
          >
            <Pencil className="size-4" aria-hidden /> {t.edit}
          </Link>
          {user.profile ? (
            <Link
              href={`/arendator/${user.profile.slug}`}
              className="inline-flex h-10 flex-1 items-center justify-center gap-2 rounded-lg border border-border px-4 text-[13px] font-semibold text-text transition-colors hover:bg-surface-2"
            >
              <ExternalLink className="size-4" aria-hidden /> {t.myPage}
            </Link>
          ) : null}
        </div>
      </div>
    </section>
  )
}

export const PROFILE_HEADER_SELECT = {
  fullName: true,
  avatarUrl: true,
  createdAt: true,
  accountType: true,
  role: true,
  profile: {
    select: {
      companyName: true, slug: true, logoUrl: true, isVerified: true,
      ratingAvg: true, reviewCount: true,
    },
  },
} as const
