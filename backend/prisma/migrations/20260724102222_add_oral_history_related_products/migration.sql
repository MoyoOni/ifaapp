-- AlterTable
ALTER TABLE "OralHistoryEntry" ADD COLUMN     "relatedProductIds" TEXT[] DEFAULT ARRAY[]::TEXT[];
