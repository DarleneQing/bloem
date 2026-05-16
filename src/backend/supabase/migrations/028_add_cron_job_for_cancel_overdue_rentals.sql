-- Migration 028: Add pg_cron job for cancelling overdue pending hanger rentals
-- Replaces the orphaned `cancel-overdue-rentals` edge function trigger path.
-- The edge function is retained as a manual recovery tool but is no longer the live scheduler.

-- Grant execute permission to service role
GRANT EXECUTE ON FUNCTION cancel_overdue_pending_hanger_rentals() TO service_role;

-- Schedule using pg_cron if available
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_namespace WHERE nspname = 'cron') THEN
    BEGIN
      PERFORM cron.unschedule('cancel_overdue_pending_hanger_rentals_job');
    EXCEPTION
      WHEN OTHERS THEN
        NULL;
    END;

    -- Run hourly. The RPC itself enforces the 24h pending-age threshold,
    -- so the cron cadence only needs to be frequent enough to keep counters fresh.
    PERFORM cron.schedule(
      'cancel_overdue_pending_hanger_rentals_job',
      '0 * * * *',
      'SELECT cancel_overdue_pending_hanger_rentals();'
    );
  END IF;
END $$;

COMMENT ON FUNCTION cancel_overdue_pending_hanger_rentals() IS 'Cancels PENDING hanger_rentals older than 24h. Scheduled hourly via pg_cron.';
