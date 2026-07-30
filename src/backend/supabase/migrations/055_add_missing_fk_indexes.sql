-- Add missing indexes on foreign keys / hot filter columns.
-- transactions.market_id is filtered by the market payout flow
-- (app/api/admin/payouts/market/[id]) and only exists as an index in one of
-- the two competing 001 baselines; IF NOT EXISTS makes this safe either way.

CREATE INDEX IF NOT EXISTS idx_transactions_market_id ON transactions(market_id);
CREATE INDEX IF NOT EXISTS idx_transactions_item_id ON transactions(item_id);

-- FKs added in 011 without indexes (repo convention: index every FK).
CREATE INDEX IF NOT EXISTS idx_items_brand_id ON items(brand_id);
CREATE INDEX IF NOT EXISTS idx_items_color_id ON items(color_id);
CREATE INDEX IF NOT EXISTS idx_items_size_id ON items(size_id);
CREATE INDEX IF NOT EXISTS idx_items_subcategory_id ON items(subcategory_id);
