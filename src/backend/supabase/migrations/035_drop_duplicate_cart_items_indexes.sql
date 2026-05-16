-- Migration 035: Drop duplicate cart_items.expires_at indexes
--
-- Migration 001 created `idx_cart_items_expires ON cart_items(expires_at)`.
-- Migration 024 added `idx_cart_items_expires_at ON cart_items(expires_at)` —
-- structurally identical — and a composite `idx_cart_items_cart_id_expires_at
-- ON cart_items(cart_id, expires_at)`. The composite index covers both the
-- single-column lookup pattern (Postgres can use a leading index column on
-- its own) and the cart-scoped queries, so the two single-column indexes
-- are pure overhead on every cart_items insert / update / delete.
--
-- Keep:  idx_cart_items_cart_id_expires_at  (from 024)
-- Drop:  idx_cart_items_expires             (from 001)
-- Drop:  idx_cart_items_expires_at          (from 024)

DROP INDEX IF EXISTS public.idx_cart_items_expires;
DROP INDEX IF EXISTS public.idx_cart_items_expires_at;
