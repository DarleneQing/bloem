-- Admin-reversible account suspension (blocks platform use, not auth sign-in)
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS suspended_at TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS idx_profiles_suspended_at ON profiles(suspended_at)
  WHERE suspended_at IS NOT NULL;

COMMENT ON COLUMN profiles.suspended_at IS 'When set, user cannot use Bloem (reversible by admin).';
