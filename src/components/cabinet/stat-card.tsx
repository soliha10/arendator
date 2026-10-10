import { Link } from '@/i18n/client'
import type { LucideIcon } from 'lucide-react'
import { cn } from '@/lib/utils'

/** Kabinet statistikasi: raqam, izoh va ikona — dizayndagi oq karta */
export function StatCard({
  label,
  value,
  suffix,
  hint,
  badge,
  icon: Icon,
  href,
  hintTone = 'success',
}: {
  label: string
  value: string | number
  suffix?: string
  hint?: string
  badge?: string
  icon: LucideIcon
  href?: string
  hintTone?: 'success' | 'primary' | 'muted'
}) {
  const body = (
    <>
      <div className="min-w-0">
        <p className="text-[13px] font-medium text-muted">{label}</p>
        <p className="mt-2 flex flex-wrap items-baseline gap-x-1.5 gap-y-1">
          <span className="font-display tabular whitespace-nowrap text-[24px] font-extrabold leading-none text-text sm:text-[28px]">
            {value}
          </span>
          {suffix ? <span className="text-[13px] text-subtle">{suffix}</span> : null}
          {badge ? (
            <span className="rounded-md bg-danger px-1.5 py-0.5 text-[11px] font-bold text-white">
              {badge}
            </span>
          ) : null}
        </p>
        {hint ? (
          <p
            className={cn(
              'mt-2.5 text-[12px]',
              hintTone === 'success' && 'text-success',
              hintTone === 'primary' && 'text-primary',
              hintTone === 'muted' && 'text-subtle',
            )}
          >
            {hint}
          </p>
        ) : null}
      </div>
      <span className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-primary-soft text-primary">
        <Icon className="size-5" aria-hidden />
      </span>
    </>
  )

  const cls = 'flex items-start justify-between gap-3 rounded-xl border border-border bg-surface p-4 sm:p-5'
  return href ? (
    <Link href={href} className={cn(cls, 'transition-colors hover:border-primary')}>
      {body}
    </Link>
  ) : (
    <div className={cls}>{body}</div>
  )
}
