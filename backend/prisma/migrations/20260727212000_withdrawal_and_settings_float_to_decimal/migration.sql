-- AlterTable
ALTER TABLE "PlatformSettings" ALTER COLUMN "minPayoutThresholdNgn" SET DATA TYPE DECIMAL(14,2);

-- AlterTable
ALTER TABLE "WithdrawalRequest" ALTER COLUMN "amount" SET DATA TYPE DECIMAL(14,2);

