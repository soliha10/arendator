'use client'

import * as React from 'react'
import { useMessages, useRouter } from '@/i18n/client'
import { CheckCheck, Mail, MessageSquareText, Send } from 'lucide-react'
import { toast } from 'sonner'
import {
  markAllNotificationsReadAction, updateNotificationPrefAction,
} from '@/server/actions/notifications'
import type { NotificationPrefs } from '@/server/notifications'
import { Switch } from '@/components/ui/checkbox'

export function MarkAllReadButton({ disabled }: { disabled: boolean }) {
  const router = useRouter()
  const m = useMessages().cabinet
  const [pending, startTransition] = React.useTransition()
  return (
    <button
      type="button"
      disabled={disabled || pending}
      onClick={() =>
        startTransition(async () => {
          const res = await markAllNotificationsReadAction()
          if (res.status === 'error') toast.error(res.message ?? m.common.error)
          else {
            toast.success(res.message ?? m.common.done)
            router.refresh()
          }
        })
      }
      className="inline-flex h-10 items-center gap-2 rounded-lg bg-primary-soft px-4 text-[14px] font-semibold text-primary transition-colors hover:brightness-95 disabled:opacity-50"
    >
      <CheckCheck className="size-4" aria-hidden /> {m.notifications.markAll}
    </button>
  )
}

const TOPICS: { key: 'priceDrop' | 'newLead' | 'promos' | 'paymentReminder'; sellerOnly?: boolean }[] = [
  { key: 'priceDrop' },
  { key: 'newLead', sellerOnly: true },
  { key: 'promos' },
  { key: 'paymentReminder' },
]

const CHANNELS = [
  { key: 'telegram', icon: Send },
  { key: 'sms', icon: MessageSquareText },
  { key: 'email', icon: Mail },
] as const

/**
 * Mavzu sozlamalari haqiqatda ishlaydi (notifyMany ularni hisobga oladi).
 * Tashqi kanallar hali ulanmagan — ataylab o'chirilgan holda ko'rsatiladi.
 */
export function NotificationSettings({
  initial,
  seller,
}: {
  initial: NotificationPrefs
  seller: boolean
}) {
  const t = useMessages().cabinet.notifications.settings
  const [prefs, setPrefs] = React.useState(initial)
  const [pendingKey, setPendingKey] = React.useState<keyof NotificationPrefs | null>(null)

  const toggle = async (key: keyof NotificationPrefs, value: boolean) => {
    const prev = prefs
    setPrefs({ ...prefs, [key]: value })
    setPendingKey(key)
    const res = await updateNotificationPrefAction(key, value)
    setPendingKey(null)
    if (res.status === 'error' || !res.data) {
      setPrefs(prev)
      toast.error(res.message ?? t.saveFailed)
    } else setPrefs(res.data)
  }

  return (
    <div className="space-y-4">
      <section className="rounded-xl border border-border bg-surface p-4 sm:p-5">
        <h2 className="text-lg font-bold text-text">{t.title}</h2>
        <p className="mt-1 text-[13px] text-muted">{t.hint}</p>
        <ul className="mt-3 divide-y divide-border">
          {TOPICS.filter((x) => seller || !x.sellerOnly).map((x) => (
            <li key={x.key}>
              <label className="flex cursor-pointer items-center justify-between gap-4 py-3">
                <span>
                  <span className="block text-[14px] font-semibold text-text">{t.topics[x.key].title}</span>
                  <span className="block text-[12px] text-muted">{t.topics[x.key].hint}</span>
                </span>
                <Switch
                  checked={prefs[x.key]}
                  disabled={pendingKey === x.key}
                  onCheckedChange={(v) => void toggle(x.key, v)}
                />
              </label>
            </li>
          ))}
        </ul>
      </section>

      <section className="rounded-xl border border-border bg-surface p-4 sm:p-5">
        <div className="flex items-center justify-between gap-2">
          <h2 className="text-lg font-bold text-text">{t.channels}</h2>
          <span className="rounded-md bg-success-soft px-2 py-0.5 text-[11px] font-bold text-success">{t.siteActive}</span>
        </div>
        <p className="mt-1 text-[13px] text-muted">
          {t.channelsHint}
        </p>
        <ul className="mt-3 space-y-2">
          {CHANNELS.map((c) => (
            <li
              key={c.key}
              className="flex items-center gap-3 rounded-lg bg-surface-2 px-3 py-2.5 opacity-70"
            >
              <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-surface text-muted">
                <c.icon className="size-4" aria-hidden />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block text-[13px] font-semibold text-text">{t[c.key].title}</span>
                <span className="block text-[12px] text-muted">{t[c.key].hint}</span>
              </span>
              <span className="shrink-0 rounded-md bg-surface-3 px-2 py-0.5 text-[11px] font-semibold text-muted">
                {t.soon}
              </span>
            </li>
          ))}
        </ul>
      </section>
    </div>
  )
}
