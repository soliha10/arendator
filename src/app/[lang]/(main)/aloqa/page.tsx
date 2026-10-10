import type { Metadata } from 'next'
import { Clock, Mail, MapPin, Phone, Send } from 'lucide-react'
import { Prose } from '@/components/prose'
import { formatPhone } from '@/lib/format'
import { SITE, telegramUrl } from '@/lib/site'
import { alternatesFor, ogLocale } from '@/i18n/seo'
import { getLocale, getMessages } from '@/i18n/server'

export async function generateMetadata(): Promise<Metadata> {
  const [m, locale] = await Promise.all([getMessages(), getLocale()])
  const t = m.pages.contact
  return {
    title: t.metaTitle,
    description: t.metaDescription,
    alternates: alternatesFor('/aloqa', locale),
    openGraph: { locale: ogLocale(locale) },
  }
}

export default async function ContactPage() {
  const m = await getMessages()
  const t = m.pages.contact
  const contacts = [
    { icon: Phone, label: t.phone, value: formatPhone(SITE.phone), href: `tel:${SITE.phone}` },
    { icon: Mail, label: t.email, value: SITE.email, href: `mailto:${SITE.email}` },
    { icon: Send, label: t.telegram, value: `@${SITE.telegram}`, href: telegramUrl(SITE.telegram) },
    { icon: Clock, label: t.hours, value: m.common.footer.workingHours, href: null },
    { icon: MapPin, label: t.address, value: t.addressValue, href: null },
  ]

  return (
    <div className="container-page py-8 lg:py-12">
      <Prose title={t.title}>
        <p>{t.intro}</p>
      </Prose>

      <div className="mx-auto mt-8 grid max-w-3xl gap-3 sm:grid-cols-2">
        {contacts.map((c) => {
          const inner = (
            <>
              <c.icon className="size-5 text-primary" aria-hidden />
              <p className="mt-3 text-[12px] uppercase tracking-wide text-subtle">{c.label}</p>
              <p className="tabular mt-0.5 text-[15px] font-semibold text-text">{c.value}</p>
            </>
          )
          return c.href ? (
            <a
              key={c.label}
              href={c.href}
              target={c.href.startsWith('http') ? '_blank' : undefined}
              rel="noreferrer noopener"
              className="card p-5 transition-colors hover:border-primary"
            >
              {inner}
            </a>
          ) : (
            <div key={c.label} className="card p-5">
              {inner}
            </div>
          )
        })}
      </div>

      <div className="mx-auto mt-6 max-w-3xl rounded-xl border border-warning/30 bg-warning-soft px-4 py-3.5 text-[13px] leading-relaxed text-warning">
        <strong>{t.fraudTitle}</strong> {t.fraudText}
      </div>
    </div>
  )
}
