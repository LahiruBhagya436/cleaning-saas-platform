-- Multi-tenant migration: adds Company model + companyId scoping to
-- users, services, bookings, invoices. Backfills all existing data
-- into a default "Stockholm Cleaning Co." company so nothing breaks.
-- Idempotent: safe to re-run (uses IF NOT EXISTS / guarded DO blocks).

BEGIN;

-- 1. Enums -------------------------------------------------------------
DO $$ BEGIN
  CREATE TYPE "SubscriptionTier" AS ENUM ('starter', 'professional', 'enterprise');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE "SubscriptionStatus" AS ENUM ('trialing', 'active', 'past_due', 'canceled');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- 2. companies table ----------------------------------------------------
CREATE TABLE IF NOT EXISTS "companies" (
  "id"                 TEXT PRIMARY KEY,
  "name"               TEXT NOT NULL,
  "slug"               TEXT NOT NULL UNIQUE,
  "logoUrl"            TEXT,
  "primaryColor"       TEXT NOT NULL DEFAULT '#2563A8',
  "contactEmail"       TEXT NOT NULL,
  "contactPhone"       TEXT,
  "addressLine1"       TEXT,
  "city"               TEXT DEFAULT 'Stockholm',
  "postalCode"         TEXT,
  "stripeAccountId"    TEXT,
  "stripeOnboarded"    BOOLEAN NOT NULL DEFAULT false,
  "subscriptionTier"   "SubscriptionTier" NOT NULL DEFAULT 'starter',
  "subscriptionStatus" "SubscriptionStatus" NOT NULL DEFAULT 'trialing',
  "trialEndsAt"        TIMESTAMP(3),
  "isActive"           BOOLEAN NOT NULL DEFAULT true,
  "createdAt"          TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"          TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 3. Seed the default tenant (your existing business) -------------------
INSERT INTO "companies" ("id", "name", "slug", "contactEmail", "subscriptionTier", "subscriptionStatus", "isActive")
SELECT gen_random_uuid()::text, 'Stockholm Cleaning Co.', 'stockholm-cleaning',
       (SELECT email FROM users WHERE role IN ('admin','superadmin') ORDER BY "createdAt" ASC LIMIT 1),
       'professional', 'active', true
WHERE NOT EXISTS (SELECT 1 FROM "companies" WHERE "slug" = 'stockholm-cleaning');

-- fallback contact email if no admin user exists yet
UPDATE "companies" SET "contactEmail" = 'hello@stockholmcleaning.se'
WHERE "slug" = 'stockholm-cleaning' AND "contactEmail" IS NULL;

-- 4. users.companyId (nullable — superadmins stay platform-wide) --------
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "companyId" TEXT;

UPDATE "users" SET "companyId" = (SELECT "id" FROM "companies" WHERE "slug" = 'stockholm-cleaning')
WHERE "companyId" IS NULL AND "role" <> 'superadmin';

DO $$ BEGIN
  ALTER TABLE "users" ADD CONSTRAINT "users_companyId_fkey"
    FOREIGN KEY ("companyId") REFERENCES "companies"("id");
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE INDEX IF NOT EXISTS "users_companyId_idx" ON "users"("companyId");

-- 5. services.companyId (required) ---------------------------------------
ALTER TABLE "services" ADD COLUMN IF NOT EXISTS "companyId" TEXT;

UPDATE "services" SET "companyId" = (SELECT "id" FROM "companies" WHERE "slug" = 'stockholm-cleaning')
WHERE "companyId" IS NULL;

ALTER TABLE "services" ALTER COLUMN "companyId" SET NOT NULL;

DO $$ BEGIN
  ALTER TABLE "services" ADD CONSTRAINT "services_companyId_fkey"
    FOREIGN KEY ("companyId") REFERENCES "companies"("id");
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE INDEX IF NOT EXISTS "services_companyId_idx" ON "services"("companyId");

-- drop the old global-unique constraint on services.name (whatever it's named)
-- and replace with a per-company composite unique constraint.
DO $$
DECLARE c RECORD;
BEGIN
  FOR c IN
    SELECT con.conname
    FROM pg_constraint con
    JOIN pg_class rel ON rel.oid = con.conrelid
    WHERE rel.relname = 'services' AND con.contype = 'u'
      AND con.conkey = (SELECT array_agg(attnum ORDER BY attnum) FROM pg_attribute
                         WHERE attrelid = rel.oid AND attname = 'name')
  LOOP
    EXECUTE format('ALTER TABLE "services" DROP CONSTRAINT %I', c.conname);
  END LOOP;
END $$;

DO $$ BEGIN
  ALTER TABLE "services" ADD CONSTRAINT "services_companyId_name_key" UNIQUE ("companyId", "name");
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- 6. bookings.companyId (required) ----------------------------------------
ALTER TABLE "bookings" ADD COLUMN IF NOT EXISTS "companyId" TEXT;

UPDATE "bookings" SET "companyId" = (SELECT "id" FROM "companies" WHERE "slug" = 'stockholm-cleaning')
WHERE "companyId" IS NULL;

ALTER TABLE "bookings" ALTER COLUMN "companyId" SET NOT NULL;

DO $$ BEGIN
  ALTER TABLE "bookings" ADD CONSTRAINT "bookings_companyId_fkey"
    FOREIGN KEY ("companyId") REFERENCES "companies"("id");
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE INDEX IF NOT EXISTS "bookings_companyId_idx" ON "bookings"("companyId");

-- 7. invoices.companyId (required) ----------------------------------------
ALTER TABLE "invoices" ADD COLUMN IF NOT EXISTS "companyId" TEXT;

UPDATE "invoices" SET "companyId" = (SELECT "id" FROM "companies" WHERE "slug" = 'stockholm-cleaning')
WHERE "companyId" IS NULL;

ALTER TABLE "invoices" ALTER COLUMN "companyId" SET NOT NULL;

DO $$ BEGIN
  ALTER TABLE "invoices" ADD CONSTRAINT "invoices_companyId_fkey"
    FOREIGN KEY ("companyId") REFERENCES "companies"("id");
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE INDEX IF NOT EXISTS "invoices_companyId_idx" ON "invoices"("companyId");

-- drop the old global-unique constraint on invoices.invoiceNumber
-- and replace with a per-company composite unique constraint.
DO $$
DECLARE c RECORD;
BEGIN
  FOR c IN
    SELECT con.conname
    FROM pg_constraint con
    JOIN pg_class rel ON rel.oid = con.conrelid
    WHERE rel.relname = 'invoices' AND con.contype = 'u'
      AND con.conkey = (SELECT array_agg(attnum ORDER BY attnum) FROM pg_attribute
                         WHERE attrelid = rel.oid AND attname = 'invoiceNumber')
  LOOP
    EXECUTE format('ALTER TABLE "invoices" DROP CONSTRAINT %I', c.conname);
  END LOOP;
END $$;

DO $$ BEGIN
  ALTER TABLE "invoices" ADD CONSTRAINT "invoices_companyId_invoiceNumber_key" UNIQUE ("companyId", "invoiceNumber");
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

COMMIT;

-- Sanity check (run separately if you want to see the result):
-- SELECT (SELECT count(*) FROM companies) companies,
--        (SELECT count(*) FROM users WHERE "companyId" IS NOT NULL) users_scoped,
--        (SELECT count(*) FROM services WHERE "companyId" IS NOT NULL) services_scoped,
--        (SELECT count(*) FROM bookings WHERE "companyId" IS NOT NULL) bookings_scoped,
--        (SELECT count(*) FROM invoices WHERE "companyId" IS NOT NULL) invoices_scoped;
