import type { Metadata } from 'next'
import { getRates } from '@/server/exchange'
import { Calc, type CalcInitial } from './calculator'
import { SCHEMES, type SchemeId } from './schemes'
import { getLocale, getMessages } from '@/i18n/server'
import { alternatesFor, ogLocale } from '@/i18n/seo'

export async function generateMetadata(): Promise<Metadata> {
  const [m, locale] = await Promise.all([getMessages(), getLocale()])
  const t = m.calculator.meta
  return {
    title: t.title,
    description: t.description,
    alternates: alternatesFor('/kalkulyator', locale),
    openGraph: { title: t.title, description: t.description, locale: ogLocale(locale) },
  }
}

const num = (v: string | string[] | undefined, fallback: number, min: number, max: number) => {
  const n = Number(Array.isArray(v) ? v[0] : v)
  return Number.isFinite(n) && n >= min && n <= max ? n : fallback
}

export default async function CalculatorPage(props: PageProps<'/[lang]/kalkulyator'>) {
  const sp = await props.searchParams
  const [rates, m] = await Promise.all([getRates(), getMessages()])
  const t = m.calculator.hero
  const currency = sp.v === 'USD' ? 'USD' : 'UZS'
  const schemeRaw = Array.isArray(sp.sxema) ? sp.sxema[0] : sp.sxema
  const carRaw = Array.isArray(sp.avto) ? sp.avto[0] : sp.avto

  // Havola orqali kelgan hisob — noto'g'ri qiymatlar standartga qaytadi
  const initial: CalcInitial = {
    price: num(sp.narx, currency === 'USD' ? 16_000 : 200_000_000, 1, 1e12),
    currency,
    downPercent: Math.round(num(sp.bosh, 30, 0, 70) / 5) * 5,
    term: num(sp.muddat, 36, 6, 120),
    scheme: SCHEMES.some((s) => s.id === schemeRaw) ? (schemeRaw as SchemeId) : 'lizing',
    rates: {
      rassrochka: num(sp.r1, SCHEMES[0].defaultRate, 0, 100),
      lizing: num(sp.r2, SCHEMES[1].defaultRate, 0, 100),
      arenda: num(sp.r3, SCHEMES[2].defaultRate, 0, 100),
    },
    car: (carRaw ?? '').slice(0, 60),
  }

  return (
    <div>
      <div className="border-b border-border bg-surface-2/60">
        <div className="container-page pb-24 pt-8 sm:pt-10">
          <p className="flex flex-wrap items-center gap-2 text-[12px]">
            <span className="rounded-full bg-primary-soft px-2.5 py-1 font-bold uppercase tracking-wider text-primary">
              {t.badge}
            </span>
            <span className="text-muted">{t.hint}</span>
          </p>
          <h1 className="mt-3 max-w-3xl text-[30px] font-extrabold leading-[1.1] text-text sm:text-[44px]">
            {t.title}
          </h1>
          <p className="mt-3 max-w-2xl text-[15px] leading-relaxed text-muted sm:text-[16px]">
            {t.subtitle}
          </p>
        </div>
      </div>

      <div className="container-page -mt-16 pb-6">
        <Calc initial={initial} usdRate={rates.USD} />
        <p className="mt-8 text-[12px] leading-relaxed text-subtle">
          {t.disclaimer}
        </p>
      </div>
    </div>
  )
}
