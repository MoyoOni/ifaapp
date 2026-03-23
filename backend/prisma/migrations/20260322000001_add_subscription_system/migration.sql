-- V8-101: Add subscription system
-- Adds Subscription, ProfileView, Referral tables
-- Adds subscriptionStatus, subscriptionEnd, referralCode to users

-- CreateEnum
CREATE TYPE "SubscriptionPlan" AS ENUM ('QUARTERLY', 'ANNUAL');

-- CreateEnum
CREATE TYPE "SubscriptionStatus" AS ENUM ('ACTIVE', 'EXPIRED', 'CANCELLED', 'PAST_DUE');

-- AlterTable: Add billing fields to users
ALTER TABLE "users"
  ADD COLUMN IF NOT EXISTS "subscriptionStatus" TEXT NOT NULL DEFAULT 'FREE',
  ADD COLUMN IF NOT EXISTS "subscriptionEnd"    TIMESTAMP(3),
  ADD COLUMN IF NOT EXISTS "referralCode"       TEXT;

-- CreateIndex on users
CREATE UNIQUE INDEX IF NOT EXISTS "users_referralCode_key" ON "users"("referralCode");
CREATE INDEX IF NOT EXISTS "users_subscriptionStatus_idx" ON "users"("subscriptionStatus");

-- CreateTable: subscriptions
CREATE TABLE IF NOT EXISTS "subscriptions" (
  "id"             TEXT NOT NULL,
  "userId"         TEXT NOT NULL,
  "plan"           "SubscriptionPlan" NOT NULL,
  "status"         "SubscriptionStatus" NOT NULL DEFAULT 'ACTIVE',
  "paystackSubId"  TEXT,
  "paystackRef"    TEXT,
  "startDate"      TIMESTAMP(3) NOT NULL,
  "endDate"        TIMESTAMP(3) NOT NULL,
  "autoRenew"      BOOLEAN NOT NULL DEFAULT true,
  "amountPaid"     INTEGER NOT NULL,
  "currency"       TEXT NOT NULL DEFAULT 'NGN',
  "reminderSent"   BOOLEAN NOT NULL DEFAULT false,
  "createdAt"      TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"      TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "subscriptions_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "subscriptions_userId_fkey" FOREIGN KEY ("userId")
    REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE UNIQUE INDEX IF NOT EXISTS "subscriptions_paystackSubId_key" ON "subscriptions"("paystackSubId");
CREATE INDEX IF NOT EXISTS "subscriptions_userId_idx"   ON "subscriptions"("userId");
CREATE INDEX IF NOT EXISTS "subscriptions_status_idx"   ON "subscriptions"("status");
CREATE INDEX IF NOT EXISTS "subscriptions_endDate_idx"  ON "subscriptions"("endDate");

-- CreateTable: profile_views
CREATE TABLE IF NOT EXISTS "profile_views" (
  "id"        TEXT NOT NULL,
  "viewerId"  TEXT NOT NULL,
  "profileId" TEXT NOT NULL,
  "viewedAt"  TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "profile_views_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "profile_views_viewerId_fkey" FOREIGN KEY ("viewerId")
    REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "profile_views_profileId_fkey" FOREIGN KEY ("profileId")
    REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE UNIQUE INDEX IF NOT EXISTS "profile_views_viewerId_profileId_key"
  ON "profile_views"("viewerId", "profileId");
CREATE INDEX IF NOT EXISTS "profile_views_profileId_viewedAt_idx"
  ON "profile_views"("profileId", "viewedAt" DESC);
CREATE INDEX IF NOT EXISTS "profile_views_viewerId_idx" ON "profile_views"("viewerId");

-- CreateTable: referrals
CREATE TABLE IF NOT EXISTS "referrals" (
  "id"            TEXT NOT NULL,
  "referrerId"    TEXT NOT NULL,
  "referredId"    TEXT NOT NULL,
  "code"          TEXT NOT NULL,
  "rewardGranted" BOOLEAN NOT NULL DEFAULT false,
  "createdAt"     TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "referrals_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "referrals_referredId_unique" UNIQUE ("referredId"),
  CONSTRAINT "referrals_referrerId_fkey" FOREIGN KEY ("referrerId")
    REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "referrals_referredId_fkey" FOREIGN KEY ("referredId")
    REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE INDEX IF NOT EXISTS "referrals_referrerId_idx" ON "referrals"("referrerId");
CREATE INDEX IF NOT EXISTS "referrals_code_idx"       ON "referrals"("code");
