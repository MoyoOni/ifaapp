-- ADM-014: PlatformSettings model
CREATE TABLE IF NOT EXISTS "PlatformSettings" (
    "id"                          TEXT NOT NULL DEFAULT 'singleton',
    "consultationCommissionPct"   DOUBLE PRECISION NOT NULL DEFAULT 15,
    "marketplaceCommissionPct"    DOUBLE PRECISION NOT NULL DEFAULT 10,
    "minPayoutThresholdNgn"       DOUBLE PRECISION NOT NULL DEFAULT 5000,
    "maxPayoutWithoutApprovalNgn" DOUBLE PRECISION NOT NULL DEFAULT 100000,
    "updatedAt"                   TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedBy"                   TEXT,

    CONSTRAINT "PlatformSettings_pkey" PRIMARY KEY ("id")
);

-- Seed the singleton row so the app always has a row to read
INSERT INTO "PlatformSettings" ("id", "updatedAt")
VALUES ('singleton', CURRENT_TIMESTAMP)
ON CONFLICT ("id") DO NOTHING;
