-- CreateEnum
CREATE TYPE "OrderType" AS ENUM ('PICKUP', 'DELIVERY');

-- AlterTable
ALTER TABLE "orders" ADD COLUMN     "order_type" "OrderType" NOT NULL DEFAULT 'PICKUP',
ADD COLUMN     "cafe_id" TEXT,
ADD COLUMN     "address" TEXT,
ADD COLUMN     "latitude" DOUBLE PRECISION,
ADD COLUMN     "longitude" DOUBLE PRECISION;
