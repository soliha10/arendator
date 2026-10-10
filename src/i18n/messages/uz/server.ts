/**
 * Server Action javoblari va bildirishnoma shablonlari.
 * Bildirishnoma bazaga tur + data bilan yoziladi, matn esa ko'rsatish
 * paytida o'quvchining tilida shu shablonlardan yasaladi.
 */
const server = {
  errors: {
    generic: 'Amalni bajarib boʻlmadi',
    authExpired: 'Avtorizatsiya muddati tugadi. Qaytadan kiring.',
    forbidden: 'Ruxsat yoʻq',
    listingNotFound: 'Eʼlon topilmadi',
    listingInactive: 'Bu eʼlon endi faol emas',
    deleteFailed: 'Oʻchirib boʻlmadi',
    invalidRequest: 'Notoʻgʻri soʻrov',
  },
  listing: {
    saved: 'Eʼlon saqlandi va moderatsiyaga yuborildi',
    draftSaved: 'Qoralama saqlandi',
    saveFailed: 'Eʼlonni saqlab boʻlmadi. Qayta urinib koʻring.',
    noEditRights: 'Bu eʼlonni tahrirlashga ruxsatingiz yoʻq',
    modelMismatch: 'Tanlangan model markaga mos kelmadi',
    modelReselect: 'Modelni qayta tanlang',
    regionNotFound: 'Viloyat topilmadi',
    paused: 'Eʼlon vaqtincha toʻxtatildi',
    activated: 'Eʼlon faollashtirildi',
    archived: 'Eʼlon arxivlandi',
    rented: 'Eʼlon "berilgan" deb belgilandi',
    statusFailed: 'Holatni oʻzgartirib boʻlmadi',
    deleted: 'Eʼlon oʻchirildi',
    deleteFailed: 'Eʼlonni oʻchirib boʻlmadi',
  },
  lead: {
    ownListing: 'Oʻz eʼloningizga ariza qoldira olmaysiz',
    duplicate: 'Siz bu eʼlonga yaqinda ariza qoldirgansiz. Eʼlon beruvchi tez orada bogʻlanadi.',
    sent: 'Arizangiz yuborildi. Eʼlon beruvchi tez orada siz bilan bogʻlanadi.',
    sendFailed: 'Arizani yuborib boʻlmadi. Qayta urinib koʻring.',
    notFound: 'Ariza topilmadi',
    noRights: 'Bu arizani oʻzgartirishga ruxsatingiz yoʻq',
    statusUpdated: 'Ariza holati yangilandi',
    statusFailed: 'Holatni yangilab boʻlmadi',
  },
  savedSearch: {
    loginRequired: 'Qidiruvni saqlash uchun tizimga kiring',
    needFilter: 'Avval kamida bitta filtr tanlang',
    exists: 'Bu qidiruv allaqachon saqlangan',
    limit: 'Koʻpi bilan {max} ta qidiruv saqlash mumkin',
    saved: 'Qidiruv saqlandi. Mos eʼlon chiqsa xabar beramiz.',
    saveFailed: 'Qidiruvni saqlab boʻlmadi',
    notifyOn: 'Xabarnomalar yoqildi',
    notifyOff: 'Xabarnomalar oʻchirildi',
    deleted: 'Qidiruv oʻchirildi',
  },
  notifications: {
    readAll: '{n} ta bildirishnoma oʻqildi',
    noneUnread: 'Yangi bildirishnoma yoʻq',
    prefSaved: 'Sozlama saqlandi',
    prefFailed: 'Sozlamani saqlab boʻlmadi',
    prefInvalid: 'Notoʻgʻri sozlama',
  },
  promotion: {
    invalidPlan: 'Notoʻgʻri paket',
    onlyActive: 'Faqat faol eʼlonni koʻtarish mumkin',
    pending: 'Soʻrovingiz koʻrib chiqilmoqda',
    requested: '{title} soʻrovi yuborildi. Menejer toʻlov boʻyicha siz bilan bogʻlanadi.',
    requestFailed: 'Soʻrovni yuborib boʻlmadi',
    notFound: 'Soʻrov topilmadi',
    approved: 'Paket faollashtirildi',
    rejected: 'Soʻrov rad etildi',
  },
  moderation: {
    approved: 'Eʼlon tasdiqlandi va chop etildi',
    rejected: 'Eʼlon rad etildi',
  },
  upload: {
    authRequired: 'Avtorizatsiya talab qilinadi',
    badRequest: 'Notoʻgʻri soʻrov',
    noFile: 'Fayl tanlanmadi',
    tooMany: 'Bir vaqtda koʻpi bilan {max} ta rasm',
    failed: 'Rasmni saqlab boʻlmadi',
    empty: 'Fayl boʻsh',
    tooLarge: 'Rasm hajmi {mb} MB dan oshmasligi kerak',
    badType: 'Faqat JPG, PNG, WebP yoki AVIF rasm yuklash mumkin',
    unreadable: 'Rasmni oʻqib boʻlmadi',
  },
  admin: {
    profileNotFound: 'Profil topilmadi',
    dealerVerified: 'Diler tasdiqlandi',
    verificationRemoved: 'Tasdiq bekor qilindi',
    cannotBlockSelf: 'Oʻzingizni bloklay olmaysiz',
    userNotFound: 'Foydalanuvchi topilmadi',
    cannotBlockAdmin: 'Administratorni bloklab boʻlmaydi',
    userBlocked: 'Foydalanuvchi bloklandi',
    userUnblocked: 'Blok olib tashlandi',
    rateInvalid: 'Kurs musbat son boʻlishi kerak',
    valueInvalid: 'Notoʻgʻri qiymat',
    rateUpdated: 'Kurs yangilandi. Yangi eʼlonlar shu kurs boʻyicha hisoblanadi.',
    rateFailed: 'Kursni yangilab boʻlmadi',
  },
  profile: {
    updated: 'Profil yangilandi',
    emailTaken: 'Bu email band',
    emailTakenField: 'Bu email boshqa hisobda ishlatilgan',
    updateFailed: 'Profilni yangilab boʻlmadi',
    companyUpdated: 'Kompaniya maʼlumotlari yangilandi',
    companyCreated: 'Diler profili yaratildi',
    companyFailed: 'Maʼlumotlarni saqlab boʻlmadi',
  },
  /** Bildirishnoma matnlari — {listing}, {name} va h.k. data'dan */
  notify: {
    priceDrop: {
      title: 'Saqlangan eʼloningiz narxi arzonlashdi!',
      body: '{listing} narxi {old} dan {new} ga tushdi.',
    },
    leadNew: {
      title: 'Eʼloningiz boʻyicha yangi xaridor arizasi!',
      body: '{name} “{listing}” eʼloningizga ariza qoldirdi.',
    },
    leadStatus: {
      title: 'Arizangiz holati: {status}',
      body: '“{listing}” boʻyicha arizangiz koʻrib chiqildi.',
    },
    listingApproved: {
      title: 'Eʼloningiz tasdiqlandi va chop etildi',
      body: '{listing} endi katalogda koʻrinadi.',
    },
    listingRejected: {
      title: 'Eʼloningiz rad etildi',
      body: '{listing}: {reason}. Tahrirlab qayta yuboring.',
      noReason: 'sabab koʻrsatilmagan',
    },
    savedSearch: {
      title: '“{search}” qidiruvingizga yangi eʼlon',
      body: '{listing} — siz saqlagan shartlarga mos keladi.',
    },
    weeklyStats: {
      title: 'Haftalik eʼlonlar statistikasi tayyor',
      body: 'Oʻtgan haftada eʼlonlaringiz koʻrishlar soni oshdi. Kabinetda batafsil koʻring.',
    },
    promotionApproved: {
      title: '{tier} paketi faollashtirildi',
      body: '“{listing}” {days} kun davomida yuqorida koʻrsatiladi.',
    },
    promotionRejected: {
      title: '{tier} soʻrovi rad etildi',
      body: '“{listing}” boʻyicha soʻrov tasdiqlanmadi.',
    },
  },
}

export default server
