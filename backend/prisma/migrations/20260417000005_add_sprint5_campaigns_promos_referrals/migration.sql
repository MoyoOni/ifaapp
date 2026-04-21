-- ADM-019: Email Campaigns
CREATE TABLE "EmailCampaign" (
  "id"             TEXT NOT NULL DEFAULT gen_random_uuid()::text,
  "subject"        TEXT NOT NULL,
  "body"           TEXT NOT NULL,
  "segment"        TEXT NOT NULL,
  "status"         TEXT NOT NULL DEFAULT 'DRAFT',
  "scheduledAt"    TIMESTAMP(3),
  "sentAt"         TIMESTAMP(3),
  "recipientCount" INTEGER NOT NULL DEFAULT 0,
  "openCount"      INTEGER NOT NULL DEFAULT 0,
  "clickCount"     INTEGER NOT NULL DEFAULT 0,
  "createdBy"      TEXT NOT NULL,
  "createdAt"      TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"      TIMESTAMP(3) NOT NULL,
  CONSTRAINT "EmailCampaign_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "EmailCampaign_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "users"("id") ON DELETE CASCADE
);
CREATE INDEX "EmailCampaign_status_idx" ON "EmailCampaign"("status");
CREATE INDEX "EmailCampaign_createdAt_idx" ON "EmailCampaign"("createdAt");

-- ADM-020: Promo Codes
CREATE TABLE "PromoCode" (
  "id"            TEXT NOT NULL DEFAULT gen_random_uuid()::text,
  "code"          TEXT NOT NULL,
  "type"          TEXT NOT NULL,
  "value"         DOUBLE PRECISION NOT NULL,
  "maxUses"       INTEGER,
  "usedCount"     INTEGER NOT NULL DEFAULT 0,
  "expiresAt"     TIMESTAMP(3),
  "eligibleRoles" TEXT[] DEFAULT ARRAY[]::TEXT[],
  "isActive"      BOOLEAN NOT NULL DEFAULT true,
  "createdBy"     TEXT NOT NULL,
  "createdAt"     TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"     TIMESTAMP(3) NOT NULL,
  CONSTRAINT "PromoCode_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "PromoCode_code_key" UNIQUE ("code"),
  CONSTRAINT "PromoCode_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "users"("id") ON DELETE CASCADE
);
CREATE INDEX "PromoCode_code_idx" ON "PromoCode"("code");
CREATE INDEX "PromoCode_isActive_idx" ON "PromoCode"("isActive");

CREATE TABLE "PromoRedemption" (
  "id"          TEXT NOT NULL DEFAULT gen_random_uuid()::text,
  "promoCodeId" TEXT NOT NULL,
  "userId"      TEXT NOT NULL,
  "redeemedAt"  TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "discountNgn" DOUBLE PRECISION NOT NULL DEFAULT 0,
  CONSTRAINT "PromoRedemption_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "PromoRedemption_promoCodeId_fkey" FOREIGN KEY ("promoCodeId") REFERENCES "PromoCode"("id") ON DELETE CASCADE,
  CONSTRAINT "PromoRedemption_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE
);
CREATE INDEX "PromoRedemption_promoCodeId_idx" ON "PromoRedemption"("promoCodeId");
CREATE INDEX "PromoRedemption_userId_idx" ON "PromoRedemption"("userId");

-- ADM-021: Referral Program
CREATE TABLE "Referral" (
  "id"         TEXT NOT NULL DEFAULT gen_random_uuid()::text,
  "referrerId" TEXT NOT NULL,
  "refereeId"  TEXT NOT NULL,
  "status"     TEXT NOT NULL DEFAULT 'PENDING',
  "rewardedAt" TIMESTAMP(3),
  "createdAt"  TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "Referral_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "Referral_refereeId_key" UNIQUE ("refereeId"),
  CONSTRAINT "Referral_referrerId_fkey" FOREIGN KEY ("referrerId") REFERENCES "users"("id") ON DELETE CASCADE,
  CONSTRAINT "Referral_refereeId_fkey" FOREIGN KEY ("refereeId") REFERENCES "users"("id") ON DELETE CASCADE
);
CREATE INDEX "Referral_referrerId_idx" ON "Referral"("referrerId");
CREATE INDEX "Referral_status_idx" ON "Referral"("status");
