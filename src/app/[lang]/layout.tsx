import type { Metadata, Viewport } from 'next'
import { notFound } from 'next/navigation'
import { Inter, Manrope } from 'next/font/google'
import './globals.css'
import { Providers } from '@/components/providers'
import { themeInitScript } from '@/components/layout/theme-toggle'
import { Analytics } from '@/components/analytics'
import { SITE } from '@/lib/site'
import { LOCALES, LOCALE_LABELS, isLocale, localizeHref, type Locale } from '@/i18n/config'
import { messagesFor } from '@/i18n/messages'
import { I18nProvider } from '@/i18n/client'
import { alternatesFor, ogAlternateLocales, ogLocale } from '@/i18n/seo'

const inter = Inter({ variable: '--font-inter', subsets: ['latin', 'cyrillic'] })
const manrope = Manrope({ variable: '--font-manrope', subsets: ['latin', 'cyrillic'] })

export function generateStaticParams() {
  return LOCALES.map((lang) => ({ lang }))
}

export async function generateMetadata({ params }: LayoutProps<'/[lang]'>): Promise<Metadata> {
  const { lang } = await params
  const locale: Locale = isLocale(lang) ? lang : 'uz'
  const t = messagesFor(locale).common.site
  return {
    metadataBase: new URL(SITE.url),
    title: {
      default: `${SITE.name} — ${t.title}`,
      template: `%s · ${SITE.name}`,
    },
    description: t.description,
    applicationName: SITE.name,
    keywords: t.keywords.split(',').map((k) => k.trim()),
    openGraph: {
      type: 'website',
      locale: ogLocale(locale),
      alternateLocale: ogAlternateLocales(locale),
      siteName: SITE.name,
      url: localizeHref('/', locale),
    },
    twitter: { card: 'summary_large_image' },
    alternates: alternatesFor('/', locale),
    robots: { index: true, follow: true },
    verification: {
      google: process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION || undefined,
      yandex: process.env.NEXT_PUBLIC_YANDEX_VERIFICATION || undefined,
    },
  }
}

/** Qidiruv tizimlari uchun: tashkilot va sayt ichidagi qidiruv */
function siteJsonLd(locale: Locale) {
  const home = `${SITE.url}${localizeHref('/', locale) === '/' ? '' : localizeHref('/', locale)}`
  return {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'Organization',
        '@id': `${SITE.url}/#org`,
        name: SITE.name,
        url: SITE.url,
        logo: `${SITE.url}/icon.svg`,
        contactPoint: {
          '@type': 'ContactPoint',
          telephone: SITE.phone,
          contactType: 'customer service',
          areaServed: 'UZ',
          availableLanguage: ['uz', 'ru', 'en'],
        },
      },
      {
        '@type': 'WebSite',
        '@id': `${SITE.url}/#website`,
        name: SITE.name,
        url: home,
        inLanguage: LOCALE_LABELS[locale].htmlLang,
        publisher: { '@id': `${SITE.url}/#org` },
        potentialAction: {
          '@type': 'SearchAction',
          target: `${SITE.url}${localizeHref('/elonlar', locale)}?q={search_term_string}`,
          'query-input': 'required name=search_term_string',
        },
      },
    ],
  }
}

export const viewport: Viewport = {
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#ffffff' },
    { media: '(prefers-color-scheme: dark)', color: '#0a1220' },
  ],
  width: 'device-width',
  initialScale: 1,
  // Notch'li telefonlarda sahifa ekranning chetigacha choziladi —
  // xavfsiz zonalarni env(safe-area-inset-*) orqali oʻzimiz boshqaramiz.
  viewportFit: 'cover',
}

export default async function RootLayout({ children, params }: LayoutProps<'/[lang]'>) {
  const { lang } = await params
  if (!isLocale(lang)) notFound()
  const locale = lang

  return (
    <html
      lang={LOCALE_LABELS[locale].htmlLang}
      suppressHydrationWarning
      className={`${inter.variable} ${manrope.variable} h-full`}
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(siteJsonLd(locale)).replace(/</g, '\\u003c') }}
        />
      </head>
      <body className="flex min-h-full flex-col">
        <I18nProvider locale={locale} messages={messagesFor(locale)}>
          <Providers>{children}</Providers>
        </I18nProvider>
        <Analytics />
      </body>
    </html>
  )
}
