-- AlterTable
-- ADM-030: last real Platform Settings Panel field. See schema.prisma's
-- comment on PlatformSettings.maintenanceMode for enforcement details.
ALTER TABLE "PlatformSettings" ADD COLUMN     "maintenanceMode" BOOLEAN NOT NULL DEFAULT false;
