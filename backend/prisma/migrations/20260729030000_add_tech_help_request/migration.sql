-- FOR-009: low-friction tech-help board for elders (BABALAWO asks, any
-- community member can answer).

CREATE TABLE "TechHelpRequest" (
    "id" TEXT NOT NULL,
    "requesterId" TEXT NOT NULL,
    "question" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'OPEN',
    "answer" TEXT,
    "answeredById" TEXT,
    "answeredAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TechHelpRequest_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "TechHelpRequest_status_idx" ON "TechHelpRequest"("status");

ALTER TABLE "TechHelpRequest" ADD CONSTRAINT "TechHelpRequest_requesterId_fkey" FOREIGN KEY ("requesterId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "TechHelpRequest" ADD CONSTRAINT "TechHelpRequest_answeredById_fkey" FOREIGN KEY ("answeredById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
