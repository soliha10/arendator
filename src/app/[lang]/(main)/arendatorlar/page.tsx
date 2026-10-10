import { permanentRedirect } from 'next/navigation'
import { localizeHref } from '@/i18n/config'
import { getLocale } from '@/i18n/server'

/** Eski manzil: katalog /dilerlar ga ko'chdi (SEO uchun 308), til saqlanadi */
export default async function ArendatorsRedirect() {
  permanentRedirect(localizeHref('/dilerlar', await getLocale()))
}
