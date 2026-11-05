# Shaverma SPB — Frontend

Telefonga o'rnatiladigan PWA (Next.js App Router + TypeScript + Zustand).

## Struktura

```
src/
├── app/            # Next.js App Router — /, /cart, /order/[id], /admin, /admin/malyy-57
├── components/
│   ├── features/   # ProductCard, CartList, CartPage, OrderStatusPage, AdminPage,
│   │               # MenuStopList, AddressSheet, ContactStep, PromoCards...
│   └── layout/     # Header, BottomNavigation, CategoryTabs, SplashScreen, PwaRegister
├── hooks/          # useCart, useStopList, useGeolocation, useAdminPush, useOrderPush
├── lib/            # api.ts (backend bilan aloqa), push.ts, utils.ts, geo.ts, shiftCutoff.ts
├── store/          # cartStore, orderStore, customerStore, myOrdersStore (Zustand)
├── styles/         # globals.css
└── data/           # menuItems.ts, cafes.ts (backend'dagi nusxa bilan bir xil bo'lishi kerak)
public/
├── manifest*.webmanifest   # mijoz ilovasi + admin panel uchun alohida PWA manifest
└── sw.js                   # service worker — Web Push bildirishnomalarini ko'rsatadi
```

## Ishga tushirish (lokal)

```bash
npm install
cp .env.local.example .env.local   # NEXT_PUBLIC_API_BASE_URL'ni backend manzili bilan to'ldiring
npm run dev
```

## Sahifalar

- **`/`** — asosiy menyu (kategoriyalar, mahsulotlar, savat paneli) va
  tayyorlanayotgan buyurtma bo'lsa — uning holatiga havola.
- **`/cart`** — savat, olib ketish/yetkazib berish tanlovi, ism va telefon,
  "Заказать" tugmasi.
- **`/order/[id]?t=<token>`** — mijozning buyurtma holati (jonli yangilanadi)
  va "Готов" bo'lganda push-bildirishnoma yoqish tugmasi.
- **`/admin`** — filialning parol bilan himoyalangan
  admin paneli: buyurtmalar (real-vaqt + rington + push), holatni o'zgartirish,
  stop-list. Har biri telefonga alohida ilova sifatida o'rnatiladi.

## Push-bildirishnomalar

iPhone'da Web Push faqat **bosh ekranga o'rnatilgan** ilovada ishlaydi
(Safari → "Поделиться" → "На экран «Домой»"). Ilova bu holatni o'zi aniqlab,
kerakli ko'rsatmani chiqaradi.

## Testlar

```bash
npm test
```

Vitest + React Testing Library — asosiy komponentlar (Cart, OrderStatus, Admin,
ProductCard, AddressSheet, MenuStopList), hook'lar va yordamchi funksiyalar sinaladi.

## Production'ga deploy

Hozirgi deploy — Selectel VPS'dagi Dokploy, [Dockerfile](Dockerfile) orqali
(Build Path `/frontend`). `NEXT_PUBLIC_API_BASE_URL` build paytida kodga
yopishtiriladi — u Dockerfile'da build argumenti sifatida berilgan; backend
manzili o'zgarsa, shu argumentni yangilang. Backend'ning `FRONTEND_URL`i shu
frontend manziliga ishora qilishi kerak (CORS).
