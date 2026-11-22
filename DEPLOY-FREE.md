# Bepul hostingga ko'chirish (Neon + Netlify)

Hammasi ikki joyda:

| Qism | Xizmat | Narx |
|---|---|---|
| Ma'lumotlar bazasi (PostgreSQL) | [Neon](https://neon.tech) | bepul |
| Sayt + backend API | [Netlify](https://netlify.com) | bepul |

Backend (`backend/src`) Netlify'da funksiya sifatida ishlaydi
(`backend/netlify/functions/api.mjs`): saytning `/api/*` so'rovlari shunga
boradi. Kod o'zgarmagan — Selectel/Docker'ga qaytish uchun avvalgi
Dockerfile'lar o'z joyida.

## 1. Neon — ma'lumotlar bazasi

1. neon.tech → **Sign up with GitHub**.
2. **Create project**: nomi `shaverma-spb`, region — **AWS Europe Central (Frankfurt)**.
3. **Connect** → **Connection string** ni nusxa oling.
   **"Connection pooling"** belgisini **o'chiring** (oddiy ulanish).
   Ko'rinishi: `postgresql://...@ep-xxx.eu-central-1.aws.neon.tech/neondb?sslmode=require`
   Bu qatorni hech kimga bermang va chatga yozmang.

## 2. Netlify — sayt va API

1. netlify.com → **Sign up with GitHub**.
2. **Add new project → Import an existing project → GitHub** → `shavermaspb.com`.
3. Sozlamalar:
   - **Branch**: `main`
   - **Base directory**: `frontend`
   - Build command va boshqalar — `frontend/netlify.toml` dan o'zi oladi.
4. **Environment variables → Add variables** (har birini alohida):

| Kalit | Qiymat |
|---|---|
| `DATABASE_URL` | 1-qadamdagi Neon qatori |
| `ADMIN_PASSWORD` | admin panel uchun parol |
| `VAPID_PUBLIC_KEY` | push ochiq kaliti |
| `VAPID_PRIVATE_KEY` | push shaxsiy kaliti |

   `NEXT_PUBLIC_API_BASE_URL` **qo'shilmaydi** — API saytning o'zida.
   Push kalitlari kerak bo'lsa: `cd backend && npx web-push generate-vapid-keys`.
5. **Deploy**. Build paytida baza jadvallari o'zi yaratiladi.
   Sayt `https://<nom>.netlify.app` da ochiladi, admin panel — `/admin`.

ЮKassa yoki Yandex Доставка kalitlari bo'lsa — shu yerga
`backend/.env.example` dagi nomlar bilan qo'shing va **Deploys → Trigger deploy**.

## 3. Domenni ulash (shavermaspb.com)

1. Netlify → **Domain management → Add a domain** → `shavermaspb.com`.
2. Domen sotib olingan joyda (registrator) DNS yozuvlarini Netlify ko'rsatgandek
   o'zgartiring. Eski Selectel IP manzilini o'chiring.
3. HTTPS sertifikatini Netlify o'zi beradi.
4. Environment variables'ga `FRONTEND_URL` = `https://shavermaspb.com` qo'shing
   (ЮKassa to'lovdan keyin shu manzilga qaytaradi) va qayta deploy qiling.

## Bepul tarifdagi farqlar

- Admin panelga yangi buyurtma bir zumda emas, **5 soniya ichida** chiqadi
  (push-bildirishnoma esa darhol keladi).
- Yandex kuryer holati **har daqiqada** yangilanadi (Selectel'da — 10 soniyada).
- Netlify bepul tarifi kafe uchun yetarli; Neon — 0,5 GB joy.
- **Rossiyadan kirish:** Netlify ba'zan Rossiya tarmog'ida sekin yoki
  bloklangan bo'ladi. Mijozlar ochololmasa — Selectel yoki boshqa rus VPS'ga
  qaytamiz (pastga qarang).

## Selectel'ga qaytish

1. Selectel serverini yoqing — Dokploy GitHub'dagi kodni Dockerfile bilan avvalgidek oladi.
2. Bazani ko'chiring: `pg_dump "<Neon qatori>" > backup.sql`, keyin
   `psql "<Selectel baza qatori>" < backup.sql`.
3. Domen DNS'ini yana Selectel IP manziliga qarating.
