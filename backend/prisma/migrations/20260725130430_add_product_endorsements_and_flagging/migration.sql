-- AlterTable
ALTER TABLE "Product" ADD COLUMN     "heldForReview" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "reviewReason" TEXT,
ADD COLUMN     "reviewedAt" TIMESTAMP(3),
ADD COLUMN     "reviewedBy" TEXT;

-- CreateTable
CREATE TABLE "ProductEndorsement" (
    "id" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ProductEndorsement_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ProductEndorsement_productId_idx" ON "ProductEndorsement"("productId");

-- CreateIndex
CREATE UNIQUE INDEX "ProductEndorsement_productId_userId_key" ON "ProductEndorsement"("productId", "userId");

-- CreateIndex
CREATE INDEX "Product_heldForReview_idx" ON "Product"("heldForReview");

-- AddForeignKey
ALTER TABLE "ProductEndorsement" ADD CONSTRAINT "ProductEndorsement_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProductEndorsement" ADD CONSTRAINT "ProductEndorsement_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
