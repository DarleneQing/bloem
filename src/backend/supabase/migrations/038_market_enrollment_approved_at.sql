-- When an enrollment is approved, record approval time separately from application submission.

ALTER TABLE public.market_enrollments
  ADD COLUMN IF NOT EXISTS approved_at TIMESTAMPTZ;

UPDATE public.market_enrollments
SET approved_at = created_at
WHERE status = 'APPROVED'
  AND approved_at IS NULL;
