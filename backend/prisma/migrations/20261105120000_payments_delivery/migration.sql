-- Karta orqali to'lov va yetkazib berish narxi.
CREATE TYPE "PaymentMethod" AS ENUM ('CASH', 'CARD');
CREATE TYPE "PaymentStatus" AS ENUM ('NOT_REQUIRED', 'PENDING', 'PAID', 'CANCELED', 'REFUNDED');

ALTER TYPE "OrderStatus" ADD VALUE 'OUT_FOR_DELIVERY' BEFORE 'DELIVERED';

ALTER TABLE "orders"
ADD COLUMN "payment_method" "PaymentMethod" NOT NULL DEFAULT 'CASH',
ADD COLUMN "payment_status" "PaymentStatus" NOT NULL DEFAULT 'NOT_REQUIRED',
ADD COLUMN "payment_id" TEXT,
ADD COLUMN "payment_url" TEXT,
ADD COLUMN "delivery_fee" INTEGER NOT NULL DEFAULT 0;

CREATE UNIQUE INDEX "orders_payment_id_key" ON "orders"("payment_id");
