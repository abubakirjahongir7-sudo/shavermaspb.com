-- Yandex Доставка kuryeri.
ALTER TABLE "orders"
ADD COLUMN "courier_claim_id" TEXT,
ADD COLUMN "courier_status" TEXT,
ADD COLUMN "courier_name" TEXT;
