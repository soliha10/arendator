import type { Locale } from './config'

/**
 * Validatsiya xabarlari tarjimasi.
 *
 * Zod sxemalari (src/lib/validation) o'zbekcha matn bilan yoziladi va
 * server hamda brauzerda bir xil ishlaydi. Xabar foydalanuvchiga
 * ko'rsatilayotgan paytda shu yerda tarjima qilinadi: avval aniq moslik,
 * keyin "{label} kamida {n} boʻlsin" kabi shablonlar.
 * Topilmagan xabar o'zgarmay qaytadi — hech qachon bo'sh qolmaydi.
 */
type Dict = Record<string, string>

const EXACT: Record<Exclude<Locale, 'uz'>, Dict> = {
  ru: {
    'Maʼlumotlarda xatolik bor': 'В данных есть ошибки',
    'Avtosalon yoki kompaniya nomini kiriting': 'Введите название автосалона или компании',
    'Baho qoʻying': 'Поставьте оценку',
    'Boshlangʻich toʻlov avtomobil narxidan kam boʻlishi kerak': 'Первый взнос должен быть меньше цены автомобиля',
    'Ism-familiyangizni toʻliq kiriting': 'Введите полное имя и фамилию',
    'Ism-familiyani kiriting': 'Введите имя и фамилию',
    'Ismingizni kiriting': 'Введите ваше имя',
    'Joriy parolni kiriting': 'Введите текущий пароль',
    'Juda uzun': 'Слишком длинно',
    'Kamida bitta rasm yuklang': 'Загрузите хотя бы одно фото',
    'Kamida bitta sotuv formatini tanlang: naqd, muddatli toʻlov yoki arenda':
      'Выберите хотя бы один формат продажи: наличные, рассрочка или аренда',
    'Markani tanlang': 'Выберите марку',
    'Modelni tanlang': 'Выберите модель',
    'Naqd sotuv narxini kiriting': 'Введите цену продажи за наличные',
    'Nomni kiriting': 'Введите название',
    'Notoʻgʻri identifikator': 'Неверный идентификатор',
    'Notoʻgʻri email manzil': 'Неверный email',
    'Notoʻgʻri havola': 'Неверная ссылка',
    'Oylik toʻlov juda kichik — bu muddatda qarz yopilmaydi. Muddatni yoki summani tekshiring.':
      'Слишком маленький платёж — долг не будет погашен за этот срок. Проверьте срок или сумму.',
    'Oylik toʻlovni kiriting': 'Введите ежемесячный платёж',
    'Parol juda uzun': 'Пароль слишком длинный',
    'Parol kamida 8 ta belgidan iborat boʻlsin': 'Пароль должен содержать не менее 8 символов',
    'Parolda kamida bitta harf va bitta raqam boʻlsin': 'Пароль должен содержать хотя бы одну букву и одну цифру',
    'Parollar mos kelmadi': 'Пароли не совпадают',
    'Parolni kiriting': 'Введите пароль',
    'Rad etish sababini yozing': 'Укажите причину отклонения',
    'Sarlavha juda uzun': 'Заголовок слишком длинный',
    'Sarlavha kamida 6 ta belgidan iborat boʻlsin': 'Заголовок должен содержать не менее 6 символов',
    'Shart nomini kiriting': 'Введите название условия',
    'Shartlarga rozilik bildiring': 'Подтвердите согласие с условиями',
    'STIR 9 ta raqamdan iborat': 'ИНН состоит из 9 цифр',
    'Telefon raqami +998 XX XXX XX XX koʻrinishida boʻlishi kerak': 'Номер телефона должен быть в формате +998 XX XXX XX XX',
    'Telefon raqamini kiriting': 'Введите номер телефона',
    'Telegram username notoʻgʻri': 'Неверный Telegram username',
    'Viloyatni tanlang': 'Выберите регион',
    'Koʻpi bilan 15 ta rasm': 'Не более 15 фото',
    'Koʻpi bilan 6 ta shart': 'Не более 6 условий',
  },
  en: {
    'Maʼlumotlarda xatolik bor': 'Please check the form for errors',
    'Avtosalon yoki kompaniya nomini kiriting': 'Enter the showroom or company name',
    'Baho qoʻying': 'Please give a rating',
    'Boshlangʻich toʻlov avtomobil narxidan kam boʻlishi kerak': 'Down payment must be less than the car price',
    'Ism-familiyangizni toʻliq kiriting': 'Enter your full name',
    'Ism-familiyani kiriting': 'Enter full name',
    'Ismingizni kiriting': 'Enter your name',
    'Joriy parolni kiriting': 'Enter your current password',
    'Juda uzun': 'Too long',
    'Kamida bitta rasm yuklang': 'Upload at least one photo',
    'Kamida bitta sotuv formatini tanlang: naqd, muddatli toʻlov yoki arenda':
      'Choose at least one sale format: cash, installments or rent',
    'Markani tanlang': 'Select a make',
    'Modelni tanlang': 'Select a model',
    'Naqd sotuv narxini kiriting': 'Enter the cash price',
    'Nomni kiriting': 'Enter a name',
    'Notoʻgʻri identifikator': 'Invalid identifier',
    'Notoʻgʻri email manzil': 'Invalid email address',
    'Notoʻgʻri havola': 'Invalid link',
    'Oylik toʻlov juda kichik — bu muddatda qarz yopilmaydi. Muddatni yoki summani tekshiring.':
      'The monthly payment is too small to repay the balance in this term. Check the term or amount.',
    'Oylik toʻlovni kiriting': 'Enter the monthly payment',
    'Parol juda uzun': 'Password is too long',
    'Parol kamida 8 ta belgidan iborat boʻlsin': 'Password must be at least 8 characters',
    'Parolda kamida bitta harf va bitta raqam boʻlsin': 'Password must contain at least one letter and one digit',
    'Parollar mos kelmadi': 'Passwords do not match',
    'Parolni kiriting': 'Enter your password',
    'Rad etish sababini yozing': 'Enter a rejection reason',
    'Sarlavha juda uzun': 'Title is too long',
    'Sarlavha kamida 6 ta belgidan iborat boʻlsin': 'Title must be at least 6 characters',
    'Shart nomini kiriting': 'Enter the plan name',
    'Shartlarga rozilik bildiring': 'Please accept the terms',
    'STIR 9 ta raqamdan iborat': 'Tax ID (STIR) must be 9 digits',
    'Telefon raqami +998 XX XXX XX XX koʻrinishida boʻlishi kerak': 'Phone number must look like +998 XX XXX XX XX',
    'Telefon raqamini kiriting': 'Enter your phone number',
    'Telegram username notoʻgʻri': 'Invalid Telegram username',
    'Viloyatni tanlang': 'Select a region',
    'Koʻpi bilan 15 ta rasm': 'At most 15 photos',
    'Koʻpi bilan 6 ta shart': 'At most 6 plans',
  },
}

/** numericString() dagi maydon nomlari */
const LABELS: Record<Exclude<Locale, 'uz'>, Dict> = {
  ru: {
    Qiymat: 'Значение',
    'Avtomobil narxi': 'Цена автомобиля',
    'Boshlangʻich toʻlov': 'Первый взнос',
    'Dvigatel hajmi': 'Объём двигателя',
    'Ishlab chiqarilgan yil': 'Год выпуска',
    'Kunlik ijara': 'Аренда в сутки',
    'Kunlik jarima': 'Штраф в день',
    'Naqd narx': 'Цена за наличные',
    'Ortiqcha km narxi': 'Цена за лишний км',
    'Oylik toʻlov': 'Ежемесячный платёж',
    'Oʻrindiqlar': 'Количество мест',
    'Toʻlov kuni': 'День платежа',
    'Yillik foiz': 'Годовая ставка',
    'Yillik km limiti': 'Годовой лимит км',
    'Yurgan masofa': 'Пробег',
    Muddat: 'Срок',
    Zalog: 'Залог',
  },
  en: {
    Qiymat: 'Value',
    'Avtomobil narxi': 'Car price',
    'Boshlangʻich toʻlov': 'Down payment',
    'Dvigatel hajmi': 'Engine size',
    'Ishlab chiqarilgan yil': 'Year',
    'Kunlik ijara': 'Daily rent',
    'Kunlik jarima': 'Daily penalty',
    'Naqd narx': 'Cash price',
    'Ortiqcha km narxi': 'Extra km fee',
    'Oylik toʻlov': 'Monthly payment',
    'Oʻrindiqlar': 'Seats',
    'Toʻlov kuni': 'Payment day',
    'Yillik foiz': 'Annual rate',
    'Yillik km limiti': 'Annual km limit',
    'Yurgan masofa': 'Mileage',
    Muddat: 'Term',
    Zalog: 'Deposit',
  },
}

type PatternFn = (label: string, n?: string) => string
const PATTERNS: { re: RegExp; ru: PatternFn; en: PatternFn }[] = [
  {
    re: /^(.+) butun son boʻlishi kerak$/,
    ru: (l) => `${l}: должно быть целым числом`,
    en: (l) => `${l} must be a whole number`,
  },
  {
    re: /^(.+) son boʻlishi kerak$/,
    ru: (l) => `${l}: должно быть числом`,
    en: (l) => `${l} must be a number`,
  },
  {
    re: /^(.+) kamida ([\d.,]+) boʻlsin$/,
    ru: (l, n) => `${l}: не меньше ${n}`,
    en: (l, n) => `${l} must be at least ${n}`,
  },
  {
    re: /^(.+) koʻpi bilan ([\d.,]+) boʻlsin$/,
    ru: (l, n) => `${l}: не больше ${n}`,
    en: (l, n) => `${l} must be at most ${n}`,
  },
]

export function translateValidation(message: string, locale: Locale): string {
  if (locale === 'uz' || !message) return message
  const exact = EXACT[locale][message]
  if (exact) return exact
  for (const p of PATTERNS) {
    const m = message.match(p.re)
    if (m) {
      const label = LABELS[locale][m[1]] ?? m[1]
      return p[locale](label, m[2])
    }
  }
  return message
}

/** ActionState.fieldErrors ni to'liq tarjima qiladi */
export function translateFieldErrors(
  errors: Record<string, string[]> | undefined,
  locale: Locale,
): Record<string, string[]> | undefined {
  if (!errors || locale === 'uz') return errors
  return Object.fromEntries(
    Object.entries(errors).map(([k, list]) => [k, list.map((m) => translateValidation(m, locale))]),
  )
}
