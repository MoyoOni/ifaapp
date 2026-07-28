-- AlterTable
ALTER TABLE "Product" ADD COLUMN     "wholesaleEnabled" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "wholesaleMinQuantity" INTEGER,
ADD COLUMN     "wholesalePrice" DOUBLE PRECISION;

