import { NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth/guards'
import { saveImage, UploadError } from '@/lib/storage'
import { MAX_LISTING_IMAGES } from '@/lib/constants'

/**
 * Rasm yuklash. Server Action o'rniga Route Handler ishlatilyapti,
 * chunki bu yerda bir nechta faylni parallel yuborish va progress
 * kuzatish qulayroq.
 */
export async function POST(request: Request) {
  const user = await getCurrentUser()
  if (!user) {
    return NextResponse.json({ error: 'Avtorizatsiya talab qilinadi' }, { status: 401 })
  }
  if (user.role === 'USER') {
    return NextResponse.json(
      { error: 'Rasm yuklash uchun arendator hisobingiz boʻlishi kerak' },
      { status: 403 },
    )
  }

  let formData: FormData
  try {
    formData = await request.formData()
  } catch {
    return NextResponse.json({ error: 'Notoʻgʻri soʻrov' }, { status: 400 })
  }

  const files = formData.getAll('files').filter((f): f is File => f instanceof File)
  if (files.length === 0) {
    return NextResponse.json({ error: 'Fayl tanlanmadi' }, { status: 400 })
  }
  if (files.length > MAX_LISTING_IMAGES) {
    return NextResponse.json(
      { error: `Bir vaqtda koʻpi bilan ${MAX_LISTING_IMAGES} ta rasm` },
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
      return NextResponse.json({ error: error.message }, { status: 400 })
    }
    console.error('upload:', error)
    return NextResponse.json({ error: 'Rasmni saqlab boʻlmadi' }, { status: 500 })
  }
}
