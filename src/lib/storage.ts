import 'server-only'
import { mkdir, writeFile, unlink } from 'node:fs/promises'
import path from 'node:path'
import sharp from 'sharp'
import { nanoid } from 'nanoid'

/**
 * Rasm saqlash qatlami.
 *
 * Ikki drayver bor:
 *   local — public/uploads papkasi (dev uchun)
 *   s3    — S3 mos keluvchi xotira (Cloudflare R2, AWS S3) — prod uchun
 *
 * Ilova kodi drayverni bilmaydi: `saveImage()` chaqiradi, URL oladi.
 * Vercel'ga chiqqanda faqat STORAGE_DRIVER=s3 qilinadi.
 */

export const MAX_UPLOAD_BYTES = 8 * 1024 * 1024 // 8 MB
export const ALLOWED_MIME = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/avif',
] as const

const MAX_WIDTH = 1600
const MAX_HEIGHT = 1200
const WEBP_QUALITY = 82

export interface SavedImage {
  url: string
  width: number
  height: number
  blurDataUrl: string
}

export class UploadError extends Error {}

function assertValid(file: File) {
  if (file.size === 0) throw new UploadError('Fayl boʻsh')
  if (file.size > MAX_UPLOAD_BYTES) {
    throw new UploadError(
      `Rasm hajmi ${Math.round(MAX_UPLOAD_BYTES / 1024 / 1024)} MB dan oshmasligi kerak`,
    )
  }
  if (!ALLOWED_MIME.includes(file.type as (typeof ALLOWED_MIME)[number])) {
    throw new UploadError('Faqat JPG, PNG, WebP yoki AVIF rasm yuklash mumkin')
  }
}

/** Kichraytirilgan, WebP'ga o'girilgan rasm + blur placeholder */
async function processImage(buffer: Buffer) {
  const image = sharp(buffer, { failOn: 'error' }).rotate() // EXIF burilishini tuzatadi

  const metadata = await image.metadata()
  if (!metadata.width || !metadata.height) {
    throw new UploadError('Rasmni oʻqib boʻlmadi')
  }

  const resized = image.resize({
    width: MAX_WIDTH,
    height: MAX_HEIGHT,
    fit: 'inside',
    withoutEnlargement: true,
  })

  const { data, info } = await resized
    .webp({ quality: WEBP_QUALITY })
    .toBuffer({ resolveWithObject: true })

  // Kichik blur placeholder (LQIP)
  const blur = await sharp(buffer)
    .rotate()
    .resize(16, 16, { fit: 'inside' })
    .webp({ quality: 40 })
    .toBuffer()

  return {
    data,
    width: info.width,
    height: info.height,
    blurDataUrl: `data:image/webp;base64,${blur.toString('base64')}`,
  }
}

async function saveLocal(
  data: Buffer,
  folder: string,
  filename: string,
): Promise<string> {
  const relDir = path.join('uploads', folder)
  const absDir = path.join(process.cwd(), 'public', relDir)
  await mkdir(absDir, { recursive: true })
  await writeFile(path.join(absDir, filename), data)
  return `/${relDir.split(path.sep).join('/')}/${filename}`
}

async function saveS3(
  data: Buffer,
  folder: string,
  filename: string,
): Promise<string> {
  const endpoint = process.env.S3_ENDPOINT
  const bucket = process.env.S3_BUCKET
  const publicUrl = process.env.S3_PUBLIC_URL
  const accessKeyId = process.env.S3_ACCESS_KEY_ID
  const secretAccessKey = process.env.S3_SECRET_ACCESS_KEY

  if (!endpoint || !bucket || !publicUrl || !accessKeyId || !secretAccessKey) {
    throw new UploadError(
      'S3 sozlamalari toʻliq emas: S3_ENDPOINT, S3_BUCKET, S3_PUBLIC_URL, S3_ACCESS_KEY_ID, S3_SECRET_ACCESS_KEY kerak',
    )
  }

  // aws4fetch — SigV4 imzolovchi kichik kutubxona (AWS SDK dan ~100x yengil).
  // Cloudflare R2, AWS S3, MinIO — barchasi bilan ishlaydi.
  const { AwsClient } = await import('aws4fetch')
  const client = new AwsClient({
    accessKeyId,
    secretAccessKey,
    region: process.env.S3_REGION ?? 'auto',
    service: 's3',
  })

  const key = `${folder}/${filename}`
  const target = `${endpoint.replace(/\/$/, '')}/${bucket}/${key}`

  const response = await client.fetch(target, {
    method: 'PUT',
    body: new Uint8Array(data),
    headers: {
      'Content-Type': 'image/webp',
      'Cache-Control': 'public, max-age=31536000, immutable',
    },
  })

  if (!response.ok) {
    console.error('S3 upload failed:', response.status, await response.text())
    throw new UploadError('Rasmni xotiraga yuklab boʻlmadi')
  }

  return `${publicUrl.replace(/\/$/, '')}/${key}`
}

/** Bitta rasmni qayta ishlab saqlaydi va URL qaytaradi */
export async function saveImage(file: File, folder: string): Promise<SavedImage> {
  assertValid(file)

  const buffer = Buffer.from(await file.arrayBuffer())
  const processed = await processImage(buffer)
  const filename = `${nanoid(16)}.webp`

  const driver = process.env.STORAGE_DRIVER ?? 'local'
  const url =
    driver === 's3'
      ? await saveS3(processed.data, folder, filename)
      : await saveLocal(processed.data, folder, filename)

  return {
    url,
    width: processed.width,
    height: processed.height,
    blurDataUrl: processed.blurDataUrl,
  }
}

/** Lokal saqlangan faylni o'chiradi (S3 uchun keyinchalik kengaytiriladi) */
export async function deleteImage(url: string): Promise<void> {
  if (!url.startsWith('/uploads/')) return // tashqi yoki seed rasm
  const abs = path.join(process.cwd(), 'public', url.replace(/^\//, ''))
  await unlink(abs).catch(() => {})
}
