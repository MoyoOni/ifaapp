/*
  Warnings:

  - You are about to drop the `VendorWellnessCheckIn` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "VendorWellnessCheckIn" DROP CONSTRAINT "VendorWellnessCheckIn_vendorId_fkey";

-- DropTable
DROP TABLE "VendorWellnessCheckIn";
