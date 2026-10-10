import type { Metadata } from 'next'
import { Prose, ProseBlocks } from '@/components/prose'
import { fmt } from '@/i18n/format'
import { alternatesFor, ogLocale } from '@/i18n/seo'
import { getLocale, getMessages } from '@/i18n/server'
import { SITE } from '@/lib/site'

export async function generateMetadata(): Promise<Metadata> {
  const [m, locale] = await Promise.all([getMessages(), getLocale()])
  const t = m.pages.terms
  return {
    title: t.metaTitle,
    description: fmt(t.metaDescription, { name: SITE.name }),
    alternates: alternatesFor('/shartlar', locale),
    openGraph: { locale: ogLocale(locale) },
  }
}

export default async function TermsPage() {
  const m = await getMessages()
  const t = m.pages.terms
  return (
    <div className="container-page py-8 lg:py-12">
      <Prose title={t.title} updatedAt={m.pages.common.updatedDate}>
        <ProseBlocks blocks={t.blocks} vars={{ name: SITE.name, email: SITE.email }} />
      </Prose>
    </div>
  )
}
