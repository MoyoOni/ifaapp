-- Escrow policy (November 2, 2026). Until now every escrow got
-- autoReleaseAt = payment + 14 days, which nothing read. It now means "pay
-- the recipient on this date", armed only once they say they've delivered,
-- so clear it on every open escrow first: otherwise the new hourly job
-- would pay out escrows for orders that were never shipped.
UPDATE "Escrow" SET "autoReleaseAt" = NULL
WHERE status IN ('HOLD', 'PARTIALLY_RELEASED');

-- Orders already shipped (tier 1 paid out) get the customer's 14 days to
-- confirm from now, and no longer refund the customer on expiry.
UPDATE "Escrow" SET "autoReleaseAt" = NOW() + INTERVAL '14 days', "expiryDate" = NULL
WHERE status = 'PARTIALLY_RELEASED' AND type = 'ORDER' AND "releaseTiers" IS NOT NULL;

-- Mentorship sessions can run past 14 days; cancelling is the client's
-- refund path, so no refund-on-expiry.
UPDATE "Escrow" SET "expiryDate" = NULL
WHERE status IN ('HOLD', 'PARTIALLY_RELEASED') AND type = 'MENTORSHIP_SESSION';
