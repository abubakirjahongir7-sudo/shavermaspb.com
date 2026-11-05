# Shaverma SPB

Telefonga o'rnatiladigan PWA ilova — shaverma menyusi va buyurtma (bitta filial — Гражданский пр., 39Б: самовывоз + доставка) hamda admin panel.

```
├── frontend/   # Next.js (App Router) + TypeScript + Zustand — PWA (/, /cart, /order/[id], /admin, /admin/malyy-57)
└── backend/    # Express API + PostgreSQL (Prisma) + Web Push
```

Har bir qism o'z README'siga ega — u yerda struktura, `.env` o'zgaruvchilari
va deploy qadamlari batafsil yozilgan: [frontend/README.md](frontend/README.md),
[backend/README.md](backend/README.md).

## Arxitektura — qisqacha

- Mijoz PWA'da buyurtma beradi (ism va telefonni o'zi kiritadi) → frontend
  backend'ning HTTP API'siga (`POST /api/orders`) murojaat qiladi → backend
  narxlarni o'z menyusidan qayta hisoblab, buyurtmani yozadi va mijozga
  maxfiy kuzatuv tokenini qaytaradi.
- Mijoz `/order/[id]` sahifasida buyurtma holatini jonli kuzatadi va
  xohlasa "Готов" bo'lganda telefoniga push-bildirishnoma oladi.
- Kafe egasi buyurtmalarni admin panel (`/admin`,
  parol bilan) orqali boshqaradi; yangi buyurtma kelganda telefoniga push
  keladi (ilova yopiq yoki telefon uyquda bo'lsa ham).

## Ishga tushirish

```bash
cd backend && npm install && cp .env.example .env && npm run prisma:migrate && npm run dev
cd frontend && npm install && cp .env.local.example .env.local && npm run dev
```

## Testlar

Yangi kod eskisini buzmasligi uchun ikkala qismda ham avtomatik testlar bor
(Vitest). Kod o'zgartirgandan keyin ishga tushirib ko'ring:

```bash
cd backend && npm test
cd frontend && npm test
```

## Deploy

Ikkala qism ham Dockerfile bilan keladi va hozir Selectel VPS'dagi Dokploy'da
ishlaydi (har biri `main` branch'ga push qilinganda avtomatik deploy bo'ladi).
Kerakli `.env` o'zgaruvchilari — [backend/README.md](backend/README.md#productionga-deploy)
va [frontend/README.md](frontend/README.md#productionga-deploy)da.
