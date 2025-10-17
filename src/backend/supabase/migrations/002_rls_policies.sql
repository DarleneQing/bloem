-- Bloem Circular Fashion Marketplace RLS Policies
-- Migration 002: Row Level Security Policies

-- ============================================================================
-- ENABLE RLS ON ALL TABLES
-- ============================================================================

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE items ENABLE ROW LEVEL SECURITY;
ALTER TABLE markets ENABLE ROW LEVEL SECURITY;
ALTER TABLE hanger_rentals ENABLE ROW LEVEL SECURITY;
ALTER TABLE qr_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE carts ENABLE ROW LEVEL SECURITY;
ALTER TABLE cart_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE payouts ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE favorites ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- HELPER FUNCTIONS FOR RLS
-- ============================================================================

-- Check if current user is admin
CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = auth.uid() AND role = 'ADMIN'
  );
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

-- Check if current user is active seller
CREATE OR REPLACE FUNCTION current_user_is_active_seller()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN is_active_seller(auth.uid());
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

-- ============================================================================
-- PROFILES POLICIES
-- ============================================================================

-- Users can view their own profile
CREATE POLICY "Users can view own profile"
  ON profiles FOR SELECT
  USING (auth.uid() = id);

-- Users can update their own profile
CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  USING (auth.uid() = id);

-- Admins can view all profiles
CREATE POLICY "Admins can view all profiles"
  ON profiles FOR SELECT
  USING (is_admin());

-- Admins can update any profile
CREATE POLICY "Admins can update any profile"
  ON profiles FOR UPDATE
  USING (is_admin());

-- Public can view basic seller information (for public wardrobes)
CREATE POLICY "Public can view seller basic info"
  ON profiles FOR SELECT
  USING (iban_verified_at IS NOT NULL);

-- ============================================================================
-- ITEMS POLICIES
-- ============================================================================

-- Users can view their own items (all statuses)
CREATE POLICY "Users can view own items"
  ON items FOR SELECT
  USING (auth.uid() = owner_id);

-- Users can view public items from other users
CREATE POLICY "Users can view public items"
  ON items FOR SELECT
  USING (
    status = 'RACK' OR 
    (status = 'WARDROBE' AND EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = items.owner_id 
      AND profiles.wardrobe_status = 'PUBLIC'
    )) OR
    auth.uid() = owner_id
  );

-- Users can insert items into their wardrobe
CREATE POLICY "Users can create items"
  ON items FOR INSERT
  WITH CHECK (auth.uid() = owner_id);

-- Users can update their own items (with status restrictions)
CREATE POLICY "Users can update own items"
  ON items FOR UPDATE
  USING (auth.uid() = owner_id)
  WITH CHECK (auth.uid() = owner_id);

-- Users can delete their own items (only if not SOLD)
CREATE POLICY "Users can delete own items"
  ON items FOR DELETE
  USING (
    auth.uid() = owner_id AND 
    status != 'SOLD'
  );

-- Admins can view all items
CREATE POLICY "Admins can view all items"
  ON items FOR SELECT
  USING (is_admin());

-- Admins can update any item
CREATE POLICY "Admins can update any item"
  ON items FOR UPDATE
  USING (is_admin());

-- Admins can delete any item
CREATE POLICY "Admins can delete any item"
  ON items FOR DELETE
  USING (is_admin());

-- ============================================================================
-- MARKETS POLICIES
-- ============================================================================

-- Anyone (authenticated) can view ACTIVE and COMPLETED markets
CREATE POLICY "Users can view active markets"
  ON markets FOR SELECT
  USING (status IN ('ACTIVE', 'COMPLETED'));

-- Admins can view all markets (including DRAFT)
CREATE POLICY "Admins can view all markets"
  ON markets FOR SELECT
  USING (is_admin());

-- Admins can create markets
CREATE POLICY "Admins can create markets"
  ON markets FOR INSERT
  WITH CHECK (is_admin());

-- Admins can update markets
CREATE POLICY "Admins can update markets"
  ON markets FOR UPDATE
  USING (is_admin());

-- Admins can delete markets (only DRAFT with no vendors)
CREATE POLICY "Admins can delete draft markets"
  ON markets FOR DELETE
  USING (is_admin() AND status = 'DRAFT' AND current_vendors = 0);

-- ============================================================================
-- HANGER RENTALS POLICIES
-- ============================================================================

-- Sellers can view their own rentals
CREATE POLICY "Sellers can view own rentals"
  ON hanger_rentals FOR SELECT
  USING (auth.uid() = seller_id);

-- Active sellers can create rentals
CREATE POLICY "Active sellers can create rentals"
  ON hanger_rentals FOR INSERT
  WITH CHECK (
    auth.uid() = seller_id AND 
    current_user_is_active_seller()
  );

-- Sellers can update their own rentals
CREATE POLICY "Sellers can update own rentals"
  ON hanger_rentals FOR UPDATE
  USING (auth.uid() = seller_id);

-- Admins can view all rentals
CREATE POLICY "Admins can view all rentals"
  ON hanger_rentals FOR SELECT
  USING (is_admin());

-- Admins can manage all rentals
CREATE POLICY "Admins can manage rentals"
  ON hanger_rentals FOR ALL
  USING (is_admin());

-- ============================================================================
-- QR CODES POLICIES
-- ============================================================================

-- Anyone can view QR codes (for scanning)
CREATE POLICY "Anyone can view qr codes"
  ON qr_codes FOR SELECT
  USING (true);

-- Only admins can create QR codes
CREATE POLICY "Admins can create qr codes"
  ON qr_codes FOR INSERT
  WITH CHECK (is_admin());

-- Sellers can update QR codes they link to their items
CREATE POLICY "Sellers can link qr codes to own items"
  ON qr_codes FOR UPDATE
  USING (
    status = 'UNUSED' OR 
    EXISTS (
      SELECT 1 FROM items 
      WHERE items.id = qr_codes.item_id AND items.owner_id = auth.uid()
    )
  );

-- Admins can manage all QR codes
CREATE POLICY "Admins can manage qr codes"
  ON qr_codes FOR ALL
  USING (is_admin());

-- ============================================================================
-- CARTS POLICIES
-- ============================================================================

-- Users can view their own cart
CREATE POLICY "Users can view own cart"
  ON carts FOR SELECT
  USING (auth.uid() = user_id);

-- Users can create their own cart
CREATE POLICY "Users can create own cart"
  ON carts FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can update their own cart
CREATE POLICY "Users can update own cart"
  ON carts FOR UPDATE
  USING (auth.uid() = user_id);

-- Users can delete their own cart
CREATE POLICY "Users can delete own cart"
  ON carts FOR DELETE
  USING (auth.uid() = user_id);

-- ============================================================================
-- CART ITEMS POLICIES
-- ============================================================================

-- Users can view items in their own cart
CREATE POLICY "Users can view own cart items"
  ON cart_items FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM carts 
      WHERE carts.id = cart_items.cart_id AND carts.user_id = auth.uid()
    )
  );

-- Users can add items to their own cart
CREATE POLICY "Users can add to own cart"
  ON cart_items FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM carts 
      WHERE carts.id = cart_items.cart_id AND carts.user_id = auth.uid()
    )
  );

-- Users can remove items from their own cart
CREATE POLICY "Users can remove from own cart"
  ON cart_items FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM carts 
      WHERE carts.id = cart_items.cart_id AND carts.user_id = auth.uid()
    )
  );

-- ============================================================================
-- TRANSACTIONS POLICIES
-- ============================================================================

-- Users can view their own transactions (as buyer or seller)
CREATE POLICY "Users can view own transactions"
  ON transactions FOR SELECT
  USING (
    auth.uid() = buyer_id OR 
    auth.uid() = seller_id
  );

-- System can create transactions (handled by backend)
CREATE POLICY "Service role can create transactions"
  ON transactions FOR INSERT
  WITH CHECK (true);

-- System can update transactions (handled by backend)
CREATE POLICY "Service role can update transactions"
  ON transactions FOR UPDATE
  USING (true);

-- Admins can view all transactions
CREATE POLICY "Admins can view all transactions"
  ON transactions FOR SELECT
  USING (is_admin());

-- Admins can manage all transactions
CREATE POLICY "Admins can manage transactions"
  ON transactions FOR ALL
  USING (is_admin());

-- ============================================================================
-- PAYOUTS POLICIES
-- ============================================================================

-- Sellers can view their own payouts
CREATE POLICY "Sellers can view own payouts"
  ON payouts FOR SELECT
  USING (auth.uid() = seller_id);

-- Active sellers can request payouts
CREATE POLICY "Active sellers can request payouts"
  ON payouts FOR INSERT
  WITH CHECK (
    auth.uid() = seller_id AND 
    current_user_is_active_seller()
  );

-- Admins can view all payouts
CREATE POLICY "Admins can view all payouts"
  ON payouts FOR SELECT
  USING (is_admin());

-- Admins can manage all payouts
CREATE POLICY "Admins can manage payouts"
  ON payouts FOR ALL
  USING (is_admin());

-- ============================================================================
-- NOTIFICATIONS POLICIES
-- ============================================================================

-- Users can view their own notifications
CREATE POLICY "Users can view own notifications"
  ON notifications FOR SELECT
  USING (auth.uid() = user_id);

-- Users can update their own notifications (mark as read)
CREATE POLICY "Users can update own notifications"
  ON notifications FOR UPDATE
  USING (auth.uid() = user_id);

-- Users can delete their own notifications
CREATE POLICY "Users can delete own notifications"
  ON notifications FOR DELETE
  USING (auth.uid() = user_id);

-- System can create notifications (handled by backend)
CREATE POLICY "Service role can create notifications"
  ON notifications FOR INSERT
  WITH CHECK (true);

-- Admins can view all notifications
CREATE POLICY "Admins can view all notifications"
  ON notifications FOR SELECT
  USING (is_admin());

-- ============================================================================
-- FAVORITES POLICIES
-- ============================================================================

-- Users can view their own favorites
CREATE POLICY "Users can view own favorites"
  ON favorites FOR SELECT
  USING (auth.uid() = user_id);

-- Users can add favorites
CREATE POLICY "Users can add favorites"
  ON favorites FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can remove their own favorites
CREATE POLICY "Users can remove own favorites"
  ON favorites FOR DELETE
  USING (auth.uid() = user_id);

-- ============================================================================
-- STORAGE POLICIES (for Supabase Storage buckets)
-- ============================================================================

-- Items Images Bucket Policies
-- Note: These need to be created in Supabase dashboard or via API

-- Policy: Anyone can view item images
-- Bucket: items-images-full
-- Operation: SELECT
-- Policy: authenticated = true OR anon = true

-- Policy: Users can upload their own images
-- Bucket: items-images-full
-- Operation: INSERT
-- Policy: (bucket_id = 'items-images-full' AND auth.role() = 'authenticated')

-- Policy: Users can update their own images
-- Bucket: items-images-full
-- Operation: UPDATE
-- Policy: (bucket_id = 'items-images-full' AND auth.uid()::text = (storage.foldername(name))[1])

-- Policy: Users can delete their own images
-- Bucket: items-images-full
-- Operation: DELETE
-- Policy: (bucket_id = 'items-images-full' AND auth.uid()::text = (storage.foldername(name))[1])

-- Similar policies for items-images-thumbnails bucket

-- ============================================================================
-- GRANT PERMISSIONS
-- ============================================================================

-- Grant usage on schemas
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT USAGE ON SCHEMA public TO anon;

-- Grant access to tables for authenticated users
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT SELECT ON ALL TABLES IN SCHEMA public TO anon;

-- Grant access to sequences
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO authenticated;

-- ============================================================================
-- END OF RLS POLICIES
-- ============================================================================

