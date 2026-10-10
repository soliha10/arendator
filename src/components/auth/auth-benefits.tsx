import { Bell, Calculator, FileText, Headphones, Lock, Scale } from 'lucide-react'
import { formatPhone } from '@/lib/format'
import { SITE } from '@/lib/site'
import { fmt } from '@/i18n/format'
import { getMessages } from '@/i18n/server'

export async function AuthBenefits() {
  const m = await getMessages()
  const t = m.auth.benefits
  /** Faqat platformada haqiqatan ishlaydigan imkoniyatlar sanaladi */
  const BENEFITS = [
    { icon: Calculator, title: t.calcTitle, text: t.calcText },
    { icon: Scale, title: t.compareTitle, text: t.compareText },
    { icon: Bell, title: t.alertTitle, text: t.alertText },
    { icon: FileText, title: t.cabinetTitle, text: t.cabinetText },
  ]
  return (
    <div className="space-y-4">
      <section className="rounded-2xl border border-border bg-surface p-5 sm:p-7">
        <h2 className="text-[20px] font-bold text-text">{fmt(t.title, { name: SITE.name })}</h2>
        <p className="mt-1 text-[13px] text-muted">{t.subtitle}</p>
        <ul className="mt-6 space-y-5">
          {BENEFITS.map((b) => (
            <li key={b.title} className="flex gap-3.5">
              <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary-soft text-primary">
                <b.icon className="size-5" aria-hidden />
              </span>
              <span>
                <span className="block text-[15px] font-semibold text-text">{b.title}</span>
                <span className="mt-0.5 block text-[13px] leading-relaxed text-muted">{b.text}</span>
              </span>
            </li>
          ))}
        </ul>
      </section>

      <section className="flex gap-3.5 rounded-2xl border border-border bg-surface-2 p-5">
        <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-success-soft text-success">
          <Lock className="size-5" aria-hidden />
        </span>
        <p className="text-[13px] leading-relaxed text-muted">
          <span className="block text-[15px] font-semibold text-text">{t.securityTitle}</span>
          {t.securityText}
        </p>
      </section>

      <section className="rounded-2xl border border-border bg-surface p-5">
        <p className="inline-flex items-center gap-2 text-[15px] font-semibold text-text">
          <Headphones className="size-5 text-primary" aria-hidden /> {t.helpTitle}
        </p>
        <p className="mt-1.5 text-[13px] leading-relaxed text-muted">
          {fmt(t.helpText, { hours: m.common.footer.workingHours })}
        </p>
        <a
          href={`tel:${SITE.phone}`}
          className="font-display tabular mt-3 inline-block text-[22px] font-extrabold text-primary hover:underline"
        >
          {formatPhone(SITE.phone)}
        </a>
      </section>
    </div>
  )
}
