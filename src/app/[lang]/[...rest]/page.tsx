import { notFound } from 'next/navigation'

/** Mavjud bo'lmagan har qanday manzil — [lang]/not-found.tsx ko'rsatiladi */
export default function CatchAll() {
  notFound()
}
