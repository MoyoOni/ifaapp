-- AlterTable
ALTER TABLE "Order" ADD COLUMN     "dedicatedTo" TEXT,
ADD COLUMN     "giftMessage" TEXT,
ADD COLUMN     "giftRecipientId" TEXT,
ADD COLUMN     "isGift" BOOLEAN NOT NULL DEFAULT false;

-- CreateIndex
CREATE INDEX "Order_giftRecipientId_idx" ON "Order"("giftRecipientId");

-- AddForeignKey
ALTER TABLE "Order" ADD CONSTRAINT "Order_giftRecipientId_fkey" FOREIGN KEY ("giftRecipientId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
