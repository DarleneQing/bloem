# Supabase Database Migrations

This directory contains SQL migration files for the Bloem marketplace database schema.

## Migrations

### 001_initial_schema.sql
Complete database schema including:
- All ENUM types
- 11 core tables (profiles, items, markets, hanger_rentals, qr_codes, carts, cart_items, transactions, payouts, notifications, favorites)
- Indexes for performance optimization
- Triggers for automatic timestamp updates
- Helper functions for business logic
- Foreign key constraints and relationships

### 002_rls_policies.sql
Row Level Security policies for all tables:
- User-level access control
- Admin privileges
- Seller-specific permissions
- Cart and transaction security
- Storage bucket policies

## How to Execute Migrations

### Option 1: Supabase Dashboard (Recommended for initial setup)

1. Go to your Supabase project dashboard
2. Navigate to the SQL Editor
3. Create a new query
4. Copy and paste the contents of `001_initial_schema.sql`
5. Click "Run" to execute
6. Repeat steps 3-5 for `002_rls_policies.sql`

### Option 2: Supabase CLI

1. Install Supabase CLI:
```bash
npm install -g supabase
```

2. Link to your project:
```bash
supabase link --project-ref your-project-ref
```

3. Apply migrations:
```bash
supabase db push
```

### Option 3: Direct SQL Execution

1. Connect to your Supabase database using the connection string
2. Execute the migration files in order:
```bash
psql "your-connection-string" < migrations/001_initial_schema.sql
psql "your-connection-string" < migrations/002_rls_policies.sql
```

## Post-Migration Setup

### 1. Create Storage Buckets

In Supabase Dashboard > Storage, create two buckets:

**Bucket 1: items-images-full**
- Public: Yes
- File size limit: 5 MB
- Allowed MIME types: image/jpeg, image/png, image/webp

**Bucket 2: items-images-thumbnails**
- Public: Yes
- File size limit: 500 KB
- Allowed MIME types: image/jpeg, image/png, image/webp

### 2. Configure Storage Policies

For each bucket, add these policies in Dashboard > Storage > Policies:

**Select (View) Policy:**
```sql
true  -- Anyone can view images
```

**Insert (Upload) Policy:**
```sql
(bucket_id = 'items-images-full' AND auth.role() = 'authenticated')
```

**Update Policy:**
```sql
(bucket_id = 'items-images-full' AND auth.uid()::text = (storage.foldername(name))[1])
```

**Delete Policy:**
```sql
(bucket_id = 'items-images-full' AND auth.uid()::text = (storage.foldername(name))[1])
```

### 3. Enable Realtime (Optional)

For real-time notifications, enable Realtime on the notifications table:

1. Go to Database > Replication
2. Enable replication for the `notifications` table

### 4. Create First Admin User

After creating your first user through the authentication flow, promote them to admin:

```sql
UPDATE profiles 
SET role = 'ADMIN' 
WHERE email = 'your-admin-email@example.com';
```

## Database Schema Overview

### Core Tables

- **profiles**: User accounts and seller information
- **items**: Wardrobe items and marketplace listings
- **markets**: Pop-up market events
- **hanger_rentals**: Seller hanger reservations per market
- **qr_codes**: Pre-generated QR codes for items
- **carts**: Shopping carts
- **cart_items**: Items in carts with 15-minute reservations
- **transactions**: All financial transactions
- **payouts**: Seller payout requests
- **notifications**: User notifications
- **favorites**: User-favorited markets

### Key Features

- Automatic profile creation on user signup
- 15-minute cart item reservations
- Market vendor capacity tracking
- Seller earnings calculation
- Expired cart cleanup function
- Full-text search on items
- Geospatial indexing for markets

## Verification

After running migrations, verify the setup:

```sql
-- Check tables
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
ORDER BY table_name;

-- Check RLS is enabled
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public';

-- Check policies
SELECT schemaname, tablename, policyname 
FROM pg_policies 
WHERE schemaname = 'public';
```

## Rollback

If you need to rollback migrations:

```sql
-- Drop all tables (BE CAREFUL!)
DROP SCHEMA public CASCADE;
CREATE SCHEMA public;
GRANT ALL ON SCHEMA public TO postgres;
GRANT ALL ON SCHEMA public TO public;
```

## Support

For issues with migrations, check:
- Supabase Dashboard > Database > Logs
- PostgreSQL error messages
- RLS policy conflicts

