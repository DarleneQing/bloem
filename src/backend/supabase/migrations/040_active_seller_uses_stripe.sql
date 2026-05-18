-- Active seller gate: Stripe Connect payouts enabled (grandfather legacy IBAN sellers)

CREATE OR REPLACE FUNCTION is_active_seller(user_id UUID)
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM profiles
    WHERE id = user_id
      AND (
        stripe_payouts_enabled = TRUE
        OR iban_verified_at IS NOT NULL
      )
  );
$$ LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public;
