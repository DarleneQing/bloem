# Cleanup Expired Cart Items Edge Function

This Supabase Edge Function automatically removes expired cart items and returns the items back to RACK status.

## What It Does

- Deletes cart items where `expires_at < NOW()`
- Database triggers automatically return items to RACK status
- Runs every 5 minutes via pg_cron

## Setup

1. **Set environment variables in Supabase Dashboard**:
   - Go to **Project Settings** → **Edge Functions** → **Secrets**
   - Add:
     - `SUPABASE_URL`: Your Supabase project URL
     - `SUPABASE_SERVICE_ROLE_KEY`: Your service role key (from Settings → API)

2. **Deploy the function**:
   ```bash
   supabase functions deploy cleanup-expired-carts
   ```

3. **Set up cron trigger in Supabase Dashboard**:
   - Navigate to **Database** → **Cron Jobs** (or use pg_cron via SQL)
   - Create new cron job:
     - Function: `cleanup-expired-carts`
     - Schedule: `*/5 * * * *` (every 5 minutes)
   
   Or run the migration `027_add_cron_job_for_cart_cleanup.sql` which sets this up automatically.

## Testing

```bash
# Invoke manually
supabase functions invoke cleanup-expired-carts

# Check logs
supabase functions logs cleanup-expired-carts
```

## Response Format

### Success Response
```json
{
  "success": true,
  "message": "Expired cart items cleaned up successfully",
  "clearedCount": 5,
  "timestamp": "2025-01-15T10:30:00.000Z"
}
```

### Error Response
```json
{
  "success": false,
  "error": "Failed to cleanup expired cart items",
  "details": "error details here"
}
```

