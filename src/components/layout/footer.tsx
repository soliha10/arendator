import { Clock, Headphones, Mail, Send } from 'lucide-react'
import { formatPhone } from '@/lib/format'
import { SITE, telegramUrl } from '@/lib/site'
import { Logo } from './logo'
import { Link } from '@/i18n/client'
import { fmt } from '@/i18n/format'
import { getMessages } from '@/i18n/server'

export async function Footer() {
  const m = await getMessages()
  const t = m.common.footer
  const columns = [
    {
      title: t.popular,
      links: [
        { href: '/elonlar?q=Onix', label: 'Chevrolet Onix' },
        { href: '/elonlar?q=Tracker', label: 'Chevrolet Tracker' },
        { href: '/elonlar?q=Cobalt', label: 'Chevrolet Cobalt' },
        { href: '/elonlar?brand=byd', label: t.popularBydLabel },
        { href: '/elonlar?brand=kia', label: 'Kia' },
        { href: '/elonlar?condition=NEW', label: t.popularNew },
      ],
    },
    {
      title: t.buyers,
      links: [
        { href: '/elonlar?planType=RENT', label: t.rent },
        { href: '/elonlar?planType=INSTALLMENT', label: t.installment },
        { href: '/elonlar?planType=LEASING', label: t.leasing },
        { href: '/kalkulyator', label: t.calculator },
        { href: '/taqqoslash', label: t.compare },
        { href: '/dilerlar', label: t.dealers },
      ],
    },
    {
      title: t.forDealers,
      links: [
        { href: '/royxatdan-otish?turi=yuridik', label: t.addShowroom },
        { href: '/kabinet/elon/yangi', label: t.postAd },
        { href: '/qollanma', label: t.guide },
        { href: '/haqida', label: t.aboutLink },
        { href: '/aloqa', label: t.contact },
      ],
    },
  ]
  const legal = [
    { href: '/shartlar', label: t.terms },
    { href: '/maxfiylik', label: t.privacy },
    { href: '/aloqa', label: t.complaint },
  ]

  return (
    <footer className="mt-16 border-t border-border bg-surface-2 pb-nav lg:pb-0">
      <div className="container-page py-12">
        <div className="grid gap-10 md:grid-cols-2 lg:grid-cols-[1.4fr_1fr_1fr_1fr]">
          <div>
            <Logo />
            <p className="mt-4 max-w-sm text-sm leading-relaxed text-muted">
              {t.about}
            </p>
            <div className="mt-5 space-y-2 text-[13px] text-text">
              <a href={`tel:${SITE.phone}`} className="tabular flex items-center gap-2 hover:text-primary">
                <Headphones className="size-4 text-primary" aria-hidden />
                {fmt(t.support, { phone: formatPhone(SITE.phone) })}
              </a>
              <a href={`mailto:${SITE.email}`} className="flex items-center gap-2 hover:text-primary">
                <Mail className="size-4 text-primary" aria-hidden /> {SITE.email}
              </a>
              <p className="flex items-center gap-2">
                <Clock className="size-4 text-primary" aria-hidden /> {fmt(t.hours, { hours: t.workingHours })}
              </p>
            </div>
            <a
              href={telegramUrl(SITE.telegram)}
              target="_blank"
              rel="noreferrer noopener"
              className="mt-5 inline-flex items-center gap-3 rounded-xl bg-primary-soft px-4 py-2.5 text-primary transition-colors hover:brightness-95"
            >
              <Send className="size-5" aria-hidden />
              <span className="leading-tight">
                <span className="block text-[11px] font-medium opacity-80">{t.channelHint}</span>
                <span className="block text-sm font-bold">{t.channelCta}</span>
              </span>
            </a>
          </div>

          {columns.map((col) => (
            <div key={col.title}>
              <h3 className="text-[15px] font-bold text-text">{col.title}</h3>
              <ul className="mt-4 space-y-2.5">
                {col.links.map((link) => (
                  <li key={link.href}>
                    <Link href={link.href} className="text-sm text-muted transition-colors hover:text-primary">
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-10 flex flex-col gap-4 border-t border-border pt-6 md:flex-row md:items-center md:justify-between">
          <ul className="flex flex-wrap gap-x-5 gap-y-2 text-[13px] font-medium text-muted">
            {legal.map((l) => (
              <li key={l.href + l.label}>
                <Link href={l.href} className="hover:text-text">
                  {l.label}
                </Link>
              </li>
            ))}
          </ul>
          <p className="text-[13px] font-medium text-muted">
            {fmt(t.rights, { year: new Date().getFullYear(), name: SITE.name })}
          </p>
        </div>

        <p className="mt-5 text-[12px] leading-relaxed text-subtle">
          {fmt(t.disclaimer, { name: SITE.name })}
        </p>
      </div>
    </footer>
  )
}
