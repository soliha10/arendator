import type { Metadata } from 'next'
import { Prose, ProseBlocks } from '@/components/prose'
import { ANALYTICS } from '@/lib/analytics'
import { SITE } from '@/lib/site'
import { alternatesFor, ogLocale } from '@/i18n/seo'
import { getLocale, getMessages } from '@/i18n/server'

/** Faqat haqiqatan ulangan tizimlar sanaladi — matn doim haqiqatga mos */
const trackers = [
  ANALYTICS.gaId && 'Google Analytics',
  ANALYTICS.ymId && 'Yandex Metrika',
  ANALYTICS.metaPixelId && 'Meta Pixel (Facebook/Instagram)',
].filter(Boolean) as string[]

export async function generateMetadata(): Promise<Metadata> {
  const [m, locale] = await Promise.all([getMessages(), getLocale()])
  const t = m.pages.privacy
  return {
    title: t.metaTitle,
    description: t.metaDescription,
    alternates: alternatesFor('/maxfiylik', locale),
    openGraph: { locale: ogLocale(locale) },
  }
}

export default async function PrivacyPage() {
  const m = await getMessages()
  const t = m.pages.privacy
  const vars = { name: SITE.name, email: SITE.email, trackers: trackers.join(', ') }
  return (
    <div className="container-page py-8 lg:py-12">
      <Prose title={t.title} updatedAt={m.pages.common.updatedDate}>
        <ProseBlocks
          blocks={[
            ...t.blocks,
            { h2: t.cookiesTitle },
            { p: trackers.length > 0 ? t.cookiesOn : t.cookiesOff },
            { h2: t.rightsTitle },
            { p: t.rights },
          ]}
          vars={vars}
        />
      </Prose>
    </div>
  )
}
