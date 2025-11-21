# Cancel Overdue Hanger Rentals Edge Function

This Supabase Edge Function automatically cancels pending hanger rentals that are older than 24 hours.

## Setup

1. **Set environment variables in Supabase Dashboard**:
   - Go to **Project Settings** → **Edge Functions** → **Secrets**
   - Add:
     - `SUPABASE_URL`: Your Supabase project URL
     - `SUPABASE_SERVICE_ROLE_KEY`: Your service role key (from Settings → API)

2. **Deploy the function**:
   ```bash
   supabase functions deploy cancel-overdue-rentals
   ```

3. **Set up cron trigger in Supabase Dashboard**:
   - Navigate to **Database** → **Cron Jobs**
   - Create new cron job:
     - Function: `cancel-overdue-rentals`
     - Schedule: `*/30 * * * *` (every 30 minutes)

## Testing

```bash
# Invoke manually
supabase functions invoke cancel-overdue-rentals

# Check logs
supabase functions logs cancel-overdue-rentals
```

