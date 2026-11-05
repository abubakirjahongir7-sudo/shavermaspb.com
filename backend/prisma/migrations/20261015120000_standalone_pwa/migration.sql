-- Telegram'dan voz kechildi: mijoz ma'lumoti (ism, telefon) endi
-- to'g'ridan-to'g'ri buyurtmada saqlanadi, Telegram ID'ga asoslangan
-- "users" jadvali olib tashlanadi.

ALTER TABLE "orders"
ADD COLUMN "customer_name" TEXT,
ADD COLUMN "phone" TEXT,
ADD COLUMN "tracking_token" TEXT;

UPDATE "orders" o
SET "customer_name" = COALESCE(u."contact_name", u."first_name", 'Гость'),
    "phone" = COALESCE(u."phone", '')
FROM "users" u
WHERE o."user_id" = u."id";

UPDATE "orders"
SET "tracking_token" = md5(random()::text || "id"::text || clock_timestamp()::text);

ALTER TABLE "orders"
ALTER COLUMN "customer_name" SET NOT NULL,
ALTER COLUMN "phone" SET NOT NULL,
ALTER COLUMN "tracking_token" SET NOT NULL;

ALTER TABLE "orders" DROP CONSTRAINT "orders_user_id_fkey";
ALTER TABLE "orders" DROP COLUMN "user_id";
DROP TABLE "users";

CREATE UNIQUE INDEX "orders_tracking_token_key" ON "orders"("tracking_token");

CREATE TABLE "customer_push_subscriptions" (
    "id" SERIAL NOT NULL,
    "order_id" INTEGER NOT NULL,
    "endpoint" TEXT NOT NULL,
    "p256dh" TEXT NOT NULL,
    "auth" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "customer_push_subscriptions_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "customer_push_subscriptions_order_id_endpoint_key" ON "customer_push_subscriptions"("order_id", "endpoint");

ALTER TABLE "customer_push_subscriptions" ADD CONSTRAINT "customer_push_subscriptions_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "orders"("id") ON DELETE CASCADE ON UPDATE CASCADE;
