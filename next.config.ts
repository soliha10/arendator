import type { NextConfig } from 'next'

/**
 * S3/R2 public domenini `next/image` uchun ochamiz.
 * S3_PUBLIC_URL qo'yilmagan bo'lsa (lokal dev) ro'yxat bo'sh qoladi.
 */
function storageRemotePatterns(): NonNullable<
  NonNullable<NextConfig['images']>['remotePatterns']
> {
  const publicUrl = process.env.S3_PUBLIC_URL
  if (!publicUrl) return []
  let parsed: URL
  try {
    parsed = new URL(publicUrl)
  } catch {
    throw new Error(`S3_PUBLIC_URL yaroqli URL emas: ${publicUrl}`)
  }
  return [
    {
      protocol: parsed.protocol === 'http:' ? 'http' : 'https',
      hostname: parsed.hostname,
    },
  ]
}

const nextConfig: NextConfig = {
  // Docker/VPS uchun minimal server to'plami (Vercel bunga eʼtibor bermaydi)
  output: process.env.BUILD_STANDALONE === '1' ? 'standalone' : undefined,
  // Loyiha ildizini aniq belgilaymiz — aks holda Turbopack uy katalogini qamrab oladi
  turbopack: { root: import.meta.dirname },
  images: {
    // Demo rasmlar SVG formatida generatsiya qilingan.
    // SVG ichida skript ishlamasligi uchun sandbox CSP qoʻyilgan.
    dangerouslyAllowSVG: true,
    contentDispositionType: 'attachment',
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
    formats: ['image/avif', 'image/webp'],
    // S3_PUBLIC_URL env'idan avtomatik olinadi — qo'lda tahrirlash shart emas.
    remotePatterns: storageRemotePatterns(),
  },
  experimental: {
    // Server Action'ga yuboriladigan maksimal hajm (rasm yuklash uchun)
    serverActions: { bodySizeLimit: '8mb' },
  },
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=(self)',
          },
        ],
      },
    ]
  },
}

export default nextConfig
