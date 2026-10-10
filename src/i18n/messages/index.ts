import type { Locale } from '../config'
import uz, { type Messages } from './uz'
import ru from './ru'
import en from './en'

export type { Messages }

const ALL: Record<Locale, Messages> = { uz, ru, en }

export function messagesFor(locale: Locale): Messages {
  return ALL[locale]
}
