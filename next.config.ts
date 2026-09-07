import type { NextConfig } from 'next'

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
    remotePatterns: [
      // Ishlab chiqarishda S3/R2 domenini shu yerga qoʻshing:
      // { protocol: 'https', hostname: 'cdn.arendator.uz' },
    ],
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
