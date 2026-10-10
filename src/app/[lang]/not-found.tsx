import { Home, Search } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Logo } from '@/components/layout/logo'
import { Link } from '@/i18n/client'
import { getMessages } from '@/i18n/server'

export default async function NotFound() {
  const t = (await getMessages()).pages.notFound
  return (
    <div className="flex min-h-dvh flex-col bg-bg">
      <header className="p-4 sm:p-5">
        <Logo />
      </header>
      <main className="flex flex-1 items-center justify-center px-4 py-10 sm:px-5 sm:py-12">
        <div className="text-center">
          <p className="tabular font-display text-[80px] font-extrabold leading-none text-surface-3">404</p>
          <h1 className="mt-3 text-2xl font-bold tracking-tight text-text">{t.title}</h1>
          <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-muted">{t.text}</p>
          <div className="mt-6 grid gap-2.5 sm:flex sm:flex-wrap sm:justify-center sm:gap-3">
            <Button asChild>
              <Link href="/">
                <Home /> {t.home}
              </Link>
            </Button>
            <Button asChild variant="outline">
              <Link href="/elonlar">
                <Search /> {t.listings}
              </Link>
            </Button>
          </div>
        </div>
      </main>
    </div>
  )
}
