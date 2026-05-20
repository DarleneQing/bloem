-- Pre-launch signup gate. Single reusable code(s) shared with testers.
-- Validation happens server-side via the service-role admin path
-- (features/invite/actions.ts), so the table never needs to be readable
-- by anon / authenticated clients.
-- Remove at launch by dropping this table.

CREATE TABLE invite_codes (
  code TEXT PRIMARY KEY,
  label TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  revoked_at TIMESTAMPTZ
);

ALTER TABLE invite_codes ENABLE ROW LEVEL SECURITY;

-- Admins may read the codes from the SQL editor and via authenticated
-- service-role calls (service role bypasses RLS regardless). No anon access.
CREATE POLICY "invite_codes_admin_read" ON invite_codes
  FOR SELECT TO authenticated
  USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'ADMIN')
  );

COMMENT ON TABLE invite_codes IS
  'Pre-launch signup gate. Single reusable codes shared with testers. Manually managed via the Supabase SQL editor. Remove at launch.';

COMMENT ON COLUMN invite_codes.code IS
  'The shared invite code (plain text — not a high-value secret like an API key).';

COMMENT ON COLUMN invite_codes.label IS
  'Optional human label (e.g. "friends-and-family-batch-1").';

COMMENT ON COLUMN invite_codes.revoked_at IS
  'Set to a timestamp to revoke a code without deleting the row.';
