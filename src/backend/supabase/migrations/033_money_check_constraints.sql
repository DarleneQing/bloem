-- Migration 033: Non-negative CHECK constraints on monetary columns
--
-- DECIMAL(10,2) does not stop a buggy code path (or a SECURITY DEFINER RPC)
-- from writing a negative price/fee. payouts.amount already has a >= 10.00
-- floor; the rest of the money columns are unguarded. CHECK constraints are
-- cheap insurance against an entire class of accounting bugs.

ALTER TABLE items
  ADD CONSTRAINT chk_items_selling_price_nonneg
    CHECK (selling_price IS NULL OR selling_price >= 0);

ALTER TABLE markets
  ADD CONSTRAINT chk_markets_hanger_price_nonneg
    CHECK (hanger_price >= 0);

ALTER TABLE hanger_rentals
  ADD CONSTRAINT chk_hanger_rentals_total_price_nonneg
    CHECK (total_price >= 0);

ALTER TABLE transactions
  ADD CONSTRAINT chk_transactions_amounts_nonneg
    CHECK (
      total_amount >= 0
      AND platform_fee >= 0
      AND seller_amount >= 0
    );

-- Belt-and-braces on the sold-RACK price-required invariant the existing
-- comment in 001_initial_schema.sql claims but never enforced. Items in
-- RACK or SOLD must carry a price; anything else may keep selling_price NULL.
ALTER TABLE items
  ADD CONSTRAINT chk_items_price_when_listed
    CHECK (status NOT IN ('RACK', 'SOLD', 'RESERVED') OR selling_price IS NOT NULL);
