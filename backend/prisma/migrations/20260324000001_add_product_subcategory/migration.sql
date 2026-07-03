-- AlterTable: Add subcategory and requiresInitiation to Product
ALTER TABLE "Product" ADD COLUMN "subcategory" TEXT;
ALTER TABLE "Product" ADD COLUMN "requiresInitiation" BOOLEAN NOT NULL DEFAULT false;

-- CreateIndex
CREATE INDEX "Product_subcategory_idx" ON "Product"("subcategory");
CREATE INDEX "Product_category_subcategory_idx" ON "Product"("category", "subcategory");
