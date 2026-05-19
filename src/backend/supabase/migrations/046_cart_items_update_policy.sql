-- Buyers need UPDATE on cart_items to extend reservation expiry (expires_at, reservation_count).
-- Without this policy, extendReservation / POST .../extend silently fail under RLS.

CREATE POLICY "Users can update own cart items"
  ON cart_items
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1
      FROM carts
      WHERE carts.id = cart_items.cart_id
        AND carts.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM carts
      WHERE carts.id = cart_items.cart_id
        AND carts.user_id = auth.uid()
    )
  );
