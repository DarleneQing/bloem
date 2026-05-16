-- Migration 031: Tighten over-broad RLS policies
--
-- Three policies in 002_rls_policies.sql let any authenticated user write
-- through the anon-key Supabase client:
--   * "Service role can create transactions" — WITH CHECK (true)
--   * "Service role can update transactions"  — USING (true)
--   * "Service role can create notifications" — WITH CHECK (true)
-- The intent was that only the backend service role would use these paths,
-- but service role already bypasses RLS — these policies only ever helped
-- the anon/authenticated client. Dropping them closes the hole.
--
-- A fourth policy "Sellers can update own rentals" used USING without
-- WITH CHECK, so a seller could rewrite their row's seller_id to anyone.

-- =========================================================================
-- transactions
-- =========================================================================

DROP POLICY IF EXISTS "Service role can create transactions" ON transactions;
DROP POLICY IF EXISTS "Service role can update transactions" ON transactions;

-- Buyers may insert their own pending transaction rows; everything else
-- must go through a SECURITY DEFINER RPC or the service role.
CREATE POLICY "Buyers can create own transactions"
  ON transactions FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = buyer_id);

-- =========================================================================
-- notifications
-- =========================================================================

DROP POLICY IF EXISTS "Service role can create notifications" ON notifications;

-- Notification rows must be written by the service role or a SECURITY
-- DEFINER RPC. No authenticated INSERT policy is created on purpose.

-- =========================================================================
-- hanger_rentals — fix missing WITH CHECK
-- =========================================================================

DROP POLICY IF EXISTS "Sellers can update own rentals" ON hanger_rentals;

CREATE POLICY "Sellers can update own rentals"
  ON hanger_rentals FOR UPDATE TO authenticated
  USING (auth.uid() = seller_id)
  WITH CHECK (auth.uid() = seller_id);
