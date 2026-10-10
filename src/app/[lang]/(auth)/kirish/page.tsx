import type { Metadata } from 'next'
import { getCurrentUser } from '@/lib/auth/guards'
import { SITE } from '@/lib/site'
import { AuthTabs } from '@/components/auth/auth-tabs'
import { Link } from '@/i18n/client'
import { localeRedirect } from '@/i18n/action'
import { fmt } from '@/i18n/format'
import { alternatesFor } from '@/i18n/seo'
import { getLocale, getMessages } from '@/i18n/server'
import { LoginForm } from './login-form'

export async function generateMetadata(): Promise<Metadata> {
  const [m, locale] = await Promise.all([getMessages(), getLocale()])
  return {
    title: m.auth.login.metaTitle,
    description: fmt(m.auth.login.metaDescription, { name: SITE.name }),
    alternates: alternatesFor('/kirish', locale),
    robots: { index: false, follow: true },
  }
}

export default async function LoginPage(props: PageProps<'/[lang]/kirish'>) {
  const user = await getCurrentUser()
  if (user) return localeRedirect('/kabinet')

  const m = await getMessages()
  const t = m.auth.login
  const searchParams = await props.searchParams
  const next = typeof searchParams.next === 'string' ? searchParams.next : undefined

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
          <AuthTabs active="login" next={next} />
        </div>
      </div>

      <LoginForm next={next} showDemo={process.env.NODE_ENV !== 'production'} />

      <p className="mt-6 text-center text-sm text-muted">
        {t.noAccount}{' '}
        <Link
          href={next ? `/royxatdan-otish?next=${encodeURIComponent(next)}` : '/royxatdan-otish'}
          className="font-semibold text-primary hover:underline"
        >
          {t.registerLink}
        </Link>
      </p>
    </div>
  )
}
