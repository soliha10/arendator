import { ArrowLeft, ShieldCheck } from 'lucide-react'
import { Logo } from '@/components/layout/logo'
import { ThemeToggle } from '@/components/layout/theme-toggle'
import { AuthBenefits } from '@/components/auth/auth-benefits'
import { LanguageSwitcher } from '@/components/layout/language-switcher'
import { Link } from '@/i18n/client'
import { getMessages } from '@/i18n/server'

/**
 * Ikki ustun: chapda forma kartasi, o'ngda afzalliklar va yordam.
 * Telefonda afzalliklar formadan keyin keladi — avval asosiy amal.
 */
export default async function AuthLayout({ children }: LayoutProps<'/[lang]'>) {
  const t = (await getMessages()).auth.layout
  return (
    <div className="flex min-h-dvh flex-col bg-bg pb-safe pt-safe">
      <header className="border-b border-border bg-surface">
        <div className="container-page flex h-16 items-center justify-between gap-3">
          <Logo />
          <div className="flex items-center gap-1">
            <span className="mr-1 hidden items-center gap-1.5 rounded-full bg-success-soft px-2.5 py-1 text-[11px] font-semibold text-success sm:inline-flex">
              <ShieldCheck className="size-3.5" aria-hidden /> {t.secure}
            </span>
            <LanguageSwitcher className="mr-1" />
            <ThemeToggle />
            <Link
              href="/"
              className="inline-flex h-10 items-center gap-1.5 rounded-lg px-3 text-sm font-medium text-muted transition-colors hover:bg-surface-2 hover:text-text"
            >
              <ArrowLeft className="size-4" aria-hidden />
              <span className="hidden sm:inline">{t.home}</span>
            </Link>
          </div>
        </div>
      </header>

      <main className="container-page flex-1 py-6 sm:py-10">
        <div className="mx-auto grid max-w-6xl gap-6 lg:grid-cols-[minmax(0,1.35fr)_minmax(0,1fr)] lg:gap-8">
          <div className="rounded-2xl border border-border bg-surface p-5 surface-shadow sm:p-8">
            {children}
          </div>
          <AuthBenefits />
        </div>
      </main>
    </div>
  )
}
