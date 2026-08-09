-- Guard against duplicate purchase transactions when concurrent webhook
-- deliveries interleave the idempotency read (see webhook route stale-lease reclaim).
--
-- Duplicates may already exist from the pre-fix era, and CREATE UNIQUE INDEX
-- hard-fails on them — de-dupe first, keeping the earliest created_at row per
-- (stripe_payment_intent_id, item_id) and deleting the rest.
--
-- NOTE: on a large live transactions table, build the index as
--   CREATE UNIQUE INDEX CONCURRENTLY ...
-- run outside a transaction instead, to avoid holding a write lock on the
-- table for the duration of the build.

WITH ranked AS (
  SELECT id,
         row_number() OVER (
           PARTITION BY stripe_payment_intent_id, item_id
           ORDER BY created_at, id
         ) AS rn
  FROM transactions
  WHERE stripe_payment_intent_id IS NOT NULL
    AND item_id IS NOT NULL
)
DELETE FROM transactions
WHERE id IN (SELECT id FROM ranked WHERE rn > 1);

CREATE UNIQUE INDEX IF NOT EXISTS idx_transactions_payment_intent_item
  ON transactions(stripe_payment_intent_id, item_id)
  WHERE stripe_payment_intent_id IS NOT NULL AND item_id IS NOT NULL;
