'use client'

import * as React from 'react'
import { Monitor, Moon, Sun } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useMessages } from '@/i18n/client'

type Theme = 'light' | 'dark' | 'system'

const STORAGE_KEY = 'arendator:theme'

function applyTheme(theme: Theme) {
  const root = document.documentElement
  if (theme === 'system') root.removeAttribute('data-theme')
  else root.setAttribute('data-theme', theme)
}

/** Sahifa "miltillamasligi" uchun <head> ichida ishga tushadigan skript */
export const themeInitScript = `
(function(){try{var t=localStorage.getItem('${STORAGE_KEY}');
if(t==='dark'||t==='light'){document.documentElement.setAttribute('data-theme',t)}}catch(e){}})();
`

// Mavzu localStorage'da saqlanadi — React uni tashqi manba sifatida oʻqiydi
const themeListeners = new Set<() => void>()

function subscribeTheme(listener: () => void): () => void {
  themeListeners.add(listener)
  window.addEventListener('storage', listener)
  return () => {
    themeListeners.delete(listener)
    window.removeEventListener('storage', listener)
  }
}

function readTheme(): Theme {
  const stored = localStorage.getItem(STORAGE_KEY)
  return stored === 'dark' || stored === 'light' ? stored : 'system'
}

function writeTheme(theme: Theme) {
  if (theme === 'system') localStorage.removeItem(STORAGE_KEY)
  else localStorage.setItem(STORAGE_KEY, theme)
  applyTheme(theme)
  for (const listener of themeListeners) listener()
}

export function ThemeToggle({ className }: { className?: string }) {
  const theme = React.useSyncExternalStore(
    subscribeTheme,
    readTheme,
    () => 'system' as Theme,
  )

  const cycle = () => {
    const next: Theme = theme === 'system' ? 'light' : theme === 'light' ? 'dark' : 'system'
    writeTheme(next)
  }

  const t = useMessages().common.theme
  const Icon = theme === 'light' ? Sun : theme === 'dark' ? Moon : Monitor
  const label = theme === 'light' ? t.light : theme === 'dark' ? t.dark : t.system

  return (
    <button
      type="button"
      onClick={cycle}
      title={label}
      aria-label={label}
      className={cn(
        'inline-flex size-10 items-center justify-center rounded-[10px] text-muted transition-colors hover:bg-surface-2 hover:text-text lg:size-9',
        className,
      )}
    >
      <Icon className="size-4.5" />
    </button>
  )
}

/**
 * Menyu uchun aniq tanlov: Yorug' / Qorong'i / Tizim — telefonda
 * aylanma tugmadan ko'ra tushunarliroq.
 */
export function ThemeSwitch({ className }: { className?: string }) {
  const theme = React.useSyncExternalStore(subscribeTheme, readTheme, () => 'system' as Theme)
  const t = useMessages().common.theme
  const options = [
    { value: 'light' as const, icon: Sun, label: t.light },
    { value: 'dark' as const, icon: Moon, label: t.dark },
    { value: 'system' as const, icon: Monitor, label: t.system },
  ]
  return (
    <div role="radiogroup" className={cn('grid grid-cols-3 gap-1 rounded-lg bg-surface-2 p-1', className)}>
      {options.map((o) => (
        <button
          key={o.value}
          type="button"
          role="radio"
          aria-checked={theme === o.value}
          aria-label={o.label}
          title={o.label}
          onClick={() => writeTheme(o.value)}
          className={cn(
            'flex h-9 items-center justify-center rounded-md transition-colors',
            theme === o.value ? 'bg-surface text-primary shadow-sm' : 'text-muted hover:text-text',
          )}
        >
          <o.icon className="size-4.5" aria-hidden />
        </button>
      ))}
    </div>
  )
}
