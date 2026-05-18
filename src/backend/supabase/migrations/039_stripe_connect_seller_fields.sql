-- Stripe Connect fields on seller profiles

ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS stripe_account_id TEXT UNIQUE,
  ADD COLUMN IF NOT EXISTS stripe_charges_enabled BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS stripe_payouts_enabled BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS stripe_details_submitted BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS stripe_requirements_due JSONB;

CREATE INDEX IF NOT EXISTS idx_profiles_stripe_account_id ON profiles(stripe_account_id);

COMMENT ON COLUMN profiles.stripe_account_id IS 'Stripe Connect Express account id (acct_...)';
COMMENT ON COLUMN profiles.stripe_payouts_enabled IS 'True when Connect account can receive transfers/payouts';
