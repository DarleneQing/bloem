-- Guard against duplicate purchase transactions when concurrent webhook
-- deliveries interleave the idempotency read (see webhook route stale-lease reclaim).
CREATE UNIQUE INDEX IF NOT EXISTS idx_transactions_payment_intent_item
  ON transactions(stripe_payment_intent_id, item_id)
  WHERE stripe_payment_intent_id IS NOT NULL AND item_id IS NOT NULL;
