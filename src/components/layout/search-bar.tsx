'use client'

import * as React from 'react'
import { useSearchParams } from 'next/navigation'
import { useMessages, useRouter } from '@/i18n/client'
import { Search } from 'lucide-react'
import { cn } from '@/lib/utils'

export function SearchBar({
  className,
  placeholder,
  autoFocus,
  compact = false,
}: {
  className?: string
  placeholder?: string
  autoFocus?: boolean
  /** Header uchun: kulrang fon, tugmasiz — Enter bilan yuboriladi */
  compact?: boolean
}) {
  const router = useRouter()
  const t = useMessages().common.search
  const searchParams = useSearchParams()
  const urlQuery = searchParams.get('q') ?? ''

  const [value, setValue] = React.useState(urlQuery)
  const [syncedQuery, setSyncedQuery] = React.useState(urlQuery)

  // URL tashqaridan oʻzgarsa (orqaga tugmasi, boshqa havola) inputni moslaymiz.
  // Effekt emas — React'ning "adjusting state during render" namunasi.
  if (urlQuery !== syncedQuery) {
    setSyncedQuery(urlQuery)
    setValue(urlQuery)
  }

  const submit = (e: React.FormEvent) => {
    e.preventDefault()
    const params = new URLSearchParams(searchParams.toString())
    const q = value.trim()
    if (q) params.set('q', q)
    else params.delete('q')
    params.delete('page')
    router.push(`/elonlar?${params.toString()}`)
  }

  return (
    <form onSubmit={submit} className={cn('relative', className)} role="search">
      <Search
        className="pointer-events-none absolute left-3 top-1/2 size-[18px] -translate-y-1/2 text-subtle"
        aria-hidden
      />
      <input
        type="search"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder={placeholder ?? t.placeholder}
        autoFocus={autoFocus}
        enterKeyHint="search"
        autoCapitalize="off"
        autoCorrect="off"
        aria-label={t.aria}
        className={cn(
          'w-full text-sm text-text placeholder:text-subtle transition-colors',
          compact
            ? 'h-10 rounded-lg border border-transparent bg-surface-2 pl-10 pr-3 hover:border-border focus:bg-surface'
            : 'h-12 rounded-[12px] border border-border bg-surface pl-11 pr-14 hover:border-border-strong sm:h-11 sm:pr-24',
        )}
      />
      {compact ? null : (
      <>
      {/*
        Telefonda tugma faqat belgidan iborat — matn uchun joy qoldirsak
        qidiruv maydonining oʻzi juda torayib qoladi.
      */}
      <button
        type="submit"
        aria-label={t.submit}
        className="absolute right-1.5 top-1/2 flex h-9 w-10 -translate-y-1/2 items-center justify-center rounded-[9px] bg-primary text-[13px] font-medium text-primary-fg transition-colors hover:bg-primary-hover sm:h-8 sm:w-auto sm:px-4"
      >
        <Search className="size-[18px] sm:hidden" aria-hidden />
        <span className="hidden sm:inline">{t.submit}</span>
      </button>
      </>
      )}
    </form>
  )
}
