-- F9-702: Add forum digest opt-in preference to users
ALTER TABLE "users" ADD COLUMN "forumDigestOptIn" BOOLEAN NOT NULL DEFAULT true;

-- F9-703: Add community builder badge flag to users
ALTER TABLE "users" ADD COLUMN "isCommunityBuilder" BOOLEAN NOT NULL DEFAULT false;
