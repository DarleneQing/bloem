-- Migration 030: Enable RLS on lookup tables and qr_batches
-- Migration 002 granted INSERT/UPDATE/DELETE on every public table to the
-- `authenticated` role. Tables created later (brands, colors, sizes,
-- item_subcategories, qr_batches) never had RLS enabled, so any logged-in user
-- can mutate them through the anon-key Supabase client. This migration
-- enables RLS and adds public-read / admin-write policies.

-- =========================================================================
-- Lookup tables: read-by-all-authenticated, write-only-by-admin
-- =========================================================================

ALTER TABLE brands ENABLE ROW LEVEL SECURITY;
ALTER TABLE colors ENABLE ROW LEVEL SECURITY;
ALTER TABLE sizes ENABLE ROW LEVEL SECURITY;
ALTER TABLE item_subcategories ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Authenticated can read brands" ON brands;
CREATE POLICY "Authenticated can read brands" ON brands
  FOR SELECT TO authenticated
  USING (true);

DROP POLICY IF EXISTS "Admin can write brands" ON brands;
CREATE POLICY "Admin can write brands" ON brands
  FOR ALL TO authenticated
  USING (is_admin())
  WITH CHECK (is_admin());

DROP POLICY IF EXISTS "Authenticated can read colors" ON colors;
CREATE POLICY "Authenticated can read colors" ON colors
  FOR SELECT TO authenticated
  USING (true);

DROP POLICY IF EXISTS "Admin can write colors" ON colors;
CREATE POLICY "Admin can write colors" ON colors
  FOR ALL TO authenticated
  USING (is_admin())
  WITH CHECK (is_admin());

DROP POLICY IF EXISTS "Authenticated can read sizes" ON sizes;
CREATE POLICY "Authenticated can read sizes" ON sizes
  FOR SELECT TO authenticated
  USING (true);

DROP POLICY IF EXISTS "Admin can write sizes" ON sizes;
CREATE POLICY "Admin can write sizes" ON sizes
  FOR ALL TO authenticated
  USING (is_admin())
  WITH CHECK (is_admin());

DROP POLICY IF EXISTS "Authenticated can read item_subcategories" ON item_subcategories;
CREATE POLICY "Authenticated can read item_subcategories" ON item_subcategories
  FOR SELECT TO authenticated
  USING (true);

DROP POLICY IF EXISTS "Admin can write item_subcategories" ON item_subcategories;
CREATE POLICY "Admin can write item_subcategories" ON item_subcategories
  FOR ALL TO authenticated
  USING (is_admin())
  WITH CHECK (is_admin());

-- =========================================================================
-- qr_batches: admin-only (read AND write)
-- =========================================================================

ALTER TABLE qr_batches ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admin can read qr_batches" ON qr_batches;
CREATE POLICY "Admin can read qr_batches" ON qr_batches
  FOR SELECT TO authenticated
  USING (is_admin());

DROP POLICY IF EXISTS "Admin can write qr_batches" ON qr_batches;
CREATE POLICY "Admin can write qr_batches" ON qr_batches
  FOR ALL TO authenticated
  USING (is_admin())
  WITH CHECK (is_admin());

-- =========================================================================
-- Revoke the over-broad DML grants on lookup tables. RLS would block them
-- anyway, but explicit revocation makes intent obvious and removes the
-- planner's privilege-check overhead.
-- =========================================================================

REVOKE INSERT, UPDATE, DELETE ON brands, colors, sizes, item_subcategories
  FROM authenticated;

REVOKE INSERT, UPDATE, DELETE ON qr_batches FROM authenticated;
