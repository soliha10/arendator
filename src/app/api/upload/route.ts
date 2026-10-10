import { NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth/guards'
import { saveImage, UploadError } from '@/lib/storage'
import { getRequestMessages } from '@/i18n/action'
import { fmt } from '@/i18n/format'
import { MAX_LISTING_IMAGES, MAX_UPLOAD_MB } from '@/lib/constants'

/**
 * Rasm yuklash. Server Action o'rniga Route Handler ishlatilyapti,
 * chunki bu yerda bir nechta faylni parallel yuborish va progress
 * kuzatish qulayroq.
 */
export async function POST(request: Request) {
  const t = (await getRequestMessages()).server.upload
  // Jismoniy shaxs (USER) ham e'lon beradi: rasm birinchi e'lon saqlanishidan
  // oldin yuklanadi, shuning uchun bu yerda faqat kirganlik tekshiriladi.
  const user = await getCurrentUser()
  if (!user) {
    return NextResponse.json({ error: t.authRequired }, { status: 401 })
  }

  let formData: FormData
  try {
    formData = await request.formData()
  } catch {
    return NextResponse.json({ error: t.badRequest }, { status: 400 })
  }

  const files = formData.getAll('files').filter((f): f is File => f instanceof File)
  if (files.length === 0) {
    return NextResponse.json({ error: t.noFile }, { status: 400 })
  }
  if (files.length > MAX_LISTING_IMAGES) {
    return NextResponse.json(
      { error: fmt(t.tooMany, { max: MAX_LISTING_IMAGES }) },
      { status: 400 },
    )
  }

  try {
    const images = await Promise.all(
      files.map((file) => saveImage(file, `listings/${user.id}`)),
    )
    return NextResponse.json({ images })
  } catch (error) {
    if (error instanceof UploadError) {
      if (error.code === 'failed') console.error('upload:', error.message)
      const text = error.code === 'tooLarge' ? fmt(t.tooLarge, { mb: MAX_UPLOAD_MB }) : t[error.code]
      return NextResponse.json({ error: text }, { status: error.code === 'failed' ? 500 : 400 })
    }
    console.error('upload:', error)
    return NextResponse.json({ error: t.failed }, { status: 500 })
  }
}
