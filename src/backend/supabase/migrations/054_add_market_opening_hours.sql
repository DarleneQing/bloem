-- Migration 054: Add daily opening hours to markets (issue #36)
--
-- start_date / end_date continue to express the market's overall duration
-- (which days it runs). These new columns capture the daily opening hours
-- (e.g. open 10:00, close 18:00). Nullable so existing markets are unaffected.

ALTER TABLE markets
  ADD COLUMN IF NOT EXISTS opening_time TIME,
  ADD COLUMN IF NOT EXISTS closing_time TIME;
