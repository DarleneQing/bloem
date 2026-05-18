-- Stripe webhook idempotency + payout transfer tracking

CREATE TABLE IF NOT EXISTS stripe_webhook_events (
  id TEXT PRIMARY KEY,
  type TEXT NOT NULL,
  payload JSONB NOT NULL,
  processed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  status TEXT NOT NULL DEFAULT 'PROCESSED'
    CHECK (status IN ('PROCESSED', 'FAILED'))
);

ALTER TABLE payouts
  ADD COLUMN IF NOT EXISTS stripe_transfer_id TEXT UNIQUE,
  ADD COLUMN IF NOT EXISTS market_id UUID REFERENCES markets(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_payouts_market_id ON payouts(market_id);
CREATE INDEX IF NOT EXISTS idx_payouts_stripe_transfer_id ON payouts(stripe_transfer_id);

-- Service role only: webhooks insert audit rows
ALTER TABLE stripe_webhook_events ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON stripe_webhook_events FROM anon, authenticated;
