# Bepul hostingga ko'chirish

Ilova uch qismdan iborat, har biri o'z bepul xizmatiga joylanadi:

| Qism | Xizmat | Narx |
|---|---|---|
| Ma'lumotlar bazasi (PostgreSQL) | [Neon](https://neon.tech) | bepul |
| Backend (`backend/`, Express API) | [Render](https://render.com) | bepul |
| Frontend (`frontend/`, Next.js PWA) | [Netlify](https://netlify.com) | bepul |

Uchala xizmatga ham **GitHub akkaunt bilan** kiriladi, karta so'ralmaydi.
Tartib muhim: avval baza, keyin backend, oxirida frontend.

## 1. Neon — ma'lumotlar bazasi

1. neon.tech → **Sign up with GitHub**.
2. **Create project**: nomi `shaverma-spb`, Postgres versiyasi — default,
   region — **AWS Europe Central (Frankfurt)**.
3. **Connection string** ni nusxa oling. **"Pooled connection"** belgisini
   **o'chiring** (oddiy ulanish kerak — Prisma migratsiyasi uchun).
   Ko'rinishi: `postgresql://...@ep-xxx.eu-central-1.aws.neon.tech/neondb?sslmode=require`

## 2. Render — backend

1. render.com → **Sign up with GitHub**, `shavermaspb.com` repoga ruxsat bering.
2. **New → Blueprint** → shu repo → Render `render.yaml` ni o'zi topadi.
3. So'ralgan qiymatlarni kiriting:
   - `DATABASE_URL` — 1-qadamdagi Neon manzili
   - `FRONTEND_URL` — `https://shavermaspb.com` (domen hali ulanmagan bo'lsa,
     avval Netlify bergan `https://....netlify.app` manzilini yozing, keyin almashtirasiz)
   - `ADMIN_PASSWORD` — admin panel uchun yangi parol
   - `VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY` — push kalitlari
     (`cd backend && npx web-push generate-vapid-keys`). Bo'sh qoldirilsa push o'chiq.
4. **Apply**. 3–5 daqiqada backend tayyor bo'ladi. Manzili:
   `https://shaverma-spb-api.onrender.com` — `/health` ochilsa `{"ok":true}` chiqadi.

ЮKassa yoki Yandex Доставка kalitlari bo'lsa — Render → servis → **Environment**
bo'limiga `backend/.env.example` dagi nomlar bilan qo'shing.

## 3. Netlify — frontend

1. netlify.com → **Sign up with GitHub**.
2. **Add new site → Import an existing project → GitHub** → shu repo.
3. Sozlamalar:
   - **Base directory**: `frontend`
   - Build command va publish — `frontend/netlify.toml` dan o'zi oladi
4. **Environment variables** → `NEXT_PUBLIC_API_BASE_URL` =
   `https://shaverma-spb-api.onrender.com` (oxirida `/` yo'q).
5. **Deploy**. Sayt `https://<nom>.netlify.app` da ochiladi.

## 4. Domenni ulash (shavermaspb.com)

1. Netlify → **Domain management → Add domain** → `shavermaspb.com`.
2. Domen sotib olingan joyda (registrator) DNS yozuvlarini Netlify ko'rsatgandek
   o'zgartiring (`A` yozuv yoki Netlify DNS serverlari). Eski Selectel IP
   manzilini o'chiring.
3. Netlify HTTPS sertifikatini o'zi beradi.
4. Render'da `FRONTEND_URL` ni `https://shavermaspb.com` ga o'zgartiring.

## Bepul tarifning cheklovlari

- **Render backend 15 daqiqa so'rov bo'lmasa "uxlaydi".** Keyingi birinchi
  so'rov 30–60 soniya kutadi (menyu sahifasi esa darhol ochiladi — u frontend'da).
  Uxlab yotganda Yandex kuryer holatini har 10 soniyada tekshirish ham to'xtaydi.
- **Neon** — 0,5 GB joy; kafening buyurtmalari uchun yillarga yetadi.
- **Rossiyadan kirish:** Netlify va Render ba'zan Rossiya tarmog'ida sekin
  yoki bloklangan bo'ladi. Mijozlar ochololmasa — Rossiyadagi arzon VPS'ga
  (Timeweb, Beget) o'tish kerak bo'ladi; ikkala Dockerfile o'shanda ham ishlaydi.
- Eski serverdagi buyurtmalar tarixi va push obunalari ko'chmaydi — baza
  yangidan boshlanadi. Admin va mijozlar push'ga qayta obuna bo'lishadi.
