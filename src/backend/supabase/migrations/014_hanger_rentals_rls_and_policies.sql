-- Migration 014: RLS policies for hanger_rentals with ADMIN override and status guards

-- Ensure status constraint exists
-- Add status column if missing (for older initial schema)
ALTER TABLE hanger_rentals
  ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'PENDING' NOT NULL;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'hanger_rentals_status_check'
  ) THEN
    ALTER TABLE hanger_rentals
      ADD CONSTRAINT hanger_rentals_status_check
      CHECK (status IN ('PENDING','CONFIRMED','CANCELLED'));
  END IF;
END $$;

-- Enable RLS
ALTER TABLE hanger_rentals ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if any (idempotent)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'hanger_rentals' AND policyname = 'owner_select_or_admin'
  ) THEN
    EXECUTE 'DROP POLICY owner_select_or_admin ON hanger_rentals';
  END IF;
  IF EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'hanger_rentals' AND policyname = 'owner_insert'
  ) THEN
    EXECUTE 'DROP POLICY owner_insert ON hanger_rentals';
  END IF;
  IF EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'hanger_rentals' AND policyname = 'owner_update_pending'
  ) THEN
    EXECUTE 'DROP POLICY owner_update_pending ON hanger_rentals';
  END IF;
  IF EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'hanger_rentals' AND policyname = 'owner_delete_pending'
  ) THEN
    EXECUTE 'DROP POLICY owner_delete_pending ON hanger_rentals';
  END IF;
  IF EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'hanger_rentals' AND policyname = 'admin_all'
  ) THEN
    EXECUTE 'DROP POLICY admin_all ON hanger_rentals';
  END IF;
END $$;

-- Select for owner or admin
CREATE POLICY owner_select_or_admin ON hanger_rentals
  FOR SELECT
  USING (
    seller_id = auth.uid() OR EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role = 'ADMIN')
  );

-- Insert by owner only (seller_id must match auth.uid)
CREATE POLICY owner_insert ON hanger_rentals
  FOR INSERT
  WITH CHECK (
    seller_id = auth.uid()
  );

-- Update only when pending and owner; admin policy below can override
CREATE POLICY owner_update_pending ON hanger_rentals
  FOR UPDATE
  USING (
    seller_id = auth.uid() AND status = 'PENDING'
  )
  WITH CHECK (
    seller_id = auth.uid() AND status = 'PENDING'
  );

-- Delete only when pending and owner
CREATE POLICY owner_delete_pending ON hanger_rentals
  FOR DELETE
  USING (
    seller_id = auth.uid() AND status = 'PENDING'
  );

-- Admin full access
CREATE POLICY admin_all ON hanger_rentals
  FOR ALL
  USING (
    EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role = 'ADMIN')
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role = 'ADMIN')
  );


