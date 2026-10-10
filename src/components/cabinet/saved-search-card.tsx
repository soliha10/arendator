'use client'

import * as React from 'react'
import { Link, useMessages, useRouter } from '@/i18n/client'
import { fmt } from '@/i18n/format'
import { BellRing, ExternalLink, Mail, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import type { SearchAlertFrequency } from '@prisma/client'
import {
  deleteSavedSearchAction, toggleSavedSearchNotifyAction,
} from '@/server/actions/saved-searches'
import { Switch } from '@/components/ui/checkbox'
import { cn } from '@/lib/utils'

export function SavedSearchCard({
  id,
  name,
  query,
  chips,
  notify,
  frequency,
}: {
  id: string
  name: string
  query: string
  chips: string[]
  notify: boolean
  frequency: SearchAlertFrequency
}) {
  const router = useRouter()
  const m = useMessages()
  const t = m.cabinet.savedSearch
  const c = m.cabinet.common
  const FREQUENCY = t.frequency
  const [on, setOn] = React.useState(notify)
  const [pending, startTransition] = React.useTransition()

  const toggle = (next: boolean) => {
    setOn(next)
    startTransition(async () => {
      const res = await toggleSavedSearchNotifyAction(id, next)
      if (res.status === 'error') {
        setOn(!next)
        toast.error(res.message ?? c.error)
      } else toast.success(res.message ?? c.saved)
    })
  }

  const remove = () =>
    startTransition(async () => {
      const res = await deleteSavedSearchAction(id)
      if (res.status === 'error') toast.error(res.message ?? c.error)
      else {
        toast.success(res.message ?? c.deleted)
        router.refresh()
      }
    })

  return (
    <article className={cn('flex flex-col rounded-xl border border-border bg-surface p-4 sm:p-5', pending && 'opacity-70')}>
      <div className="flex items-start justify-between gap-3">
        <h3 className="flex min-w-0 items-center gap-2 text-[16px] font-bold text-text">
          <span className={cn('size-2.5 shrink-0 rounded-full', on ? 'bg-success' : 'bg-border-strong')} aria-hidden />
          <span className="truncate">{name}</span>
        </h3>
        <button
          type="button"
          onClick={remove}
          disabled={pending}
          aria-label={fmt(t.deleteAria, { name })}
          className="rounded-lg p-1.5 text-subtle transition-colors hover:bg-danger-soft hover:text-danger"
        >
          <Trash2 className="size-4" />
        </button>
      </div>

      <div className="mb-4 mt-3 flex flex-wrap gap-1.5">
        {chips.length > 0 ? (
          chips.map((c) => (
            <span key={c} className="rounded-md bg-surface-2 px-2 py-1 text-[12px] font-medium text-text">
              {c}
            </span>
          ))
        ) : (
          <span className="text-[12px] text-subtle">{t.allListings}</span>
        )}
      </div>

      <div className="mt-auto flex items-center justify-between gap-3 border-t border-border pt-3.5">
        <span className="flex min-w-0 items-start gap-2.5">
          {frequency === 'INSTANT' ? (
            <BellRing className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden />
          ) : (
            <Mail className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden />
          )}
          <span className="min-w-0">
            <span className="block text-[13px] font-semibold text-text">{FREQUENCY[frequency].title}</span>
            <span className="block text-[12px] text-muted">{FREQUENCY[frequency].hint}</span>
          </span>
        </span>
        <span className="flex shrink-0 items-center gap-3">
          <Link
            href={`/elonlar?${query}`}
            className="inline-flex items-center gap-1 text-[13px] font-semibold text-primary hover:underline"
          >
            {t.open} <ExternalLink className="size-3.5" aria-hidden />
          </Link>
          <Switch
            checked={on}
            onCheckedChange={toggle}
            disabled={pending}
            aria-label={on ? t.notifyOff : t.notifyOn}
          />
        </span>
      </div>
    </article>
  )
}
