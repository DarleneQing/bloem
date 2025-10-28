-- Bloem Circular Fashion Marketplace Database Schema
-- Migration 004: Fix Market Deletion Policy

-- ============================================================================
-- UPDATE MARKET DELETION POLICY
-- ============================================================================

-- Drop the existing restrictive policy
DROP POLICY IF EXISTS "Admins can delete draft markets" ON markets;

-- Create a new policy that allows deletion of DRAFT and CANCELLED markets
-- regardless of vendor count (since CANCELLED markets should be cleanable)
CREATE POLICY "Admins can delete draft and cancelled markets"
  ON markets FOR DELETE
  USING (
    is_admin() AND 
    (status = 'DRAFT' OR status = 'CANCELLED')
  );

-- ============================================================================
-- COMMENTS
-- ============================================================================

COMMENT ON POLICY "Admins can delete draft and cancelled markets" ON markets IS 
'Allows admins to delete markets in DRAFT or CANCELLED status. DRAFT markets can be deleted before going live, and CANCELLED markets can be cleaned up after cancellation.';

-- ============================================================================
-- END OF MIGRATION
-- ============================================================================
