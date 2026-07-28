-- AlterTable
-- ILUASE_V1_BACKLOG.md 🔴 Critical fix: adds a real, admin-settable operating
-- cost field. Nullable, no default -- NULL means "not entered yet" so the
-- revenue forecast can honestly say "not tracked" instead of the previous
-- fabricated placeholder value.
ALTER TABLE "PlatformSettings" ADD COLUMN     "platformCostNgn" DECIMAL(14,2);
