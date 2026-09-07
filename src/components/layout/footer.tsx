import Link from 'next/link'
import { Mail, MapPin, Phone, Send } from 'lucide-react'
import { Logo } from './logo'

const COLUMNS = [
  {
    title: 'Xaridorlar uchun',
    links: [
      { href: '/elonlar', label: 'Barcha eʼlonlar' },
      { href: '/elonlar?sort=monthly_asc', label: 'Eng arzon oylik toʻlov' },
      { href: '/elonlar?condition=NEW', label: 'Yangi avtomobillar' },
      { href: '/taqqoslash', label: 'Taqqoslash' },
      { href: '/kalkulyator', label: 'Rassrochka kalkulyatori' },
    ],
  },
  {
    title: 'Arendatorlar uchun',
    links: [
      { href: '/royxatdan-otish?rol=arendator', label: 'Arendator boʻlish' },
      { href: '/kabinet/elon/yangi', label: 'Eʼlon joylash' },
      { href: '/arendatorlar', label: 'Arendatorlar reytingi' },
      { href: '/qollanma', label: 'Qoʻllanma' },
    ],
  },
  {
    title: 'Kompaniya',
    links: [
      { href: '/haqida', label: 'Loyiha haqida' },
      { href: '/shartlar', label: 'Foydalanish shartlari' },
      { href: '/maxfiylik', label: 'Maxfiylik siyosati' },
      { href: '/aloqa', label: 'Bogʻlanish' },
    ],
  },
]

export function Footer() {
  return (
    <footer className="mt-16 border-t border-border bg-surface">
      <div className="container-page py-12">
        <div className="grid gap-10 md:grid-cols-2 lg:grid-cols-5">
          <div className="lg:col-span-2">
            <Logo />
            <p className="mt-4 max-w-sm text-sm leading-relaxed text-muted">
              Avtomobilni rassrochka va arendaga olish uchun ochiq platforma.
              Boshlangʻich toʻlov, oylik toʻlov va toʻliq toʻlov grafigi — hammasi
              bir joyda, yashirin shartlarsiz.
            </p>
            <div className="mt-5 space-y-2.5 text-sm text-muted">
              <a href="tel:+998712000000" className="flex items-center gap-2.5 hover:text-text">
                <Phone className="size-4 text-subtle" /> +998 71 200 00 00
              </a>
              <a href="mailto:info@arendator.uz" className="flex items-center gap-2.5 hover:text-text">
                <Mail className="size-4 text-subtle" /> info@arendator.uz
              </a>
              <p className="flex items-center gap-2.5">
                <MapPin className="size-4 text-subtle" /> Toshkent shahri
              </p>
            </div>
          </div>

          {COLUMNS.map((col) => (
            <div key={col.title}>
              <h3 className="text-sm font-semibold text-text">{col.title}</h3>
              <ul className="mt-4 space-y-2.5">
                {col.links.map((link) => (
                  <li key={link.href}>
                    <Link href={link.href} className="text-sm text-muted transition-colors hover:text-text">
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-10 flex flex-col items-start justify-between gap-4 border-t border-border pt-6 sm:flex-row sm:items-center">
          <p className="text-[13px] text-subtle">
            © {new Date().getFullYear()} Arendator. Barcha huquqlar himoyalangan.
          </p>
          <div className="flex items-center gap-3">
            <a
              href="https://t.me/"
              target="_blank"
              rel="noreferrer noopener"
              className="inline-flex size-9 items-center justify-center rounded-[10px] border border-border text-muted transition-colors hover:bg-surface-2 hover:text-text"
              aria-label="Telegram"
            >
              <Send className="size-4" />
            </a>
          </div>
        </div>

        <p className="mt-6 text-[12px] leading-relaxed text-subtle">
          Diqqat: platformadagi toʻlov shartlari arendatorlar tomonidan kiritiladi.
          Shartnoma imzolashdan oldin barcha shartlarni arendator bilan yozma
          tasdiqlang. Arendator.uz vositachi platforma boʻlib, moliyaviy
          xizmat koʻrsatuvchi tashkilot emas.
        </p>
      </div>
    </footer>
  )
}
