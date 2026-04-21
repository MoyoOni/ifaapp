-- AlterTable: add permissions array to users
ALTER TABLE "users" ADD COLUMN "permissions" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[];
