import * as React from 'react'
import { cn } from '@/lib/utils'

/** Formadagi raqamlangan bo'lim kartasi */
export function SectionCard({
  id,
  index,
  title,
  subtitle,
  action,
  className,
  children,
}: {
  id: string
  index?: number
  title: React.ReactNode
  subtitle?: React.ReactNode
  action?: React.ReactNode
  className?: string
  children: React.ReactNode
}) {
  return (
    <section
      id={id}
      className={cn('scroll-offset rounded-xl border border-border bg-surface p-4 sm:p-6', className)}
    >
      <div className="mb-5 flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h2 className="font-display text-[18px] font-bold text-text sm:text-[20px]">
            {index !== undefined ? `${index}. ` : null}
            {title}
          </h2>
          {subtitle ? <p className="mt-1 text-[13px] text-muted">{subtitle}</p> : null}
        </div>
        {action ? <div className="shrink-0">{action}</div> : null}
      </div>
      {children}
    </section>
  )
}

/** Tanlanadigan kichik chip (muddat, foiz, marka) */
export function Chip({
  active,
  onClick,
  children,
  className,
  disabled,
}: {
  active: boolean
  onClick: () => void
  children: React.ReactNode
  className?: string
  disabled?: boolean
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-pressed={active}
      className={cn(
        'tabular inline-flex h-9 items-center justify-center rounded-lg px-3.5 text-[13px] font-semibold transition-colors disabled:opacity-50',
        active
          ? 'bg-primary text-primary-fg shadow-sm'
          : 'bg-surface-2 text-text hover:bg-surface-3',
        className,
      )}
    >
      {children}
    </button>
  )
}
