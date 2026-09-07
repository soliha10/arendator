import Link from 'next/link'
import { ArrowLeft, CalendarDays, Scale, ShieldCheck } from 'lucide-react'
import { Logo } from '@/components/layout/logo'
import { ThemeToggle } from '@/components/layout/theme-toggle'

const HIGHLIGHTS = [
  {
    icon: Scale,
    title: 'Yonma-yon taqqoslang',
    text: '4 tagacha avtomobilning oylik toʻlovi, ustamasi va jami summasi bitta jadvalda.',
  },
  {
    icon: CalendarDays,
    title: 'Toʻliq grafik',
    text: 'Har oyning toʻlovi, asosiy qarz va ustama qismi — shartnomadan oldin maʼlum.',
  },
  {
    icon: ShieldCheck,
    title: 'Tasdiqlangan arendatorlar',
    text: 'Hujjatlari tekshirilgan kompaniyalar alohida belgi bilan ajratiladi.',
  },
]

export default function AuthLayout({ children }: LayoutProps<'/'>) {
  return (
    <div className="flex min-h-dvh flex-col lg:flex-row">
      {/* Chap: forma */}
      <div className="flex flex-1 flex-col">
        <header className="flex items-center justify-between p-5">
          <Logo />
          <div className="flex items-center gap-1">
            <ThemeToggle />
            <Link
              href="/"
              className="inline-flex h-9 items-center gap-1.5 rounded-[10px] px-3 text-sm font-medium text-muted transition-colors hover:bg-surface-2 hover:text-text"
            >
              <ArrowLeft className="size-4" /> Bosh sahifa
            </Link>
          </div>
        </header>

        <main className="flex flex-1 items-center justify-center px-5 py-8">
          <div className="w-full max-w-md">{children}</div>
        </main>
      </div>

      {/* O'ng: reklama paneli */}
      <div className="hidden w-[42%] max-w-xl border-l border-border bg-surface lg:flex lg:flex-col lg:justify-center lg:p-12">
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.05]"
          style={{
            backgroundImage:
              'radial-gradient(circle at 70% 30%, var(--primary) 0, transparent 50%)',
          }}
          aria-hidden
        />
        <div className="relative">
          <h2 className="text-2xl font-bold tracking-tight text-text">
            Avtomobil rassrochkasi — shaffof shartlar bilan
          </h2>
          <p className="mt-3 text-[15px] leading-relaxed text-muted">
            Arendatorlar toʻlov shartlarini oʻzlari kiritadi, tizim esa grafikni
            avtomatik hisoblaydi. Yashirin foizlar yoʻq.
          </p>

          <ul className="mt-9 space-y-6">
            {HIGHLIGHTS.map((h) => (
              <li key={h.title} className="flex gap-4">
                <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary-soft text-primary">
                  <h.icon className="size-5" />
                </span>
                <div>
                  <h3 className="text-[15px] font-semibold text-text">{h.title}</h3>
                  <p className="mt-1 text-[13px] leading-relaxed text-muted">{h.text}</p>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  )
}
