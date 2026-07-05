-- Reconciles schema.prisma with the real migration history. Several fields/tables were
-- hand-edited into schema.prisma without ever generating a migration (confirmed via
-- `prisma migrate diff` against the full committed migration history). Each block below
-- was individually verified against real backend code usage before being written as a
-- data-preserving change rather than accepting Prisma's raw drop+recreate diff.

-- ============================================================================
-- Dead duplicate tables: confirmed zero references in real (non-spec) backend code.
-- Both are the second of two same-day migrations implementing the same story under
-- a different table name (ADM-021 Referral vs EXP-027 referrals; the second
-- Announcement migration literally comments "ADM-005: Announcement model", the same
-- story as the PlatformAnnouncement migration immediately before it).
-- ============================================================================

ALTER TABLE "Referral" DROP CONSTRAINT "Referral_refereeId_fkey";
ALTER TABLE "Referral" DROP CONSTRAINT "Referral_referrerId_fkey";
DROP TABLE "Referral";

DROP TABLE "PlatformAnnouncement";

-- ============================================================================
-- users.isSuspended: zero references in any backend service (checked src/admin,
-- src/users, and a repo-wide grep). Frontend only reads it as an optional field
-- (admin-user-management-tab.tsx) that the backend never populates today, so the
-- "Suspended" badge already can't be lit by this field in production. Superseded
-- by the richer suspendedUntil/bannedAt/banReason/warnCount fields (ADM-003).
-- ============================================================================

ALTER TABLE "users" DROP COLUMN "isSuspended";

-- ============================================================================
-- UserBadge: confirmed zero reads/writes anywhere in real backend code (EXP-029's
-- getMilestoneBadges() computes badges on the fly and never touches this table) -
-- so there's no live data at risk, but renaming rather than drop+add costs nothing
-- and preserves any historical rows if the award-badge flow was ever used manually.
-- ============================================================================

ALTER TABLE "UserBadge" DROP CONSTRAINT "UserBadge_awardedBy_fkey";

ALTER TABLE "UserBadge" RENAME COLUMN "badgeSlug" TO "badgeKey";
ALTER TABLE "UserBadge" RENAME COLUMN "awardedBy" TO "awardedById";
ALTER TABLE "UserBadge" ALTER COLUMN "awardedById" DROP NOT NULL;
ALTER TABLE "UserBadge" DROP COLUMN "badgeName";
ALTER TABLE "UserBadge" DROP COLUMN "description";
ALTER TABLE "UserBadge" DROP COLUMN "message";
ALTER TABLE "UserBadge" ADD COLUMN "reason" TEXT;

ALTER TABLE "UserBadge" ADD CONSTRAINT "UserBadge_awardedById_fkey"
  FOREIGN KEY ("awardedById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER INDEX "UserBadge_badgeSlug_idx" RENAME TO "UserBadge_badgeKey_idx";

-- ============================================================================
-- audit_logs: live and load-bearing (audit.service.ts, admin-academy,
-- admin-marketplace, admin-trust-score, admin-platform-settings and more all
-- read/write this table today). Renamed rather than dropped so existing rows
-- keep their values. Mapping confirmed:
--   adminId -> userId, entityType -> resourceType, entityId -> resourceId,
--   timestamp -> createdAt, payload -> newValues (previousValues stays null for
--   historical rows - the old schema never recorded a "before" state, so we
--   don't invent one), reason -> folded into metadata, then dropped.
-- ============================================================================

ALTER TABLE "audit_logs" RENAME COLUMN "adminId" TO "userId";
ALTER TABLE "audit_logs" RENAME COLUMN "entityType" TO "resourceType";
ALTER TABLE "audit_logs" RENAME COLUMN "entityId" TO "resourceId";
ALTER TABLE "audit_logs" ALTER COLUMN "resourceId" DROP NOT NULL;
ALTER TABLE "audit_logs" RENAME COLUMN "payload" TO "newValues";
ALTER TABLE "audit_logs" RENAME COLUMN "timestamp" TO "createdAt";

ALTER TABLE "audit_logs" ADD COLUMN "previousValues" JSONB;
ALTER TABLE "audit_logs" ADD COLUMN "metadata" JSONB;

UPDATE "audit_logs" SET "metadata" = jsonb_build_object('reason', "reason") WHERE "reason" IS NOT NULL;

ALTER TABLE "audit_logs" DROP COLUMN "reason";

ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER INDEX "audit_logs_adminId_idx" RENAME TO "audit_logs_userId_idx";
ALTER INDEX "audit_logs_entityType_entityId_idx" RENAME TO "audit_logs_resourceType_resourceId_idx";
ALTER INDEX "audit_logs_timestamp_idx" RENAME TO "audit_logs_createdAt_idx";
CREATE INDEX "audit_logs_userId_action_idx" ON "audit_logs"("userId", "action");

-- ============================================================================
-- Everything below is additive or index-only (verified safe): new columns on
-- users, two new tables for already-live features (ClientSessionNote backs
-- P3-13's consultation notes; OnboardingEmail backs EXP-012's onboarding email
-- tracking), and index/FK churn Prisma's own diff generated with no semantic
-- change (id columns moving from DB-generated to Prisma-generated defaults).
-- ============================================================================

ALTER TABLE "EmailCampaign" DROP CONSTRAINT "EmailCampaign_createdBy_fkey";
ALTER TABLE "PromoCode" DROP CONSTRAINT "PromoCode_createdBy_fkey";
ALTER TABLE "PromoRedemption" DROP CONSTRAINT "PromoRedemption_promoCodeId_fkey";
ALTER TABLE "PromoRedemption" DROP CONSTRAINT "PromoRedemption_userId_fkey";

DROP INDEX "Appointment_babalawoId_date_idx";
DROP INDEX "Appointment_createdAt_idx";
DROP INDEX "Appointment_date_status_idx";
DROP INDEX "Circle_isFeatured_idx";
DROP INDEX "Course_isFeatured_idx";
DROP INDEX "ForumPost_heldForReview_idx";
DROP INDEX "ForumThread_isFeatured_idx";
DROP INDEX "Notification_scheduledAt_idx";
DROP INDEX "Product_isFeatured_idx";
DROP INDEX "profile_views_profileId_viewedAt_idx";
DROP INDEX "users_personalAwoId_idx";
DROP INDEX "users_slug_idx";
DROP INDEX "users_subscriptionStatus_idx";

ALTER TABLE "Announcement" ALTER COLUMN "updatedAt" DROP DEFAULT;
ALTER TABLE "EmailCampaign" ALTER COLUMN "id" DROP DEFAULT;
ALTER TABLE "ForumThread" ALTER COLUMN "tags" DROP DEFAULT;
ALTER TABLE "LiveSession" ALTER COLUMN "hostIds" DROP DEFAULT;
ALTER TABLE "OralHistoryEntry" ALTER COLUMN "updatedAt" DROP DEFAULT;
ALTER TABLE "PlatformSettings" ALTER COLUMN "updatedAt" DROP DEFAULT;
ALTER TABLE "PractitionerComplaint" ALTER COLUMN "updatedAt" DROP DEFAULT;
ALTER TABLE "PromoCode" ALTER COLUMN "id" DROP DEFAULT;
ALTER TABLE "PromoRedemption" ALTER COLUMN "id" DROP DEFAULT;
ALTER TABLE "RefundRequest" ALTER COLUMN "updatedAt" DROP DEFAULT;
ALTER TABLE "SacredCalendarEvent" ALTER COLUMN "updatedAt" DROP DEFAULT;
ALTER TABLE "subscriptions" ALTER COLUMN "updatedAt" DROP DEFAULT;

ALTER TABLE "users"
  ADD COLUMN "intentTags" TEXT[] DEFAULT ARRAY[]::TEXT[],
  ADD COLUMN "isDeactivated" BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN "isOnLeave" BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN "notificationPreferencesId" TEXT,
  ADD COLUMN "timezone" TEXT DEFAULT 'UTC',
  ADD COLUMN "trustScoreOverride" DOUBLE PRECISION,
  ADD COLUMN "trustScoreOverrideAt" TIMESTAMP(3),
  ADD COLUMN "trustScoreOverrideBy" TEXT,
  ADD COLUMN "trustScoreOverrideReason" TEXT,
  ALTER COLUMN "trustScore" SET DEFAULT 0.5,
  ALTER COLUMN "trustScore" TYPE DOUBLE PRECISION USING "trustScore"::DOUBLE PRECISION;

CREATE TABLE "ClientSessionNote" (
    "id" TEXT NOT NULL,
    "appointmentId" TEXT NOT NULL,
    "clientId" TEXT NOT NULL,
    "title" TEXT,
    "content" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ClientSessionNote_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "OnboardingEmail" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "sentAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "OnboardingEmail_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "ClientSessionNote_appointmentId_idx" ON "ClientSessionNote"("appointmentId");
CREATE INDEX "ClientSessionNote_clientId_idx" ON "ClientSessionNote"("clientId");
CREATE INDEX "ClientSessionNote_createdAt_idx" ON "ClientSessionNote"("createdAt");
CREATE INDEX "OnboardingEmail_userId_idx" ON "OnboardingEmail"("userId");
CREATE INDEX "OnboardingEmail_sentAt_idx" ON "OnboardingEmail"("sentAt");
CREATE INDEX "Appointment_babalawoId_idx" ON "Appointment"("babalawoId");
CREATE INDEX "Appointment_date_idx" ON "Appointment"("date");
CREATE INDEX "NotificationPreferences_userId_idx" ON "NotificationPreferences"("userId");
CREATE INDEX "profile_views_profileId_viewedAt_idx" ON "profile_views"("profileId", "viewedAt");
CREATE INDEX "subscriptions_paystackSubId_idx" ON "subscriptions"("paystackSubId");
CREATE UNIQUE INDEX "users_notificationPreferencesId_key" ON "users"("notificationPreferencesId");

ALTER TABLE "ClientSessionNote" ADD CONSTRAINT "ClientSessionNote_appointmentId_fkey"
  FOREIGN KEY ("appointmentId") REFERENCES "Appointment"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ClientSessionNote" ADD CONSTRAINT "ClientSessionNote_clientId_fkey"
  FOREIGN KEY ("clientId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "OnboardingEmail" ADD CONSTRAINT "OnboardingEmail_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "EmailCampaign" ADD CONSTRAINT "EmailCampaign_createdBy_fkey"
  FOREIGN KEY ("createdBy") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "PromoCode" ADD CONSTRAINT "PromoCode_createdBy_fkey"
  FOREIGN KEY ("createdBy") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "PromoRedemption" ADD CONSTRAINT "PromoRedemption_promoCodeId_fkey"
  FOREIGN KEY ("promoCodeId") REFERENCES "PromoCode"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "PromoRedemption" ADD CONSTRAINT "PromoRedemption_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER INDEX "referrals_referredId_unique" RENAME TO "referrals_referredId_key";
