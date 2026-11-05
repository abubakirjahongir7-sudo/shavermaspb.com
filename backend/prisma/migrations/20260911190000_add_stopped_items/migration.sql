-- CreateTable
CREATE TABLE "stopped_items" (
    "item_id" TEXT NOT NULL,
    "stopped_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "stopped_items_pkey" PRIMARY KEY ("item_id")
);
