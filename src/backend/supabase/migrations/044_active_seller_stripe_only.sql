-- Active seller requires Stripe Connect payouts (legacy IBAN columns retained for history/admin)

CREATE OR REPLACE FUNCTION is_active_seller(user_id UUID)
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM profiles
    WHERE id = user_id
      AND stripe_payouts_enabled = TRUE
  );
$$ LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public;

COMMENT ON FUNCTION is_active_seller(UUID) IS
  'True when seller has completed Stripe Connect and payouts are enabled. Legacy iban_verified_at is not used.';

-- Public profile reads: Stripe-active sellers, or anyone with a public wardrobe
DROP POLICY IF EXISTS "Public can view seller basic info" ON profiles;

CREATE POLICY "Public can view seller basic info"
  ON profiles FOR SELECT
  USING (
    stripe_payouts_enabled = TRUE
    OR wardrobe_status = 'PUBLIC'
  );
