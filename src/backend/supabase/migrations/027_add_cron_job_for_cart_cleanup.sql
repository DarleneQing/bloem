-- Migration 027: Add pg_cron job for cart cleanup
-- This migration sets up automatic cleanup of expired cart items

-- Grant execute permission to service role for Edge Function calls
GRANT EXECUTE ON FUNCTION cleanup_expired_cart_items() TO service_role;

-- Schedule using pg_cron if available
-- On Supabase, you can also use the Dashboard > Database > Cron Jobs UI
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_namespace WHERE nspname = 'cron') THEN
    -- Remove existing job if it exists (ignore error if job doesn't exist)
    BEGIN
      PERFORM cron.unschedule('cleanup_expired_cart_items_job');
    EXCEPTION
      WHEN OTHERS THEN
        -- Job doesn't exist, which is fine
        NULL;
    END;
    
    -- Create job: run every 5 minutes (same as previous Vercel cron)
    PERFORM cron.schedule(
      'cleanup_expired_cart_items_job',
      '*/5 * * * *',
      'SELECT cleanup_expired_cart_items();'
    );
  END IF;
END $$;

-- Add comment for documentation
COMMENT ON FUNCTION cleanup_expired_cart_items() IS 'Removes expired cart items and returns them to RACK status via triggers. Scheduled to run every 5 minutes.';

