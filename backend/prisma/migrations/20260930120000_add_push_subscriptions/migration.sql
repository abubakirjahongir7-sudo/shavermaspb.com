-- Admin qurilmalarining Web Push obunalari (har biri o'z filialiga bog'langan).
CREATE TABLE "push_subscriptions" (
    "endpoint" TEXT NOT NULL,
    "p256dh" TEXT NOT NULL,
    "auth" TEXT NOT NULL,
    "cafe_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "push_subscriptions_pkey" PRIMARY KEY ("endpoint")
);

CREATE INDEX "push_subscriptions_cafe_id_idx" ON "push_subscriptions"("cafe_id");
