import type { MetadataRoute } from 'next'
import { prisma } from '@/lib/prisma'
import { SITE } from '@/lib/site'
import { LOCALES, LOCALE_LABELS, localizeHref } from '@/i18n/config'

const APP_URL = SITE.url

export const revalidate = 3600

type Entry = Omit<MetadataRoute.Sitemap[number], 'url' | 'alternates'> & { path: string }

/**
 * Har bir sahifa uchala tilda alohida yozuv bo'lib chiqadi va har biri
 * boshqa tillardagi muqobillarini ko'rsatadi (hreflang) — Google va
 * Yandex ruscha qidiruvga ruscha sahifani beradi.
 */
function expand(entries: Entry[]): MetadataRoute.Sitemap {
  return entries.flatMap(({ path, ...rest }) => {
    const languages = Object.fromEntries(
      LOCALES.map((l) => [LOCALE_LABELS[l].htmlLang, `${APP_URL}${localizeHref(path, l)}`]),
    )
    return LOCALES.map((l) => ({
      ...rest,
      url: `${APP_URL}${localizeHref(path, l)}`,
      alternates: { languages },
    }))
  })
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const staticPages: Entry[] = [
    { path: '/', changeFrequency: 'daily', priority: 1 },
    { path: '/elonlar', changeFrequency: 'hourly', priority: 0.9 },
    { path: '/elonlar?planType=RENT', changeFrequency: 'hourly', priority: 0.85 },
    { path: '/elonlar?planType=INSTALLMENT', changeFrequency: 'hourly', priority: 0.85 },
    { path: '/elonlar?planType=LEASING', changeFrequency: 'daily', priority: 0.7 },
    { path: '/dilerlar', changeFrequency: 'weekly', priority: 0.7 },
    { path: '/kalkulyator', changeFrequency: 'monthly', priority: 0.6 },
    { path: '/haqida', changeFrequency: 'yearly', priority: 0.3 },
    { path: '/qollanma', changeFrequency: 'monthly', priority: 0.4 },
    { path: '/shartlar', changeFrequency: 'yearly', priority: 0.2 },
    { path: '/maxfiylik', changeFrequency: 'yearly', priority: 0.2 },
    { path: '/aloqa', changeFrequency: 'yearly', priority: 0.3 },
  ]

  try {
    const [listings, profiles] = await Promise.all([
      prisma.listing.findMany({
        where: { status: 'ACTIVE' },
        select: { slug: true, updatedAt: true },
        orderBy: { publishedAt: 'desc' },
        take: 5000,
      }),
      prisma.arendatorProfile.findMany({
        select: { slug: true, updatedAt: true },
        take: 1000,
      }),
    ])

    return expand([
      ...staticPages,
      ...listings.map((l) => ({
        path: `/elon/${l.slug}`,
        lastModified: l.updatedAt,
        changeFrequency: 'weekly' as const,
        priority: 0.8,
      })),
      ...profiles.map((p) => ({
        path: `/arendator/${p.slug}`,
        lastModified: p.updatedAt,
        changeFrequency: 'weekly' as const,
        priority: 0.5,
      })),
    ])
  } catch {
    // Baza mavjud boʻlmasa ham sitemap buzilmasin
    return expand(staticPages)
  }
}
