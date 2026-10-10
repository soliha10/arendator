/**
 * Matnli sahifalar. Blok ichida: **qalin**, [matn](/yo'l); {name}, {email} — o'zgaruvchi.
 */
export type ProseBlock = { h2: string } | { h3: string } | { p: string } | { ul: string[] }

const pages = {
  common: {
    updated: 'Oxirgi yangilanish: {date}',
    updatedDate: '2026-yil oktabr',
  },
  notFound: {
    title: 'Sahifa topilmadi',
    text: 'Siz izlagan sahifa oʻchirilgan yoki manzil notoʻgʻri kiritilgan boʻlishi mumkin. Eʼlon esa arxivlangan boʻlishi ham mumkin.',
    home: 'Bosh sahifa',
    listings: 'Eʼlonlarni koʻrish',
  },
  error: {
    title: 'Nimadir notoʻgʻri ketdi',
    text: 'Kutilmagan xatolik yuz berdi. Sahifani qayta yuklab koʻring — muammo takrorlansa, biz bilan bogʻlaning.',
    code: 'Xato kodi: {code}',
    retry: 'Qayta urinish',
  },
  about: {
    metaTitle: 'Loyiha haqida',
    metaDescription: '{name} — avtomobil arendasi, muddatli toʻlov va lizing eʼlonlari uchun ochiq platforma.',
    title: 'Loyiha haqida',
    blocks: [
      { p: '**{name}** — avtomobilni arendaga, muddatli toʻlovga (rassrochka) yoki lizingga olish uchun eʼlonlar platformasi. Maqsadimiz — bu bozordagi eng katta muammoni hal qilish: **shartlarning noaniqligi**.' },
      { h2: 'Muammo' },
      { p: 'Odatiy eʼlonlarda faqat «boshlangʻich toʻlov 30 mln, oyiga 6 mln» deb yoziladi. Xaridor jami qancha toʻlashini, ustama necha foiz ekanini va grafik qanday boʻlishini faqat ofisga borgandan keyin biladi.' },
      { h2: 'Yechim' },
      {
        ul: [
          'Eʼlon beruvchi narx, boshlangʻich toʻlov, muddat va foizni kiritadi — tizim **oylik toʻlovni, jami summani va oyma-oy grafikni** oʻzi hisoblaydi.',
          'Uch xil hisoblash usuli qoʻllab-quvvatlanadi: annuitet (qoldiqqa foiz), oddiy ustama va tayyor oylik toʻlov. Oxirgi holatda tizim **samarali yillik foizni teskari hisoblab** chiqaradi — xaridor haqiqiy ustamani koʻradi.',
          'Xaridor 4 tagacha avtomobilni yonma-yon taqqoslaydi: oylik toʻlov, jami toʻlov, ustama ulushi, sugʻurta va mulk huquqi shartlari bir jadvalda.',
          'Saqlangan eʼlon arzonlashsa yoki saqlangan qidiruvga mos yangi eʼlon chiqsa — bildirishnoma keladi.',
        ],
      },
      { h2: 'Biz nima emasmiz' },
      { p: '{name} moliyaviy tashkilot emas, kredit bermaydi va shartnoma tuzmaydi. Biz — eʼlonlar platformasi. Barcha toʻlov shartlari eʼlon beruvchilar tomonidan kiritiladi va ular oʻz maʼlumotlari uchun javobgardir.' },
      { h2: 'Boshlash' },
      { p: '[Eʼlonlarni koʻring](/elonlar), [kalkulyatorda hisoblang](/kalkulyator) yoki [diler sifatida roʻyxatdan oʻting](/royxatdan-otish?turi=yuridik).' },
    ] as ProseBlock[],
  },
  guide: {
    metaTitle: 'Qoʻllanma va FAQ',
    metaDescription: 'Eʼlon joylash va toʻlov shartlarini toʻgʻri kiritish boʻyicha qoʻllanma.',
    title: 'Eʼlon beruvchilar uchun qoʻllanma',
    blocks: [
      { p: 'Eʼlon joylash bepul. Quyidagi qadamlar xaridor ishonchini oshiradi va arizalar sonini koʻpaytiradi.' },
      { h2: '1. Roʻyxatdan oʻting' },
      { p: '[Diler sifatida](/royxatdan-otish?turi=yuridik) yoki jismoniy shaxs sifatida roʻyxatdan oʻting va kompaniya maʼlumotlarini toʻldiring. STIR va hujjatlar tekshirilgach hisobingizga **«Tasdiqlangan»** belgisi qoʻyiladi — bunday eʼlonlar qidiruvda ustunlik oladi.' },
      { h2: '2. Avtomobil maʼlumotlarini kiriting' },
      { p: 'Marka, model, yil, yurgan masofa va texnik xususiyatlar. Rost maʼlumot yozing — mos kelmasa eʼlon rad etiladi.' },
      { h2: '3. Sifatli rasmlar yuklang' },
      {
        ul: [
          'Kamida 4–6 ta rasm: old, yon, orqa, salon, panel;',
          'Kunduzi, yaxshi yoritilgan joyda suratga oling;',
          'Birinchi rasm muqova boʻladi — eng yaxshisini tanlang.',
        ],
      },
      { h2: '4. Sotuv formati va toʻlov shartlari' },
      { p: 'Naqd sotuv, muddatli toʻlov (rassrochka), lizing va arenda — bir nechtasini birga tanlashingiz mumkin. Muddatli toʻlov uchun uchta hisoblash usulidan birini tanlaysiz:' },
      {
        ul: [
          '**Annuitet** — foiz har oy qolgan qarzga hisoblanadi. Bank va lizing kompaniyalari shu usuldan foydalanadi. Ustama eng kam chiqadi.',
          '**Oddiy ustama** — foiz butun summaga bir marta qoʻshilib, oylarga teng boʻlinadi. Hisoblash sodda, lekin ustama yuqoriroq.',
          '**Oylik toʻlovni oʻzim kiritaman** — siz aniq summani yozasiz, tizim samarali yillik foizni teskari hisoblaydi. Odatda avtosalonlar shu usulda ishlaydi.',
        ],
      },
      { p: 'Har bir shart uchun grafik avtomatik quriladi va formaning oʻng tomonida natijani darhol koʻrasiz.' },
      { h3: 'Bir nechta shart qoʻshing' },
      { p: '12 / 24 / 36 oylik variantlar taklif qilingan eʼlonlar bitta sharti bor eʼlonlardan koʻproq ariza oladi — xaridor oʻz imkoniyatiga mos variantni tanlaydi.' },
      { h2: '5. Moderatsiyani kuting' },
      { p: 'Eʼlon tekshiruvdan oʻtadi (odatda bir necha soat). Rad etilsa, sabab koʻrsatiladi — tuzatib qayta yuborishingiz mumkin.' },
      { h2: '6. Arizalarga tez javob bering' },
      { p: '[Arizalar](/kabinet/arizalar) boʻlimida har bir murojaat holatini belgilab boring. Tez javob — koʻproq bitim.' },
      { h2: 'Nima rad etiladi' },
      {
        ul: [
          'Rasm yoʻq yoki internetdan olingan rasmlar;',
          'Toʻlov shartlari kiritilmagan yoki haqiqatga mos kelmaydi;',
          'Bitta avtomobil bir necha marta joylangan;',
          'Eʼlon matnida boshqa saytga havola yoki reklama.',
        ],
      },
      { h2: 'Koʻp beriladigan savollar' },
      { h3: 'Eʼlon joylash pullikmi?' },
      { p: 'Yoʻq, oddiy eʼlon bepul. Eʼlonni yuqoriga koʻtarish (VIP / TOP) ixtiyoriy pullik xizmat.' },
      { h3: 'Platforma toʻlovni qabul qiladimi?' },
      { p: 'Yoʻq. {name} faqat eʼlonlar platformasi — barcha toʻlov va shartnomalar xaridor bilan eʼlon beruvchi oʻrtasida bevosita tuziladi.' },
      { h3: 'Narxni oʻzgartirsam nima boʻladi?' },
      { p: 'Narx tushsa, eʼlonni saqlab qoʻygan xaridorlarga avtomatik bildirishnoma boradi va kartochkada eski narx chizilgan holda koʻrinadi.' },
    ] as ProseBlock[],
  },
  terms: {
    metaTitle: 'Foydalanish shartlari',
    metaDescription: '{name} platformasidan foydalanish qoidalari.',
    title: 'Foydalanish shartlari',
    blocks: [
      { p: 'Platformadan foydalanish orqali siz quyidagi shartlarga rozilik bildirasiz. Shartlar oʻzgarganda sahifadagi sana yangilanadi.' },
      { h2: '1. Platformaning maqomi' },
      { p: '{name} — eʼlonlar joylash xizmati. Platforma tomon sifatida shartnomalarda ishtirok etmaydi, toʻlovlarni qabul qilmaydi va moliyaviy xizmat koʻrsatmaydi. Barcha kelishuvlar xaridor va eʼlon beruvchi oʻrtasida bevosita tuziladi.' },
      { h2: '2. Eʼlon beruvchilarning majburiyatlari' },
      {
        ul: [
          'Faqat haqiqiy, mavjud avtomobillar haqida eʼlon joylash;',
          'Narx va toʻlov shartlarini toʻliq va toʻgʻri koʻrsatish — yashirin toʻlovlarsiz;',
          'Eʼlonda koʻrsatilgan shartlarga rioya qilish;',
          'Avtomobil sotilgan, berilgan yoki mavjud boʻlmasa, eʼlonni toʻxtatish.',
        ],
      },
      { h2: '3. Foydalanuvchilarning majburiyatlari' },
      {
        ul: [
          'Ariza qoldirishda haqiqiy maʼlumot koʻrsatish;',
          'Platformadan spam yoki firibgarlik uchun foydalanmaslik.',
        ],
      },
      { h2: '4. Moderatsiya' },
      { p: 'Har bir yangi eʼlon chop etilishidan oldin tekshiruvdan oʻtadi. Qoidalarga zid eʼlonlar rad etiladi, takroriy buzilishda hisob bloklanishi mumkin.' },
      { h2: '5. Pullik xizmatlar' },
      { p: 'VIP va TOP xizmatlari eʼlonning koʻrinishini oshiradi, lekin bitim tuzilishini kafolatlamaydi. Xizmat muddati tasdiqlangan paytdan boshlab hisoblanadi.' },
      { h2: '6. Masʼuliyat' },
      { p: 'Platforma eʼlonlardagi maʼlumotlar aniqligi va tomonlar oʻrtasidagi kelishuv bajarilishi uchun javobgar emas. Shartnoma imzolashdan oldin hujjatlarni mustaqil tekshiring.' },
      { h2: '7. Hisobni oʻchirish' },
      { p: 'Istalgan vaqtda hisobingizni oʻchirishni soʻrashingiz mumkin. Bunda eʼlonlaringiz va shaxsiy maʼlumotlaringiz oʻchiriladi.' },
    ] as ProseBlock[],
  },
  privacy: {
    metaTitle: 'Maxfiylik siyosati',
    metaDescription: 'Shaxsiy maʼlumotlar qanday yigʻiladi va ishlatiladi.',
    title: 'Maxfiylik siyosati',
    blocks: [
      { h2: 'Qanday maʼlumot yigʻamiz' },
      {
        ul: [
          '**Roʻyxatdan oʻtishda:** ism-familiya, telefon raqami, email (ixtiyoriy).',
          '**Dilerlardan:** kompaniya nomi, STIR, manzil, aloqa maʼlumotlari.',
          '**Foydalanish davomida:** saqlangan eʼlonlar va qidiruvlar, yuborilgan arizalar, bildirishnoma sozlamalari.',
          '**Eʼlon beruvchilardan:** eʼlonda koʻrsatilgan telefon, Telegram username va (ixtiyoriy) avtomobil joylashuvi koordinatalari.',
        ],
      },
      { h2: 'Maʼlumot qanday ishlatiladi' },
      {
        ul: [
          'Xizmatni koʻrsatish: eʼlonlar, arizalar, taqqoslash, bildirishnomalar;',
          'Ariza yuborganda telefon raqamingiz tegishli eʼlon beruvchiga koʻrsatiladi;',
          'Xavfsizlik: spam va firibgarlikning oldini olish.',
        ],
      },
      { h2: 'Nimalarni qilmaymiz' },
      { p: 'Shaxsiy maʼlumotlaringizni uchinchi tomonlarga sotmaymiz va reklama maqsadida uzatmaymiz.' },
      { h2: 'Parollar xavfsizligi' },
      { p: 'Parollar bcrypt algoritmi bilan shifrlab saqlanadi — hech kim, jumladan platforma xodimlari ham, parolingizni koʻra olmaydi. Parol oʻzgartirilganda barcha boshqa qurilmalardagi sessiyalar bekor qilinadi.' },
    ] as ProseBlock[],
    cookiesTitle: 'Cookie fayllar va statistika',
    cookiesOn:
      'Zarur cookie (sessiya, til va mavzu tanlovi) bilan birga, sayt tashrifi statistikasi va reklama samaradorligini oʻlchash uchun {trackers} xizmatlari ishlatiladi. Ular sahifa koʻrishlari va “Qoʻngʻiroq”, “Ariza yuborish” kabi harakatlarni anonim tarzda hisoblaydi; ism, telefon yoki parolingiz ularga uzatilmaydi. Brauzer sozlamalarida yoki reklama bloklovchi orqali bu cookie’larni oʻchirib qoʻyishingiz mumkin.',
    cookiesOff:
      'Faqat zarur cookie ishlatiladi: sessiya (tizimga kirganingizni eslab qolish), til va mavzu tanlovi. Kuzatuv (tracking) cookie ishlatilmaydi.',
    rightsTitle: 'Huquqlaringiz',
    rights: 'Maʼlumotlaringizni koʻrish, tuzatish yoki oʻchirishni soʻrashingiz mumkin — buning uchun [{email}](mailto:{email}) ga yozing.',
  },
  contact: {
    metaTitle: 'Bogʻlanish',
    metaDescription: 'Savol, taklif yoki shikoyat uchun biz bilan bogʻlaning.',
    title: 'Bogʻlanish',
    intro: 'Savol, taklif yoki eʼlon boʻyicha shikoyatingiz boʻlsa — bizga yozing. Ish kunlari 24 soat ichida javob beramiz.',
    phone: 'Telefon',
    email: 'Email',
    telegram: 'Telegram',
    address: 'Manzil',
    addressValue: 'Toshkent shahri',
    hours: 'Ish vaqti',
    fraudTitle: 'Firibgarlikka duch keldingizmi?',
    fraudText:
      'Agar eʼlon beruvchi shartnomasiz oldindan toʻlov soʻrasa yoki eʼlondagi shartlarni oʻzgartirsa — darhol bizga xabar bering. Eʼlon havolasini va suhbat skrinshotini yuboring.',
  },
}

export default pages
