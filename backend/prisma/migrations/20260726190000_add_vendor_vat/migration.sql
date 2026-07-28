-- AlterTable
ALTER TABLE "Vendor" ADD COLUMN     "vatNumber" TEXT,
ADD COLUMN     "vatRegistered" BOOLEAN NOT NULL DEFAULT false;

