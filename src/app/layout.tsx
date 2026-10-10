import type { Metadata, Viewport } from 'next'
import { Geist, Geist_Mono } from 'next/font/google'
import './globals.css'
import { Providers } from '@/components/providers'
import { themeInitScript } from '@/components/layout/theme-toggle'

const geistSans = Geist({ variable: '--font-geist-sans', subsets: ['latin'] })
const geistMono = Geist_Mono({ variable: '--font-geist-mono', subsets: ['latin'] })

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'

export const metadata: Metadata = {
  metadataBase: new URL(APP_URL),
  title: {
    default: 'Arendator — avtomobil rassrochka va arendaga',
    template: '%s · Arendator',
  },
  description:
    'Oʻzbekistonda avtomobilni rassrochka va arendaga olish platformasi. Boshlangʻich toʻlov, oylik toʻlov va toʻliq yillik grafik — bir joyda taqqoslang.',
  keywords: [
    'avtomobil rassrochka', 'mashina rassrochkaga', 'avto arenda',
    'lizing', 'Oʻzbekiston', 'boshlangʻich toʻlov', 'oylik toʻlov',
  ],
  openGraph: {
    type: 'website',
    locale: 'uz_UZ',
    siteName: 'Arendator',
  },
  robots: { index: true, follow: true },
}

export const viewport: Viewport = {
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#f7f8fa' },
    { media: '(prefers-color-scheme: dark)', color: '#0b0e14' },
  ],
  width: 'device-width',
  initialScale: 1,
  // Notch'li telefonlarda sahifa ekranning chetigacha choziladi —
  // xavfsiz zonalarni env(safe-area-inset-*) orqali oʻzimiz boshqaramiz.
  viewportFit: 'cover',
}

export default function RootLayout({ children }: LayoutProps<'/'>) {
  return (
    <html
      lang="uz"
      suppressHydrationWarning
      className={`${geistSans.variable} ${geistMono.variable} h-full`}
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
      </head>
      <body className="flex min-h-full flex-col">
        <Providers>{children}</Providers>
      </body>
    </html>
  )
}
