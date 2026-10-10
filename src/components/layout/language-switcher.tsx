'use client'

import * as React from 'react'
import { Check, ChevronDown, Globe } from 'lucide-react'
import { Dropdown, DropdownContent, DropdownItem, DropdownTrigger } from '@/components/ui/dropdown'
import { LOCALES, LOCALE_COOKIE, LOCALE_LABELS, switchLocaleHref, type Locale } from '@/i18n/config'
import { useLocale, useMessages } from '@/i18n/client'
import { cn } from '@/lib/utils'

/**
 * Tanlov cookie'ga yoziladi (proxy keyingi safar shu tilga yo'naltiradi),
 * so'ng sahifa o'sha manzilning boshqa tildagi versiyasiga to'liq
 * qayta yuklanadi — server komponentlar yangi tilda chiziladi.
 */
function useSwitch() {
  // Joriy manzil bosilgan paytda o'qiladi — useSearchParams statik
  // sahifalarda (kirish, 404) Suspense talab qiladi, bu yerda u shart emas
  return React.useCallback((target: Locale) => {
    document.cookie = `${LOCALE_COOKIE}=${target}; path=/; max-age=31536000; samesite=lax`
    const { pathname, search, hash } = window.location
    window.location.assign(switchLocaleHref(`${pathname}${search}${hash}`, target))
  }, [])
}

/** Header'dagi ixcham ochiladigan ro'yxat */
export function LanguageSwitcher({ className }: { className?: string }) {
  const locale = useLocale()
  const t = useMessages().common.nav
  const go = useSwitch()

  return (
    <Dropdown>
      <DropdownTrigger asChild>
        <button
          type="button"
          aria-label={t.language}
          className={cn(
            'inline-flex h-8 items-center gap-1 rounded-md px-1.5 text-[12px] font-semibold text-text transition-colors hover:bg-surface-3',
            className,
          )}
        >
          <Globe className="size-3.5 text-primary" aria-hidden />
          {LOCALE_LABELS[locale].short}
          <ChevronDown className="size-3 text-subtle" aria-hidden />
        </button>
      </DropdownTrigger>
      <DropdownContent align="end">
        {LOCALES.map((l) => (
          <DropdownItem key={l} onSelect={() => l !== locale && go(l)}>
            <span className="w-7 text-[11px] font-bold text-subtle">{LOCALE_LABELS[l].short}</span>
            <span lang={LOCALE_LABELS[l].htmlLang}>{LOCALE_LABELS[l].name}</span>
            {l === locale ? <Check className="ml-auto text-primary" aria-hidden /> : null}
          </DropdownItem>
        ))}
      </DropdownContent>
    </Dropdown>
  )
}

/** Mobil menyu uchun: uchala til bir qatorda */
export function LanguageSegmented({ className }: { className?: string }) {
  const locale = useLocale()
  const go = useSwitch()
  return (
    <div role="radiogroup" className={cn('grid grid-cols-3 gap-1 rounded-lg bg-surface-2 p-1', className)}>
      {LOCALES.map((l) => (
        <button
          key={l}
          type="button"
          role="radio"
          aria-checked={l === locale}
          lang={LOCALE_LABELS[l].htmlLang}
          onClick={() => l !== locale && go(l)}
          className={cn(
            'h-9 rounded-md text-[13px] font-semibold transition-colors',
            l === locale ? 'bg-surface text-primary shadow-sm' : 'text-muted hover:text-text',
          )}
        >
          {LOCALE_LABELS[l].name}
        </button>
      ))}
    </div>
  )
}
