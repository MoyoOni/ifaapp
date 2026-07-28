-- AlterTable
ALTER TABLE "Vendor" ADD COLUMN     "bannerImageUrl" TEXT,
ADD COLUMN     "featuredProductIds" TEXT[] DEFAULT ARRAY[]::TEXT[];
