'use client'

import * as React from 'react'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'

/**
 * URL query bilan ishlash uchun yagona nuqta.
 * Har bir filtr URL'da saqlanadi — natijani ulashish va orqaga qaytish ishlaydi.
 */
export function useFilters() {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const [isPending, startTransition] = React.useTransition()

  const commit = React.useCallback(
    (mutate: (params: URLSearchParams) => void, options?: { scroll?: boolean }) => {
      const params = new URLSearchParams(searchParams.toString())
      mutate(params)
      params.delete('page') // filtr o'zgarsa 1-sahifaga qaytamiz
      const qs = params.toString()
      startTransition(() => {
        router.push(qs ? `${pathname}?${qs}` : pathname, {
          scroll: options?.scroll ?? false,
        })
      })
    },
    [pathname, router, searchParams],
  )

  const setParam = React.useCallback(
    (key: string, value: string | number | undefined | null) => {
      commit((params) => {
        if (value === undefined || value === null || value === '') params.delete(key)
        else params.set(key, String(value))
      })
    },
    [commit],
  )

  /** Vergul bilan ajratilgan ro'yxatdagi qiymatni qo'shadi/olib tashlaydi */
  const toggleInList = React.useCallback(
    (key: string, value: string) => {
      commit((params) => {
        const current = (params.get(key) ?? '').split(',').filter(Boolean)
        const next = current.includes(value)
          ? current.filter((v) => v !== value)
          : [...current, value]
        if (next.length) params.set(key, next.join(','))
        else params.delete(key)
      })
    },
    [commit],
  )

  const getList = React.useCallback(
    (key: string): string[] =>
      (searchParams.get(key) ?? '').split(',').filter(Boolean),
    [searchParams],
  )

  const get = React.useCallback(
    (key: string): string => searchParams.get(key) ?? '',
    [searchParams],
  )

  const clearAll = React.useCallback(() => {
    startTransition(() => {
      const q = searchParams.get('q')
      router.push(q ? `${pathname}?q=${encodeURIComponent(q)}` : pathname, {
        scroll: false,
      })
    })
  }, [pathname, router, searchParams])

  const removeKeys = React.useCallback(
    (keys: string[]) => {
      commit((params) => keys.forEach((k) => params.delete(k)))
    },
    [commit],
  )

  return { get, getList, setParam, toggleInList, clearAll, removeKeys, isPending, searchParams }
}

/** Raqamli maydonlar uchun kechiktirilgan (debounce) qiymat */
export function useDebouncedCallback<A extends unknown[]>(
  fn: (...args: A) => void,
  delay = 500,
) {
  const timer = React.useRef<ReturnType<typeof setTimeout> | null>(null)
  const fnRef = React.useRef(fn)

  // Ref'ni render paytida emas, effektda yangilaymiz
  React.useEffect(() => {
    fnRef.current = fn
  })

  React.useEffect(
    () => () => {
      if (timer.current) clearTimeout(timer.current)
    },
    [],
  )

  return React.useCallback(
    (...args: A) => {
      if (timer.current) clearTimeout(timer.current)
      timer.current = setTimeout(() => fnRef.current(...args), delay)
    },
    [delay],
  )
}
