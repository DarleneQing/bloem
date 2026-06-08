-- Migration 053: Add optional "fit" attribute to items (issue #35)
--
-- Lets sellers optionally indicate how an item fits relative to its labelled
-- size: runs small / true to size / runs large. Nullable because it is optional.

DO $$ BEGIN
  CREATE TYPE fit_type AS ENUM ('RUN_SMALL', 'TRUE_TO_SIZE', 'RUN_LARGE');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

ALTER TABLE items
  ADD COLUMN IF NOT EXISTS fit fit_type;
