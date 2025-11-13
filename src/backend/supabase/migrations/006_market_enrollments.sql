-- Market Enrollments Table
-- Tracks seller registrations to markets

CREATE TABLE IF NOT EXISTS market_enrollments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  market_id UUID NOT NULL REFERENCES markets(id) ON DELETE CASCADE,
  seller_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  UNIQUE (market_id, seller_id)
);

CREATE INDEX IF NOT EXISTS idx_market_enrollments_market_id ON market_enrollments(market_id);
CREATE INDEX IF NOT EXISTS idx_market_enrollments_seller_id ON market_enrollments(seller_id);


