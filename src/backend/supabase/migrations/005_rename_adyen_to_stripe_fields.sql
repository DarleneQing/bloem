-- ============================================================================
-- MIGRATION 005: Rename Adyen fields to Stripe fields
-- ============================================================================
-- 
-- This migration renames payment provider fields from Adyen to Stripe naming
-- to maintain consistency with the updated payment integration.
--
-- Changes:
-- - transactions.adyen_psp_reference → transactions.stripe_payment_intent_id
-- - transactions.adyen_session_id → transactions.stripe_session_id  
-- - payouts.adyen_payout_reference → payouts.stripe_payout_id
--
-- ============================================================================

-- Rename columns in transactions table
ALTER TABLE transactions 
  RENAME COLUMN adyen_psp_reference TO stripe_payment_intent_id;

ALTER TABLE transactions 
  RENAME COLUMN adyen_session_id TO stripe_session_id;

-- Rename column in payouts table
ALTER TABLE payouts 
  RENAME COLUMN adyen_payout_reference TO stripe_payout_id;

-- Add comments to document the new field purposes
COMMENT ON COLUMN transactions.stripe_payment_intent_id IS 'Stripe PaymentIntent ID for tracking payment status';
COMMENT ON COLUMN transactions.stripe_session_id IS 'Stripe Checkout Session ID for payment sessions';
COMMENT ON COLUMN payouts.stripe_payout_id IS 'Stripe Payout ID for tracking payout status';

-- ============================================================================
-- VERIFICATION QUERIES (for testing - remove in production)
-- ============================================================================

-- Verify the changes were applied correctly
-- SELECT column_name, data_type, is_nullable 
-- FROM information_schema.columns 
-- WHERE table_name = 'transactions' 
-- AND column_name LIKE '%stripe%';

-- SELECT column_name, data_type, is_nullable 
-- FROM information_schema.columns 
-- WHERE table_name = 'payouts' 
-- AND column_name LIKE '%stripe%';
