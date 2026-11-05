import "dotenv/config";

function required(name) {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Environment variable "${name}" is not set. See .env.example.`);
  }
  return value;
}

export const config = {
  databaseUrl: required("DATABASE_URL"),
  // PWA (frontend) manzili — CORS shu manzildan kelgan so'rovlarga ruxsat beradi.
  frontendUrl: process.env.FRONTEND_URL ?? "",
  port: Number(process.env.PORT) || 3001,
  adminPassword: process.env.ADMIN_PASSWORD ?? "",
  // Web Push (admin va mijoz PWA'siga telefon uyquda bo'lsa ham bildirishnoma).
  // Kalitlarni `npx web-push generate-vapid-keys` bilan yaratish mumkin.
  // Bo'sh bo'lsa — push o'chiq, qolgan hammasi avvalgidek ishlaydi.
  vapidPublicKey: process.env.VAPID_PUBLIC_KEY ?? "",
  vapidPrivateKey: process.env.VAPID_PRIVATE_KEY ?? "",
  vapidSubject: process.env.VAPID_SUBJECT ?? "mailto:admin@example.com",
  // ЮKassa (karta va SBP). Bo'sh bo'lsa — faqat naqd to'lov ishlaydi.
  yookassaShopId: process.env.YOOKASSA_SHOP_ID ?? "",
  yookassaSecretKey: process.env.YOOKASSA_SECRET_KEY ?? "",
  yookassaApiUrl: process.env.YOOKASSA_API_URL || "https://api.yookassa.ru/v3",
  yookassaSendReceipt: process.env.YOOKASSA_SEND_RECEIPT === "true",
  yookassaVatCode: Number(process.env.YOOKASSA_VAT_CODE) || 1,
  // Yandex Доставка. Bo'sh bo'lsa — yetkazib berish o'chiq.
  yandexDeliveryToken: process.env.YANDEX_DELIVERY_TOKEN ?? "",
  yandexDeliveryApiUrl:
    process.env.YANDEX_DELIVERY_API_URL || "https://b2b.taxi.yandex.net/b2b/cargo/integration/v2",
  yandexDeliveryTaxiClass: process.env.YANDEX_DELIVERY_TAXI_CLASS || "express",
  cafePhone: process.env.CAFE_PHONE ?? "",
  cafeEmail: process.env.CAFE_EMAIL ?? "",
};
