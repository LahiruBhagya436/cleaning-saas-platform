-- AddWorkerProfileFields
-- Adds full worker / staff profile columns to the users table.
-- All new columns are nullable so existing rows are unaffected.

ALTER TABLE "users"
  ADD COLUMN IF NOT EXISTS "addressLine1"     TEXT,
  ADD COLUMN IF NOT EXISTS "city"             TEXT,
  ADD COLUMN IF NOT EXISTS "postalCode"       TEXT,
  ADD COLUMN IF NOT EXISTS "bankAccountEnc"   TEXT,
  ADD COLUMN IF NOT EXISTS "bankClearingNo"   TEXT,
  ADD COLUMN IF NOT EXISTS "emergencyContact" TEXT,
  ADD COLUMN IF NOT EXISTS "emergencyPhone"   TEXT,
  ADD COLUMN IF NOT EXISTS "hireDate"         DATE,
  ADD COLUMN IF NOT EXISTS "employmentNotes"  TEXT;
