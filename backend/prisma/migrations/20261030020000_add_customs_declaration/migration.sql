-- SHOP_BACKLOG.md MSP-009: customs declaration for international orders.
ALTER TABLE "Vendor" ADD COLUMN "shipsFromCountry" TEXT NOT NULL DEFAULT 'Nigeria';

ALTER TABLE "Product" ADD COLUMN "customsDescription" TEXT,
ADD COLUMN "hsCode" TEXT,
ADD COLUMN "originCountry" TEXT;

ALTER TABLE "Order" ADD COLUMN "isInternational" BOOLEAN NOT NULL DEFAULT false;

ALTER TABLE "OrderItem" ADD COLUMN "customsDescription" TEXT,
ADD COLUMN "hsCode" TEXT,
ADD COLUMN "originCountry" TEXT,
ADD COLUMN "weightKg" DOUBLE PRECISION;
