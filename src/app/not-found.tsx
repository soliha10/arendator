import Link from 'next/link'
import { Home, Search } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Logo } from '@/components/layout/logo'

export default function NotFound() {
  return (
    <div className="flex min-h-dvh flex-col">
      <header className="p-5">
        <Logo />
      </header>
      <main className="flex flex-1 items-center justify-center px-5 py-12">
        <div className="text-center">
          <p className="tabular text-[80px] font-bold leading-none text-surface-3">404</p>
          <h1 className="mt-3 text-2xl font-bold tracking-tight text-text">
            Sahifa topilmadi
          </h1>
          <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-muted">
            Siz izlagan sahifa oʻchirilgan yoki manzil notoʻgʻri kiritilgan boʻlishi
            mumkin. Eʼlon esa arxivlangan boʻlishi ham mumkin.
          </p>
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <Button asChild>
              <Link href="/">
                <Home /> Bosh sahifa
              </Link>
            </Button>
            <Button asChild variant="outline">
              <Link href="/elonlar">
                <Search /> Eʼlonlarni koʻrish
              </Link>
            </Button>
          </div>
        </div>
      </main>
    </div>
  )
}
