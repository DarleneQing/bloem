-- Migration 016: Auto-cancel PENDING hanger rentals older than 24 hours

-- Function to cancel overdue pending rentals
CREATE OR REPLACE FUNCTION cancel_overdue_pending_hanger_rentals()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE hanger_rentals
  SET status = 'CANCELLED', updated_at = NOW()
  WHERE status = 'PENDING' AND created_at < NOW() - INTERVAL '24 hours';
END;
$$;

-- Grant execute permission to service role (for API calls)
GRANT EXECUTE ON FUNCTION cancel_overdue_pending_hanger_rentals() TO service_role;

-- Schedule using pg_cron if available; on Supabase, prefer the dashboard Scheduled Jobs.
-- The following will no-op if pg_cron schema is absent.
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_namespace WHERE nspname = 'cron') THEN
    -- Create job if not exists: run every 30 minutes
    PERFORM 1 FROM cron.job WHERE jobname = 'cancel_overdue_pending_hanger_rentals_job';
    IF NOT FOUND THEN
      PERFORM cron.schedule('cancel_overdue_pending_hanger_rentals_job', '*/30 * * * *', 'SELECT cancel_overdue_pending_hanger_rentals();');
    END IF;
  END IF;
END $$;


