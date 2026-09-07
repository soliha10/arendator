import type { Metadata } from 'next'
import { Mail, MapPin, Phone, Send } from 'lucide-react'
import { Prose } from '@/components/prose'

export const metadata: Metadata = {
  title: 'Bogʻlanish',
  description: 'Savol, taklif yoki shikoyat uchun biz bilan bogʻlaning.',
}

const CONTACTS = [
  { icon: Phone, label: 'Telefon', value: '+998 71 200 00 00', href: 'tel:+998712000000' },
  { icon: Mail, label: 'Email', value: 'info@arendator.uz', href: 'mailto:info@arendator.uz' },
  { icon: Send, label: 'Telegram', value: '@arendator_uz', href: 'https://t.me/' },
  { icon: MapPin, label: 'Manzil', value: 'Toshkent shahri', href: null },
]

export default function ContactPage() {
  return (
    <div className="container-page py-8 lg:py-12">
      <Prose title="Bogʻlanish">
        <p>
          Savol, taklif yoki eʼlon boʻyicha shikoyatingiz boʻlsa — bizga yozing.
          Ish kunlari 24 soat ichida javob beramiz.
        </p>
      </Prose>

      <div className="mx-auto mt-8 grid max-w-3xl gap-3 sm:grid-cols-2">
        {CONTACTS.map((c) => {
          const inner = (
            <>
              <c.icon className="size-5 text-primary" />
              <p className="mt-3 text-[12px] uppercase tracking-wide text-subtle">
                {c.label}
              </p>
              <p className="mt-0.5 text-[15px] font-semibold text-text">{c.value}</p>
            </>
          )
          return c.href ? (
            <a
              key={c.label}
              href={c.href}
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
        <strong>Firibgarlikka duch keldingizmi?</strong> Agar arendator shartnomasiz
        oldindan toʻlov soʻrasa yoki eʼlondagi shartlarni oʻzgartirsa — darhol bizga
        xabar bering. Eʼlon havolasini va suhbat skrinshotini yuboring.
      </div>
    </div>
  )
}
