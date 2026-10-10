import type { Metadata } from 'next'
import { getCurrentUser } from '@/lib/auth/guards'
import { SITE } from '@/lib/site'
import { AuthTabs } from '@/components/auth/auth-tabs'
import { Link } from '@/i18n/client'
import { localeRedirect } from '@/i18n/action'
import { fmt } from '@/i18n/format'
import { alternatesFor } from '@/i18n/seo'
import { getLocale, getMessages } from '@/i18n/server'
import { RegisterForm } from './register-form'

export async function generateMetadata(): Promise<Metadata> {
  const [m, locale] = await Promise.all([getMessages(), getLocale()])
  return {
    title: m.auth.register.metaTitle,
    description: fmt(m.auth.register.metaDescription, { name: SITE.name }),
    alternates: alternatesFor('/royxatdan-otish', locale),
    robots: { index: false, follow: true },
  }
}

export default async function RegisterPage(props: PageProps<'/[lang]/royxatdan-otish'>) {
  const user = await getCurrentUser()
  if (user) return localeRedirect('/kabinet')

  const m = await getMessages()
  const t = m.auth.register
  const searchParams = await props.searchParams
  const next = typeof searchParams.next === 'string' ? searchParams.next : undefined
  // ?turi=yuridik (yangi) va ?rol=arendator (eski havolalar) — diler hisobi
  const business = searchParams.turi === 'yuridik' || searchParams.rol === 'arendator'

  return (
    <div>
      <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-wider text-muted">
            {fmt(m.auth.platform, { name: SITE.name })}
          </p>
          <h1 className="mt-1 text-[28px] font-extrabold leading-tight text-text sm:text-[32px]">
            {t.title}
          </h1>
        </div>
        <div className="sm:w-72">
          <AuthTabs active="register" next={next} />
        </div>
      </div>

      <RegisterForm defaultType={business ? 'BUSINESS' : 'INDIVIDUAL'} next={next} />

      <p className="mt-6 text-center text-sm text-muted">
        {t.haveAccount}{' '}
        <Link
          href={next ? `/kirish?next=${encodeURIComponent(next)}` : '/kirish'}
          className="font-semibold text-primary hover:underline"
        >
          {t.loginLink}
        </Link>
      </p>
    </div>
  )
}
