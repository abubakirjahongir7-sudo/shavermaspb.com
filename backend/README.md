# Shaverma SPB — Backend

HTTP API (Express) + PostgreSQL (Prisma) + Web Push. PWA buyurtmalari, mijozning
buyurtma kuzatuvi va admin panel API'si shu bitta Node process'da ishlaydi.

## Struktura

```
src/
├── config/         # default.js — .env o'zgaruvchilarini o'qiydi
├── core/
│   ├── server.js        # Express: /api/orders, /api/admin/*, /api/stop-list, /api/push
│   └── sseClients.js    # admin panelga real-vaqtda "yangi buyurtma" signali (SSE)
├── database/       # connection.js — Prisma client
├── models/         # Order.js, StoppedItem.js, PushSubscription.js, CustomerPushSubscription.js
├── controllers/
│   ├── orderApiController.js    # buyurtma yaratish, mijoz kuzatuvi, admin buyurtma endpointlari
│   ├── stopListController.js    # mahsulotni "tugadi" deb belgilash (filial bo'yicha)
│   └── pushController.js        # admin qurilmalarining push obunasi
├── middlewares/    # adminAuth.middleware.js
├── utils/          # logger.js, pushNotifications.js
├── data/           # menuItems.js, cafes.js — frontend bilan bir xil bo'lishi kerak (TODO: umumlashtirish)
└── index.js        # ishga tushirish nuqtasi (HTTP server)
```

## Ishga tushirish (lokal)

```bash
npm install
cp .env.example .env   # pastdagi jadvaldan kerakli qiymatlarni to'ldiring
npm run prisma:migrate
npm run dev
```

## Muhim o'zgaruvchilar (.env)

| O'zgaruvchi | Majburiymi | Tavsif |
|---|---|---|
| `DATABASE_URL` | ha | PostgreSQL ulanish satri (Prisma formatida) |
| `FRONTEND_URL` | deploy uchun ha | PWA'ning to'liq HTTPS manzili — CORS faqat shundan kelgan so'rovlarga ruxsat beradi |
| `PORT` | yo'q (default 3001) | HTTP server porti |
| `ADMIN_PASSWORD` | admin panel uchun ha | `/admin` sahifalari va admin API'siga kirish paroli |
| `VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY` | push uchun ha | Web Push kalitlari (`npx web-push generate-vapid-keys`). Bo'sh bo'lsa push o'chiq |
| `VAPID_SUBJECT` | yo'q | Push xizmatlari uchun aloqa manzili (`https://...` yoki `mailto:...`) |

To'liq izohlar bilan namuna: [.env.example](.env.example).

## Buyurtmalar oqimi

1. Mijoz PWA'da savatni to'ldiradi, ism va telefonni kiritadi, "Заказать"ni bosadi.
2. Frontend `POST /api/orders`ga so'rov yuboradi. Server har bir mahsulot
   narxini/summani `data/menuItems.js`dan qayta hisoblaydi — mijoz yuborgan
   narxga ishonilmaydi — va filial stop-listini qayta tekshiradi.
3. Buyurtma bazaga yoziladi; admin panellarga real-vaqt (SSE) signali va shu
   filial admin qurilmalariga push yuboriladi. Javobda mijozga `orderId` va
   maxfiy `trackingToken` qaytadi.
4. Mijoz `GET /api/orders/:id?t=<token>` orqali holatni kuzatadi va xohlasa
   `POST /api/orders/:id/push` orqali shu buyurtma bildirishnomalariga obuna bo'ladi.
5. Admin panelda status o'zgartiriladi (`PENDING → CONFIRMED → READY → DELIVERED`,
   yoki `CANCELLED`) — har bir o'zgarishda mijozga push boradi.

## Boshqa funksiyalar

- **Har filial uchun alohida stop-list** — kafe egasi admin panelning "Меню"
  bo'limidan mahsulotni "tugadi" deb belgilashi mumkin; bu faqat o'sha
  filialga taalluqli ([StoppedItem.js](src/models/StoppedItem.js)).
- **Real-vaqt yangilanish (SSE)** — `GET /api/admin/orders/stream` yangi
  buyurtma kelganda admin panelga signal yuboradi (5s pollingga qo'shimcha).

## Testlar

```bash
npm test
```

Vitest + Supertest — HTTP API'ning validatsiyasi, auth, buyurtma oqimi va push
mantiqi shu yerda sinaladi (mock bazaga, real DB/push serverlariga so'rovsiz).

## Production'ga deploy

Hozirgi deploy — Selectel VPS'dagi Dokploy, [Dockerfile](Dockerfile) orqali
(Build Path `/backend`). Konteyner ishga tushganda `npm start` avval
`prisma migrate deploy` ni bajaradi, keyin serverni yoqadi. Yuqoridagi
jadvaldagi `.env` o'zgaruvchilarini Dokploy'ning Environment bo'limida kiriting.

## TODO / ma'lum kamchiliklar

- `data/menuItems.js` va `data/cafes.js` frontend'dagi nusxalari bilan qo'lda
  sinxronlanadi (frontend'dagi `menuItemsSync.test.ts` farqni ushlaydi).

## To'lov va yetkazib berish

- **Karta/SBP (ЮKassa):** `.env` da `YOOKASSA_SHOP_ID`, `YOOKASSA_SECRET_KEY` va `FRONTEND_URL` berilsa yoqiladi. ЮKassa kabinetida bildirishnoma manzili: `https://<backend-domen>/api/payments/yookassa` (`payment.succeeded`, `payment.canceled`).
- Karta buyurtmasi oshxonaga to'lov tasdiqlangandan keyin chiqadi. To'langan buyurtma bekor qilinsa, pul avtomatik qaytariladi.
- **Kuryer (Yandex Доставка):** kafening o'z kuryeri yo'q. `YANDEX_DELIVERY_TOKEN`, `CAFE_PHONE`, `CAFE_EMAIL` va ЮKassa kalitlari bo'lmasa, yetkazib berish o'chiq. Yetkazib berish faqat oldindan karta bilan to'lanadi. Admin "Вызвать курьера" bosadi, holat har 10 soniyada Yandex'dan olinadi.
- **Yetkazib berish:** narx zonalari va eng kam summa [src/data/delivery.js](src/data/delivery.js) da, masofa kafe koordinatasidan hisoblanadi ([src/data/cafes.js](src/data/cafes.js)).
