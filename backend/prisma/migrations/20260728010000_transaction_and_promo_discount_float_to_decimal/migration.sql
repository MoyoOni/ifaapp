-- AlterTable
-- ILUASE_V1_BACKLOG.md 🔴 Critical fix: last of the money-as-Float fields
-- from ProBacklog-v1.md item #15 that hadn't been converted in the earlier
-- float_to_decimal batches. Transaction.amount was the one field the
-- original audit specifically named; the other three were noticed while
-- re-verifying the item.
ALTER TABLE "Transaction" ALTER COLUMN "amount" SET DATA TYPE DECIMAL(14,2);

-- AlterTable
ALTER TABLE "ReturnRequest" ALTER COLUMN "offeredRefundAmount" SET DATA TYPE DECIMAL(14,2);

-- AlterTable
ALTER TABLE "VendorPromotionRedemption" ALTER COLUMN "discountNgn" SET DATA TYPE DECIMAL(14,2);

-- AlterTable
ALTER TABLE "PromoRedemption" ALTER COLUMN "discountNgn" SET DATA TYPE DECIMAL(14,2);
