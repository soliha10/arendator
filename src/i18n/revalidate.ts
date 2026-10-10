import 'server-only'
import { revalidatePath } from 'next/cache'
import { LOCALES } from './config'

/**
 * Sahifalar app/[lang] ichida — '/elonlar' aslida '/uz/elonlar',
 * '/ru/elonlar', '/en/elonlar'. Keshni uchala til uchun tozalaydi.
 */
export function revalidateLocalized(path: string, type?: 'layout' | 'page') {
  for (const l of LOCALES) {
    const p = path === '/' ? `/${l}` : `/${l}${path}`
    if (type) revalidatePath(p, type)
    else revalidatePath(p)
  }
}
