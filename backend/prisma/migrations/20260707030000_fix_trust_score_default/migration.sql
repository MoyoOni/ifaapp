-- Fixes a bug in the prior reconciliation migration (20260705120000): it set
-- trustScore's default to 0.5, matching schema.prisma's own comment at the
-- time ("0.0 - 1.0, default is neutral"). That comment was wrong -- the real
-- scoring algorithm (UsersService's trust-score recalculation: +30 verified,
-- +20 reviews, +15 posts, +10 temple member, -20 active dispute, floored at
-- 0) and every real consumer (getTrustScoreTier's 75/50/30 thresholds,
-- TrustScoreOverrideDto's @Min(0) @Max(100)) treat it as a 0-100 point
-- scale. 0.5 on that scale means every newly created user falls through
-- getTrustScoreTier with no tier at all. The original pre-reconciliation
-- default was 0, which is correct for a 0-100 scale -- restoring it.
--
-- Only affects the default applied to *new* rows going forward; does not
-- touch any existing user's stored trustScore value.

ALTER TABLE "users" ALTER COLUMN "trustScore" SET DEFAULT 0;
