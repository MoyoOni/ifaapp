-- V8-303: Add isPriority flag to Appointment for Devoted clients

ALTER TABLE "Appointment" ADD COLUMN IF NOT EXISTS "isPriority" BOOLEAN NOT NULL DEFAULT false;
