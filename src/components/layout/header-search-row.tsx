'use client'

import { usePathname } from 'next/navigation'
import { SearchBar } from './search-bar'

/**
 * Telefon uchun qidiruv qatori — yopishqoq sarlavha ostida, uning oʻzi
 * yopishqoq emas. Bosh sahifada hero ichida allaqachon katta qidiruv
 * maydoni bor, shuning uchun u yerda takrorlanmaydi.
 */
export function HeaderSearchRow() {
  const pathname = usePathname()
  if (pathname === '/') return null

  return (
    <div className="border-b border-border bg-surface lg:hidden">
      <div className="container-page py-2.5">
        <SearchBar />
      </div>
    </div>
  )
}
