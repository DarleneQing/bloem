-- Migration 057: Aggregate qr_code status counts per batch.
--
-- Replaces the row-fetch + JS grouping in the admin qr-batches route
-- (GET /api/admin/qr-batches), which paged qr_codes with unordered
-- .range() calls — unordered paging can silently corrupt counts across
-- page boundaries, and pulls up to 50k rows for a single listing.
--
-- Runs with invoker rights (no SECURITY DEFINER), so qr_codes RLS still
-- applies exactly as it did to the direct select it replaces.

CREATE OR REPLACE FUNCTION qr_batch_status_counts(batch_ids UUID[])
RETURNS TABLE (batch_id UUID, status qr_code_status, cnt BIGINT)
LANGUAGE sql STABLE
AS $$
  SELECT qr_codes.batch_id, qr_codes.status, count(*)
  FROM qr_codes
  WHERE qr_codes.batch_id = ANY(batch_ids)
  GROUP BY qr_codes.batch_id, qr_codes.status;
$$;

-- The admin route calls this through the authenticated (RLS-scoped) client,
-- not the service role — mirror migration 052's explicit grant.
GRANT EXECUTE ON FUNCTION qr_batch_status_counts(UUID[]) TO authenticated;
