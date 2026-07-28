-- AlterTable
ALTER TABLE "NotificationPreferences" ADD COLUMN     "emailLowStock" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "emailOrder" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "emailReviewReceived" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "pushLowStock" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "pushOrder" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "pushReviewReceived" BOOLEAN NOT NULL DEFAULT false;
