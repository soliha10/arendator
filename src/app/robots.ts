import type { MetadataRoute } from 'next'
import { SITE } from '@/lib/site'

const APP_URL = SITE.url

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: ['/kabinet/', '/admin/', '/api/'],
      },
    ],
    sitemap: `${APP_URL}/sitemap.xml`,
  }
}
