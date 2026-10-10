/** Seed uchun statik ma'lumotlar */

export const REGIONS = [
  'Toshkent shahri',
  'Toshkent viloyati',
  'Andijon',
  'Buxoro',
  'Fargʻona',
  'Jizzax',
  'Xorazm',
  'Namangan',
  'Navoiy',
  'Qashqadaryo',
  'Qoraqalpogʻiston',
  'Samarqand',
  'Sirdaryo',
  'Surxondaryo',
]

export const BRANDS: Record<string, string[]> = {
  Chevrolet: [
    'Cobalt', 'Nexia 3', 'Gentra', 'Malibu', 'Tracker', 'Onix',
    'Spark', 'Captiva', 'Equinox', 'Monza', 'Damas', 'Labo', 'Traverse',
  ],
  Kia: ['K5', 'Sportage', 'Sorento', 'Seltos', 'Rio', 'Cerato', 'Carnival'],
  Hyundai: ['Sonata', 'Tucson', 'Elantra', 'Santa Fe', 'Creta', 'Accent', 'Palisade'],
  Toyota: ['Camry', 'Corolla', 'RAV4', 'Land Cruiser', 'Land Cruiser Prado', 'Highlander'],
  BYD: ['Song Plus', 'Chazor', 'Han', 'Seal', 'Dolphin'],
  Changan: ['CS35 Plus', 'CS55 Plus', 'UNI-T', 'Eado Plus', 'Alsvin'],
  Volkswagen: ['Polo', 'Tiguan', 'Passat', 'Jetta'],
  Nissan: ['X-Trail', 'Qashqai', 'Almera'],
  Lada: ['Vesta', 'Granta', 'Niva'],
  Ravon: ['R2', 'R3 Nexia', 'R4'],
  'Mercedes-Benz': ['E-Class', 'C-Class', 'GLE'],
  BMW: ['3 Series', '5 Series', 'X5'],
}

/** Brend ranglari — placeholder rasmlar uchun */
export const BRAND_COLORS: Record<string, [string, string]> = {
  Chevrolet: ['#c9a227', '#3d2f00'],
  Kia: ['#bb162b', '#3a0710'],
  Hyundai: ['#00559a', '#001f3a'],
  Toyota: ['#c8102e', '#3a0009'],
  BYD: ['#0b7a5a', '#03291f'],
  Changan: ['#1f4e79', '#0a1a29'],
  Volkswagen: ['#0a3d7c', '#031729'],
  Nissan: ['#b00a1e', '#2e0308'],
  Lada: ['#1f6f4a', '#08281a'],
  Ravon: ['#2a6ea6', '#0b2233'],
  'Mercedes-Benz': ['#4a4f54', '#141719'],
  BMW: ['#0166b1', '#00284a'],
}

export interface SeedCar {
  brand: string
  model: string
  year: number
  price: number // UZS
  body: 'SEDAN' | 'HATCHBACK' | 'SUV' | 'CROSSOVER' | 'MINIVAN' | 'COUPE' | 'PICKUP' | 'WAGON' | 'VAN'
  transmission: 'MANUAL' | 'AUTOMATIC' | 'ROBOT' | 'VARIATOR'
  fuel: 'PETROL' | 'DIESEL' | 'GAS_PETROL' | 'HYBRID' | 'ELECTRIC'
  drive: 'FWD' | 'RWD' | 'AWD'
  engine: number
  mileage: number
  condition: 'NEW' | 'USED'
  color: string
}

export const CARS: SeedCar[] = [
  { brand: 'Chevrolet', model: 'Cobalt', year: 2024, price: 178_000_000, body: 'SEDAN', transmission: 'AUTOMATIC', fuel: 'GAS_PETROL', drive: 'FWD', engine: 1.5, mileage: 0, condition: 'NEW', color: 'Oq' },
  { brand: 'Chevrolet', model: 'Cobalt', year: 2022, price: 158_000_000, body: 'SEDAN', transmission: 'MANUAL', fuel: 'GAS_PETROL', drive: 'FWD', engine: 1.5, mileage: 46_000, condition: 'USED', color: 'Kumush' },
  { brand: 'Chevrolet', model: 'Onix', year: 2024, price: 215_000_000, body: 'SEDAN', transmission: 'AUTOMATIC', fuel: 'PETROL', drive: 'FWD', engine: 1.2, mileage: 0, condition: 'NEW', color: 'Qora' },
  { brand: 'Chevrolet', model: 'Tracker', year: 2023, price: 268_000_000, body: 'CROSSOVER', transmission: 'AUTOMATIC', fuel: 'PETROL', drive: 'FWD', engine: 1.2, mileage: 21_000, condition: 'USED', color: 'Kulrang' },
  { brand: 'Chevrolet', model: 'Malibu', year: 2023, price: 395_000_000, body: 'SEDAN', transmission: 'AUTOMATIC', fuel: 'PETROL', drive: 'FWD', engine: 2.0, mileage: 33_000, condition: 'USED', color: 'Qora' },
  { brand: 'Chevrolet', model: 'Gentra', year: 2023, price: 192_000_000, body: 'SEDAN', transmission: 'AUTOMATIC', fuel: 'GAS_PETROL', drive: 'FWD', engine: 1.5, mileage: 28_000, condition: 'USED', color: 'Oq' },
  { brand: 'Chevrolet', model: 'Damas', year: 2024, price: 108_000_000, body: 'MINIVAN', transmission: 'MANUAL', fuel: 'GAS_PETROL', drive: 'RWD', engine: 0.8, mileage: 5_000, condition: 'USED', color: 'Oq' },
  { brand: 'Chevrolet', model: 'Equinox', year: 2024, price: 445_000_000, body: 'CROSSOVER', transmission: 'AUTOMATIC', fuel: 'PETROL', drive: 'AWD', engine: 1.5, mileage: 0, condition: 'NEW', color: 'Koʻk' },

  { brand: 'Kia', model: 'K5', year: 2023, price: 470_000_000, body: 'SEDAN', transmission: 'AUTOMATIC', fuel: 'PETROL', drive: 'FWD', engine: 2.0, mileage: 38_000, condition: 'USED', color: 'Qora' },
  { brand: 'Kia', model: 'Sportage', year: 2024, price: 585_000_000, body: 'CROSSOVER', transmission: 'AUTOMATIC', fuel: 'PETROL', drive: 'AWD', engine: 2.0, mileage: 12_000, condition: 'USED', color: 'Oq' },
  { brand: 'Kia', model: 'Seltos', year: 2023, price: 385_000_000, body: 'CROSSOVER', transmission: 'VARIATOR', fuel: 'PETROL', drive: 'FWD', engine: 1.6, mileage: 25_000, condition: 'USED', color: 'Qizil' },
  { brand: 'Kia', model: 'Rio', year: 2022, price: 245_000_000, body: 'SEDAN', transmission: 'AUTOMATIC', fuel: 'PETROL', drive: 'FWD', engine: 1.6, mileage: 52_000, condition: 'USED', color: 'Kumush' },

  { brand: 'Hyundai', model: 'Sonata', year: 2023, price: 495_000_000, body: 'SEDAN', transmission: 'AUTOMATIC', fuel: 'PETROL', drive: 'FWD', engine: 2.0, mileage: 30_000, condition: 'USED', color: 'Kulrang' },
  { brand: 'Hyundai', model: 'Tucson', year: 2024, price: 615_000_000, body: 'CROSSOVER', transmission: 'AUTOMATIC', fuel: 'PETROL', drive: 'AWD', engine: 2.0, mileage: 0, condition: 'NEW', color: 'Oq' },
  { brand: 'Hyundai', model: 'Elantra', year: 2023, price: 355_000_000, body: 'SEDAN', transmission: 'VARIATOR', fuel: 'PETROL', drive: 'FWD', engine: 1.6, mileage: 27_000, condition: 'USED', color: 'Koʻk' },
  { brand: 'Hyundai', model: 'Creta', year: 2024, price: 398_000_000, body: 'CROSSOVER', transmission: 'AUTOMATIC', fuel: 'PETROL', drive: 'FWD', engine: 1.6, mileage: 8_000, condition: 'USED', color: 'Qora' },

  { brand: 'Toyota', model: 'Camry', year: 2023, price: 685_000_000, body: 'SEDAN', transmission: 'AUTOMATIC', fuel: 'PETROL', drive: 'FWD', engine: 2.5, mileage: 24_000, condition: 'USED', color: 'Qora' },
  { brand: 'Toyota', model: 'Corolla', year: 2022, price: 395_000_000, body: 'SEDAN', transmission: 'VARIATOR', fuel: 'HYBRID', drive: 'FWD', engine: 1.8, mileage: 61_000, condition: 'USED', color: 'Kumush' },
  { brand: 'Toyota', model: 'RAV4', year: 2023, price: 720_000_000, body: 'CROSSOVER', transmission: 'AUTOMATIC', fuel: 'HYBRID', drive: 'AWD', engine: 2.5, mileage: 19_000, condition: 'USED', color: 'Oq' },
  { brand: 'Toyota', model: 'Land Cruiser Prado', year: 2022, price: 1_180_000_000, body: 'SUV', transmission: 'AUTOMATIC', fuel: 'DIESEL', drive: 'AWD', engine: 2.8, mileage: 74_000, condition: 'USED', color: 'Qora' },

  { brand: 'BYD', model: 'Song Plus', year: 2024, price: 465_000_000, body: 'CROSSOVER', transmission: 'AUTOMATIC', fuel: 'HYBRID', drive: 'FWD', engine: 1.5, mileage: 6_000, condition: 'USED', color: 'Oq' },
  { brand: 'BYD', model: 'Chazor', year: 2024, price: 385_000_000, body: 'CROSSOVER', transmission: 'AUTOMATIC', fuel: 'HYBRID', drive: 'FWD', engine: 1.5, mileage: 0, condition: 'NEW', color: 'Kulrang' },
  { brand: 'BYD', model: 'Seal', year: 2024, price: 620_000_000, body: 'SEDAN', transmission: 'AUTOMATIC', fuel: 'ELECTRIC', drive: 'RWD', engine: 0, mileage: 3_000, condition: 'USED', color: 'Koʻk' },

  { brand: 'Changan', model: 'CS35 Plus', year: 2024, price: 315_000_000, body: 'CROSSOVER', transmission: 'AUTOMATIC', fuel: 'PETROL', drive: 'FWD', engine: 1.6, mileage: 0, condition: 'NEW', color: 'Qizil' },
  { brand: 'Changan', model: 'Alsvin', year: 2023, price: 218_000_000, body: 'SEDAN', transmission: 'ROBOT', fuel: 'PETROL', drive: 'FWD', engine: 1.5, mileage: 22_000, condition: 'USED', color: 'Oq' },
  { brand: 'Changan', model: 'UNI-T', year: 2023, price: 425_000_000, body: 'CROSSOVER', transmission: 'AUTOMATIC', fuel: 'PETROL', drive: 'FWD', engine: 1.5, mileage: 31_000, condition: 'USED', color: 'Qora' },

  { brand: 'Volkswagen', model: 'Polo', year: 2022, price: 285_000_000, body: 'SEDAN', transmission: 'AUTOMATIC', fuel: 'PETROL', drive: 'FWD', engine: 1.6, mileage: 48_000, condition: 'USED', color: 'Kumush' },
  { brand: 'Volkswagen', model: 'Tiguan', year: 2023, price: 665_000_000, body: 'CROSSOVER', transmission: 'ROBOT', fuel: 'PETROL', drive: 'AWD', engine: 2.0, mileage: 29_000, condition: 'USED', color: 'Qora' },

  { brand: 'Nissan', model: 'X-Trail', year: 2022, price: 520_000_000, body: 'CROSSOVER', transmission: 'VARIATOR', fuel: 'PETROL', drive: 'AWD', engine: 2.5, mileage: 55_000, condition: 'USED', color: 'Kulrang' },
  { brand: 'Lada', model: 'Vesta', year: 2023, price: 185_000_000, body: 'SEDAN', transmission: 'MANUAL', fuel: 'PETROL', drive: 'FWD', engine: 1.6, mileage: 34_000, condition: 'USED', color: 'Oq' },
  { brand: 'Ravon', model: 'R3 Nexia', year: 2021, price: 132_000_000, body: 'SEDAN', transmission: 'MANUAL', fuel: 'GAS_PETROL', drive: 'FWD', engine: 1.5, mileage: 88_000, condition: 'USED', color: 'Kumush' },
  { brand: 'BMW', model: 'X5', year: 2021, price: 1_420_000_000, body: 'SUV', transmission: 'AUTOMATIC', fuel: 'DIESEL', drive: 'AWD', engine: 3.0, mileage: 68_000, condition: 'USED', color: 'Qora' },
  { brand: 'Mercedes-Benz', model: 'E-Class', year: 2022, price: 1_250_000_000, body: 'SEDAN', transmission: 'AUTOMATIC', fuel: 'PETROL', drive: 'RWD', engine: 2.0, mileage: 42_000, condition: 'USED', color: 'Kulrang' },
]

export interface SeedCompany {
  companyName: string
  fullName: string
  phone: string
  email: string
  region: string
  about: string
  verified: boolean
  workingHours: string
  telegram: string
  tags: string[]
  lat: number
  lng: number
}

export const COMPANIES: SeedCompany[] = [
  {
    companyName: 'Avto Kredit Servis',
    fullName: 'Sardor Yoʻldoshev',
    phone: '+998901234501',
    email: 'sardor@avtokredit.uz',
    region: 'Toshkent shahri',
    about:
      '2016-yildan beri avtomobillarni rassrochka va lizingga beramiz. 3000 dan ortiq mijoz. Rasmiy shartnoma, sugʻurta va texnik koʻrik narxga kiritilgan.',
    verified: true,
    workingHours: 'Dush–Shan 09:00–19:00',
    telegram: 'avtokredit_uz',
    tags: ['Muddatli toʻlov', 'Halol lizing', 'Trade-in'],
    lat: 41.2995,
    lng: 69.2401,
  },
  {
    companyName: 'Mashina Lizing',
    fullName: 'Dilshod Karimov',
    phone: '+998901234502',
    email: 'info@mashinalizing.uz',
    region: 'Toshkent viloyati',
    about:
      'Yuridik va jismoniy shaxslar uchun lizing xizmati. Boshlangʻich toʻlov 20% dan. Hujjatlar 1 kunda rasmiylashtiriladi.',
    verified: true,
    workingHours: 'Har kuni 08:00–20:00',
    telegram: 'mashina_lizing',
    tags: ['Lizing 5 yilgacha', 'Yuridik shaxslarga', 'Boshlangʻich 20% dan'],
    lat: 41.0058,
    lng: 69.0164,
  },
  {
    companyName: 'Yoʻlchi Motors',
    fullName: 'Aziz Rahimov',
    phone: '+998901234503',
    email: 'yolchi@motors.uz',
    region: 'Samarqand',
    about:
      'Samarqand va Buxoro boʻylab avtomobil arendasi. Kunlik, oylik va uzoq muddatli shartlar mavjud.',
    verified: false,
    workingHours: 'Dush–Shan 09:00–18:00',
    telegram: 'yolchi_motors',
    tags: ['Kunlik arenda', 'Oylik arenda', 'Viloyatlarga yetkazish'],
    lat: 39.6542,
    lng: 66.9597,
  },
  {
    companyName: 'Zamin Auto',
    fullName: 'Jasur Toshmatov',
    phone: '+998901234504',
    email: 'zamin@auto.uz',
    region: 'Fargʻona',
    about:
      'Ishonchli avtomobillar bozor narxidan arzon rassrochkaga. Har bir avtomobil texnik koʻrikdan oʻtkazilgan.',
    verified: true,
    workingHours: 'Dush–Juma 09:00–18:00',
    telegram: 'zamin_auto',
    tags: ['Kafilsiz rassrochka', 'Texnik koʻrikdan oʻtgan', 'Kafolat 1 yil'],
    lat: 40.3864,
    lng: 71.7864,
  },
]
