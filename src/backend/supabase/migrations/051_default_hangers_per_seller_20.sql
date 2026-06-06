-- Migration 051: Default max_hangers_per_seller to 20
--
-- Issue #37: New markets should default to 20 hangers per seller instead of the
-- previous default of 5 (set in migration 013). This only changes the column
-- default for newly inserted rows; existing markets keep their stored value.

ALTER TABLE markets
  ALTER COLUMN max_hangers_per_seller SET DEFAULT 20;
