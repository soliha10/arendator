import type { Locale } from './config'
import type { Messages } from './messages'
import { fmt } from './format'
import { formatMoney } from '@/lib/format'

/**
 * Bildirishnoma bazaga tur + `data.tpl` + `data.vars` bilan yoziladi.
 * Matn shu yerda o'quvchining tilida yasaladi; eski yozuvlarda shablon
 * bo'lmasa — bazadagi (o'zbekcha) sarlavha va matn qaytadi.
 */
type TplKey = keyof Messages['server']['notify']

interface NotificationLike {
  title: string
  body: string
  data: unknown
}

export function renderNotification(
  n: NotificationLike,
  m: Messages,
  locale: Locale,
): { title: string; body: string } {
  const data = (n.data && typeof n.data === 'object' ? n.data : {}) as Record<string, unknown>
  const tpl = data.tpl as TplKey | undefined
  const t = tpl ? m.server.notify[tpl] : undefined
  if (!t) return { title: n.title, body: n.body }

  const raw = (data.vars && typeof data.vars === 'object' ? data.vars : {}) as Record<string, string | number>
  const vars: Record<string, string | number> = { ...raw }
  const money = (v: unknown) => (typeof v === 'number' ? formatMoney(v, 'UZS', { locale }) : '')

  if (tpl === 'priceDrop') {
    vars.old = money(data.oldPriceUzs)
    vars.new = money(data.newPriceUzs)
  }
  if (tpl === 'leadStatus' && typeof data.status === 'string') {
    vars.status = (m.enums.leadStatus as Record<string, string>)[data.status] ?? data.status
  }
  if (tpl === 'listingRejected' && !vars.reason) {
    vars.reason = m.server.notify.listingRejected.noReason
  }

  return { title: fmt(t.title, vars), body: fmt(t.body, vars) }
}
