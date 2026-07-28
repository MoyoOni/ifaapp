/*
  Warnings:

  - You are about to alter the column `balance` on the `Wallet` table. The data in that column could be lost. The data in that column will be cast from `DoublePrecision` to `Decimal(14,2)`.

*/
-- AlterTable
ALTER TABLE "Wallet" ALTER COLUMN "balance" SET DATA TYPE DECIMAL(14,2);
