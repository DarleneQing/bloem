-- Marketing / newsletter consent on profiles.
-- See plan: hybrid model where Supabase owns consent, Resend owns delivery.
-- Existing rows default to FALSE — retroactive opt-in is not GDPR-safe.

ALTER TABLE profiles
  ADD COLUMN marketing_consent BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN marketing_consent_updated_at TIMESTAMPTZ,
  ADD COLUMN marketing_unsubscribe_token UUID NOT NULL DEFAULT gen_random_uuid();

ALTER TABLE profiles
  ADD CONSTRAINT profiles_marketing_unsubscribe_token_key UNIQUE (marketing_unsubscribe_token);

-- Partial index: only rows we'd actually email get indexed.
CREATE INDEX idx_profiles_marketing_subscribed
  ON profiles (marketing_consent_updated_at DESC)
  WHERE marketing_consent = TRUE;

COMMENT ON COLUMN profiles.marketing_consent IS
  'TRUE when the user has explicitly opted in to marketing emails. Source of truth; Resend audiences are a projection of this.';

COMMENT ON COLUMN profiles.marketing_consent_updated_at IS
  'Timestamp of the most recent consent change (opt-in or opt-out). Required for GDPR audit trail.';

COMMENT ON COLUMN profiles.marketing_unsubscribe_token IS
  'Opaque token used in one-click unsubscribe links sent in broadcast footers. Looked up by the public /api/marketing/unsubscribe route.';
