'use client'

import { Link, useMessages } from '@/i18n/client'
import { fmt } from '@/i18n/format'
import { cn } from '@/lib/utils'
import { SITE } from '@/lib/site'

export function Logo({ className, compact = false }: { className?: string; compact?: boolean }) {
  const t = useMessages().common.site
  return (
    <Link
      href="/"
      className={cn('group inline-flex shrink-0 items-center gap-2.5', className)}
      aria-label={fmt(t.homeAria, { name: SITE.name })}
    >
      <span className="relative flex size-9 shrink-0 items-center justify-center rounded-[10px] bg-gradient-to-br from-primary to-[#0284c7] text-white shadow-sm">
        <svg viewBox="0 0 24 24" className="size-5" fill="none" aria-hidden>
          <path
            d="M3 13.5 4.6 9a3 3 0 0 1 2.8-2h9.2a3 3 0 0 1 2.8 2L21 13.5V18a1 1 0 0 1-1 1h-1.5a1 1 0 0 1-1-1v-1h-11v1a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1z"
            stroke="currentColor"
            strokeWidth="1.7"
            strokeLinejoin="round"
          />
          <circle cx="7.5" cy="14.5" r="1.1" fill="currentColor" />
          <circle cx="16.5" cy="14.5" r="1.1" fill="currentColor" />
        </svg>
      </span>
      {!compact ? (
        <span className="flex flex-col leading-none">
          <span className="font-display whitespace-nowrap text-[18px] font-extrabold tracking-tight text-primary">
            {SITE.name}
          </span>
          <span className="mt-0.5 whitespace-nowrap text-[11px] font-medium text-muted">
            {t.tagline}
          </span>
        </span>
      ) : null}
    </Link>
  )
}
