-- Migration 052: Fix "permission denied for table qr_batches" on batch creation
--
-- Issue #39: Creating QR batch codes failed with a "permission denied for table"
-- error. Root cause: migration 030 ran
--   REVOKE INSERT, UPDATE, DELETE ON qr_batches FROM authenticated;
-- while keeping an RLS policy ("Admin can write qr_batches") that gates writes
-- to admins. In PostgreSQL, RLS is ANDed with table-level privileges, so once
-- the GRANT was revoked even admins could not insert — and the admin
-- batch-creation Server Action (createQRBatch) runs as the authenticated user,
-- not the service role. createQRBatch inserts into qr_batches first, so the
-- failure surfaced there (the issue text loosely called it "qr_code").
--
-- Fix: restore the table-level grant. Row access stays correctly restricted to
-- admins by the existing RLS policies (is_admin()).

GRANT INSERT, UPDATE, DELETE ON qr_batches TO authenticated;

-- Re-affirm the admin write policy idempotently (no-op if already present).
DROP POLICY IF EXISTS "Admin can write qr_batches" ON qr_batches;
CREATE POLICY "Admin can write qr_batches" ON qr_batches
  FOR ALL
  USING (is_admin())
  WITH CHECK (is_admin());
