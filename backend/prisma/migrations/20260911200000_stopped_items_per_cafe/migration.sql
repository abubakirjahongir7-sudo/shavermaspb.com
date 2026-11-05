-- Stop-list endi har bir filial (cafeId) uchun alohida bo'ladi.
-- Jadval hozircha bo'sh (production'da tasdiqlangan: GET /api/stop-list -> []),
-- shuning uchun qayta yaratish xavfsiz.
DROP TABLE IF EXISTS "stopped_items";

CREATE TABLE "stopped_items" (
    "cafe_id" TEXT NOT NULL,
    "item_id" TEXT NOT NULL,
    "stopped_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "stopped_items_pkey" PRIMARY KEY ("cafe_id","item_id")
);
