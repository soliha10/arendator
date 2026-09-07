# Arendator

Avtomobilni **rassrochka**, lizing va uzoq muddatli **arendaga** olish uchun eʼlonlar
platformasi. Arendatorlar avtomobil maʼlumotlari va toʻlov shartlarini oʻzlari
kiritadi — tizim oylik toʻlovni, jami ustamani va **toʻliq oyma-oy grafikni**
avtomatik hisoblaydi. Xaridorlar esa takliflarni filtrlaydi va **yonma-yon
taqqoslaydi**.

---

## Asosiy imkoniyatlar

**Xaridorlar uchun**
- Oylik toʻlov, boshlangʻich toʻlov, muddat, marka, viloyat va yana 12 ta mezon boʻyicha filtr
- 4 tagacha avtomobilni yonma-yon taqqoslash — eng qulay qiymatlar avtomatik ajratiladi
- Har bir shart uchun **yillik va oyma-oy grafik**: toʻlov, asosiy qarz, ustama, qoldiq
- Grafikni CSV formatida yuklab olish
- Taqqoslashni havola orqali ulashish
- Sevimlilar, ariza qoldirish, arendator profillari va sharhlar

**Arendatorlar uchun**
- 4 bosqichli eʼlon formasi: avtomobil → tavsif → rasmlar → toʻlov shartlari
- Bitta eʼlonga 6 tagacha shart (12 / 24 / 36 oy va h.k.)
- **Uch xil hisoblash usuli**:
  | Usul | Mantiq |
  |---|---|
  | `ANNUITY` | Foiz har oy qolgan qarzga hisoblanadi (bank/lizing standarti) |
  | `FLAT` | Foiz butun summaga bir marta qoʻshilib, oylarga teng boʻlinadi |
  | `FIXED` | Arendator oylik toʻlovni kiritadi, tizim **samarali yillik foizni teskari hisoblaydi** (bisection/IRR) |
- Formaning oʻng tomonida **jonli hisob-kitob** — grafik darhol koʻrinadi
- Arizalarni holat boʻyicha boshqarish, statistika

**Administrator uchun**
- Eʼlonlarni moderatsiya qilish (tasdiqlash / sabab bilan rad etish)
- Arendatorlarni tasdiqlash, foydalanuvchilarni bloklash
- Valyuta kursini boshqarish, amallar jurnali (audit log)

---

## Texnologiyalar

| Qatlam | Tanlov |
|---|---|
| Framework | Next.js 16 (App Router, Server Actions, Turbopack) |
| Til | TypeScript (strict) |
| UI | React 19, Tailwind CSS v4, Radix UI primitivlari |
| ORM | Prisma 7 + `@prisma/adapter-pg` (driver adapter) |
| Baza | PostgreSQL 14+ |
| Auth | Oʻz JWT sessiyasi (`jose`) + `bcryptjs`, httpOnly cookie |
| Validatsiya | Zod v4 — bitta sxema klientda ham, serverda ham |
| Rasmlar | `sharp` (WebP + LQIP blur) → lokal disk yoki S3/R2 (`aws4fetch`) |
| Testlar | `node:test` + `tsx` |

---

## Ishga tushirish (lokal)

Talablar: **Node.js 20+**, **PostgreSQL 14+**.

```bash
# 1. Bogʻliqliklar
npm install

# 2. Muhit oʻzgaruvchilari
cp .env.example .env
#    DATABASE_URL va DIRECT_URL ni oʻzingizning bazangizga moslang
#    AUTH_SECRET ni yarating:  openssl rand -base64 32

# 3. Baza
createdb arendator
npm run db:migrate      # jadvallarni yaratadi
npm run db:seed         # 33 ta demo eʼlon, 110 shart, 2500+ grafik qatori

# 4. Ishga tushirish
npm run dev             # http://localhost:3000
```

### Demo hisoblar

Parol hammasi uchun bir xil: **`parol12345`**

| Rol | Telefon |
|---|---|
| Administrator | `+998901112233` |
| Arendator | `+998901234501` (Avto Kredit Servis) |
| Arendator | `+998901234502` (Mashina Lizing) |
| Foydalanuvchi | `+998905551100` |

---

## Skriptlar

| Buyruq | Vazifasi |
|---|---|
| `npm run dev` | Dev server |
| `npm run build` | Production build (avval `prisma generate`) |
| `npm start` | Production serverni ishga tushirish |
| `npm test` | Moliyaviy modul testlari (23 ta) |
| `npm run typecheck` | TypeScript tekshiruvi |
| `npm run lint` | ESLint |
| `npm run db:migrate` | Dev migratsiya yaratish/qoʻllash |
| `npm run db:deploy` | Prod migratsiyalarni qoʻllash |
| `npm run db:seed` | Demo maʼlumot yuklash |
| `npm run db:studio` | Prisma Studio |
| `npm run shots` | Asosiy sahifalar skrinshotlari (yorugʻ + qorongʻi) |

---

## Loyiha tuzilishi

```
prisma/
  schema.prisma          # 13 model, 11 enum
  seed.ts                # demo maʼlumot generatori
  placeholder.ts         # demo rasmlar (offline SVG)
src/
  app/
    (main)/              # ommaviy sahifalar (header + footer)
    (auth)/              # kirish, roʻyxatdan oʻtish
    kabinet/             # foydalanuvchi va arendator kabineti
    admin/               # moderatsiya paneli
    api/upload/          # rasm yuklash
  components/
    ui/                  # tugma, input, dialog, tab… (Radix ustida)
    listing/             # karta, galereya, grafik jadvali
    listing-form/        # 4 bosqichli eʼlon formasi + jonli kalkulyator
    catalog/             # filtrlar paneli, saralash, chip'lar
  lib/
    finance.ts           # ⭐ toʻlov grafigi hisoblash (toza modul, testlangan)
    validation/          # Zod sxemalari
    auth/                # jwt, parol, guard'lar
    storage.ts           # rasm saqlash (local | s3)
  server/
    listings.ts          # katalog soʻrovlari
    plan-service.ts      # shart + grafikni saqlash/sinxronlash
    actions/             # Server Action'lar
  proxy.ts               # /kabinet va /admin uchun tez auth tekshiruvi
scripts/
  screenshots.mts        # vizual tekshiruv
```

### Nega shunday qilingan

- **`lib/finance.ts` — toza modul.** Prisma, React yoki Date'dan boshqa hech
  narsaga bogʻliq emas. Shu sabab u bir vaqtning oʻzida serverda (grafikni bazaga
  yozishda), brauzerda (formadagi jonli hisob) va testlarda ishlaydi. Natija hamma
  joyda **bir xil** — bu ishonchning asosi.
- **Yaxlitlash.** Pul butun songa (UZS) yoki 2 kasr xonaga (USD) yaxlitlanadi,
  oxirgi oy qoldiqni toʻliq yopadi. Shu sabab grafik yigʻindisi doim jami summaga
  teng va oxirgi qoldiq aniq `0` boʻladi.
- **Denormalizatsiya.** `Listing` jadvalida `minMonthlyPaymentUzs`,
  `minDownPaymentUzs`, `carPriceUzs`, `minTermMonths` ustunlari saqlanadi va
  indekslanadi — katalog filtrlari `RentalPlan` jadvaliga JOIN qilmasdan ishlaydi.
- **Valyuta.** Har bir summa oʻz valyutasida va soʻmga oʻgirilgan holda saqlanadi
  (`ExchangeRate` jadvalidagi kurs boʻyicha) — shu sabab USD va UZS eʼlonlarini
  bir jadvalda taqqoslash mumkin.
- **Auth.** NextAuth oʻrniga ~150 qatorlik oʻz sessiya qatlami: httpOnly JWT
  cookie + `tokenVersion`. Parol oʻzgarganda `tokenVersion` oshadi va barcha eski
  sessiyalar bekor boʻladi. `proxy.ts` imzoni tez tekshiradi, sahifa ichidagi
  `requireUser()` esa bazadan bloklanganlikni ham tekshiradi.

---

## Joylashtirish (deploy)

Baza har doim **alohida servis** — Next.js ilovasining oʻz bazasi yoʻq.

### Variant A. Vercel + boshqariladigan Postgres

1. Postgres oching (Neon, Railway, Render, Aiven).
2. Vercel'ga ulang va env oʻzgaruvchilarni kiriting:
   ```
   DATABASE_URL   = <pooled connection string>      # Neon'da -pooler bor URL
   DIRECT_URL     = <direct connection string>      # migratsiyalar uchun
   AUTH_SECRET    = <openssl rand -base64 32>
   NEXT_PUBLIC_APP_URL = https://sizning-domen.uz
   STORAGE_DRIVER = s3
   S3_ENDPOINT / S3_BUCKET / S3_PUBLIC_URL / S3_ACCESS_KEY_ID / S3_SECRET_ACCESS_KEY
   ```
3. Migratsiyalar: `npx prisma migrate deploy` (CI'da yoki lokaldan).

> ⚠️ **Serverless'da rasmlarni diskka yozib boʻlmaydi** — har deploy'da yoʻqoladi.
> Shu sabab prod'da `STORAGE_DRIVER=s3` (Cloudflare R2 arzon va S3 bilan mos).
> Rasm domenini `next.config.ts` dagi `images.remotePatterns` ga qoʻshing.

> ⚠️ **Connection pool.** Serverless har soʻrovda yangi ulanish ochadi. Neon/PgBouncer'ning
> **pooled** URL'ini ishlating; `src/lib/prisma.ts` Vercel'da pool hajmini
> avtomatik `1` ga tushiradi.

### Variant B. Bitta VPS (Docker)

Ilova ham, baza ham bitta serverda. Ma'lumot Oʻzbekiston ichida qoladi.

```bash
cp .env.example .env
# .env ichida kamida shular boʻlsin:
#   POSTGRES_PASSWORD=...
#   AUTH_SECRET=...            (openssl rand -base64 32)
#   NEXT_PUBLIC_APP_URL=https://sizning-domen.uz

docker compose up -d --build
docker compose exec web npx prisma migrate deploy
docker compose exec web npm run db:seed        # ixtiyoriy
```

Oldiga Nginx/Caddy qoʻyib SSL ulang. Rasmlar `uploads` volume'ida saqlanadi —
zaxira nusxa olishni unutmang:

```bash
docker compose exec db pg_dump -U arendator arendator > backup.sql
docker run --rm -v arendator_uploads:/data -v $PWD:/out alpine \
  tar czf /out/uploads.tar.gz -C /data .
```

---

## Xavfsizlik

- Parollar `bcrypt` (12 rounds); mavjud boʻlmagan foydalanuvchi uchun ham
  hash tekshiruvi bajariladi (*timing attack*'ga qarshi).
- Sessiya — `HS256` imzolangan JWT, `httpOnly` + `sameSite=lax` cookie,
  prod'da `secure`.
- Server Action'larda har safar egalik tekshiriladi (`ownerId === user.id`).
- Yuklangan rasmlar MIME va hajm boʻyicha tekshiriladi, `sharp` orqali qayta
  kodlanadi (EXIF va yashirin yuk tozalanadi).
- Ariza yuborishda spam himoyasi: bir raqamdan bir eʼlonga soatiga 1 marta.
- Foydalanuvchi bloklanganda `tokenVersion` oshadi — barcha qurilmalardan chiqadi.
- `X-Content-Type-Options`, `Referrer-Policy`, `X-Frame-Options`,
  `Permissions-Policy` sarlavhalari oʻrnatilgan.
- `/kabinet` va `/admin` `robots.txt` da yopilgan.

---

## Keyingi qadamlar

Loyihaning tabiiy davomi:

- SMS orqali telefon tasdigʻi (Eskiz/Play Mobile)
- Xaridor ↔ arendator ichki chati
- Toʻlov kunlari boʻyicha eslatmalar (Telegram bot)
- Eʼlonlarni koʻtarish / TOP qilish (monetizatsiya)
- Ruscha tarjima (`next-intl`)
- To'liq matnli qidiruv (Postgres `tsvector` + trigram)
