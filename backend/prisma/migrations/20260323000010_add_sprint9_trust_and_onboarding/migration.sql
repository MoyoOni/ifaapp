-- F9-901: Add Trust Score field to User
ALTER TABLE "users" ADD COLUMN "trustScore" INTEGER NOT NULL DEFAULT 0;

-- F9-902: Add Cultural Onboarding Gate field to User
ALTER TABLE "users" ADD COLUMN "passedCulturalOrientation" BOOLEAN NOT NULL DEFAULT false;
