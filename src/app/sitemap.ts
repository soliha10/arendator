import type { MetadataRoute } from 'next'
import { prisma } from '@/lib/prisma'

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'

export const revalidate = 3600

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const staticPages: MetadataRoute.Sitemap = [
    { url: `${APP_URL}/`, changeFrequency: 'daily', priority: 1 },
    { url: `${APP_URL}/elonlar`, changeFrequency: 'hourly', priority: 0.9 },
    { url: `${APP_URL}/arendatorlar`, changeFrequency: 'weekly', priority: 0.7 },
    { url: `${APP_URL}/kalkulyator`, changeFrequency: 'monthly', priority: 0.6 },
    { url: `${APP_URL}/haqida`, changeFrequency: 'yearly', priority: 0.3 },
    { url: `${APP_URL}/qollanma`, changeFrequency: 'monthly', priority: 0.4 },
    { url: `${APP_URL}/shartlar`, changeFrequency: 'yearly', priority: 0.2 },
    { url: `${APP_URL}/maxfiylik`, changeFrequency: 'yearly', priority: 0.2 },
    { url: `${APP_URL}/aloqa`, changeFrequency: 'yearly', priority: 0.3 },
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

    return [
      ...staticPages,
      ...listings.map((l) => ({
        url: `${APP_URL}/elon/${l.slug}`,
        lastModified: l.updatedAt,
        changeFrequency: 'weekly' as const,
        priority: 0.8,
      })),
      ...profiles.map((p) => ({
        url: `${APP_URL}/arendator/${p.slug}`,
        lastModified: p.updatedAt,
        changeFrequency: 'weekly' as const,
        priority: 0.5,
      })),
    ]
  } catch {
    // Baza mavjud boʻlmasa ham sitemap buzilmasin
    return staticPages
  }
}
