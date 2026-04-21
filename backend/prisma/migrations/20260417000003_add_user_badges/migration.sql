-- ADM-017: Community Recognition System — UserBadge model

CREATE TABLE "UserBadge" (
  "id"          TEXT NOT NULL,
  "userId"      TEXT NOT NULL,
  "badgeName"   TEXT NOT NULL,
  "badgeSlug"   TEXT NOT NULL,
  "description" TEXT,
  "awardedBy"   TEXT NOT NULL,
  "awardedAt"   TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "message"     TEXT,

  CONSTRAINT "UserBadge_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "UserBadge" ADD CONSTRAINT "UserBadge_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "UserBadge" ADD CONSTRAINT "UserBadge_awardedBy_fkey"
  FOREIGN KEY ("awardedBy") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

CREATE INDEX "UserBadge_userId_idx" ON "UserBadge"("userId");
CREATE INDEX "UserBadge_badgeSlug_idx" ON "UserBadge"("badgeSlug");
