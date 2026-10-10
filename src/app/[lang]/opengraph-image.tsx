import { ImageResponse } from 'next/og'
import { OG_SIZE, OgBrand, ogFonts, ogText } from '@/lib/og'
import { SITE } from '@/lib/site'
import { isLocale, localizeHref, type Locale } from '@/i18n/config'

const TEXT: Record<Locale, { title: string; points: string[]; alt: string; tagline: string }> = {
  uz: {
    title: 'Mashinani arendaga oling yoki muddatli toʻlovga xarid qiling',
    points: ['Boshlangʻich va oylik toʻlov', 'Toʻliq toʻlov grafigi', 'Tasdiqlangan dilerlar'],
    alt: 'mashina arendasi, rassrochka va lizing',
    tagline: 'Arenda · Rassrochka · Lizing',
  },
  ru: {
    title: 'Арендуйте авто или купите в рассрочку',
    points: ['Первый взнос и платёж в месяц', 'Полный график платежей', 'Проверенные дилеры'],
    alt: 'аренда авто, рассрочка и лизинг',
    tagline: 'Аренда · Рассрочка · Лизинг',
  },
  en: {
    title: 'Rent a car or buy it in installments',
    points: ['Down & monthly payments', 'Full payment schedule', 'Verified dealers'],
    alt: 'car rental, installments and leasing',
    tagline: 'Rent · Installments · Leasing',
  },
}

export const alt = SITE.name
export const size = OG_SIZE
export const contentType = 'image/png'

export default async function Image({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = await params
  const locale: Locale = isLocale(lang) ? lang : 'uz'
  const t = TEXT[locale]
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          padding: 72,
          background: 'linear-gradient(135deg,#eff4ff 0%,#ffffff 55%,#e5eeff 100%)',
          fontFamily: 'Manrope',
          color: '#0b1c30',
        }}
      >
        <OgBrand tagline={ogText(t.tagline)} />
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
          <div style={{ fontSize: 68, fontWeight: 800, lineHeight: 1.05, letterSpacing: -2, maxWidth: 980 }}>
            {ogText(t.title)}
          </div>
          <div style={{ display: 'flex', gap: 14 }}>
            {t.points.map((p) => (
              <div
                key={ogText(p)}
                style={{
                  display: 'flex',
                  padding: '10px 20px',
                  borderRadius: 999,
                  background: '#006194',
                  color: '#ffffff',
                  fontSize: 21,
                  fontWeight: 500,
                  whiteSpace: 'nowrap',
                }}
              >
                {ogText(p)}
              </div>
            ))}
          </div>
        </div>
        <div style={{ fontSize: 26, fontWeight: 500, color: '#3f4850' }}>
          {`${SITE.url.replace(/^https?:\/\//, '')}${localizeHref('/', locale) === '/' ? '' : localizeHref('/', locale)}`}
        </div>
      </div>
    ),
    { ...size, fonts: await ogFonts() },
  )
}
