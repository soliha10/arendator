import { cn } from '@/lib/utils'
import { Link } from '@/i18n/client'
import { getMessages } from '@/i18n/server'

/**
 * Kirish | Ro'yxatdan o'tish almashtirgichi. Oddiy havolalar — har biri
 * alohida sahifa, shuning uchun `next` parametri ikkalasida ham saqlanadi.
 */
export async function AuthTabs({ active, next }: { active: 'login' | 'register'; next?: string }) {
  const t = (await getMessages()).auth.tabs
  const qs = next ? `?next=${encodeURIComponent(next)}` : ''
  const tabs = [
    { key: 'login' as const, href: `/kirish${qs}`, label: t.login },
    { key: 'register' as const, href: `/royxatdan-otish${qs}`, label: t.register },
  ]
  return (
    <nav aria-label={t.aria} className="grid grid-cols-2 gap-1 rounded-xl bg-surface-2 p-1">
      {tabs.map((tab) => (
        <Link
          key={tab.key}
          href={tab.href}
          aria-current={active === tab.key ? 'page' : undefined}
          className={cn(
            'flex h-10 items-center justify-center rounded-lg px-2 text-center text-sm font-semibold leading-tight transition-colors',
            active === tab.key
              ? 'bg-primary text-primary-fg shadow-sm'
              : 'text-muted hover:text-text',
          )}
        >
          {tab.label}
        </Link>
      ))}
    </nav>
  )
}
