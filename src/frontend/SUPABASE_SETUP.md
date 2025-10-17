# Complete Supabase Setup Guide for Phase 0.3

This guide walks you through completing Phase 0.3: Supabase Project Setup.

## Prerequisites

- ✅ Supabase account created
- ✅ Supabase project created
- ✅ Project is active (not paused)

## Part 1: Get Your Supabase Credentials

### Step 1: Access Your Project

1. Go to [Supabase Dashboard](https://app.supabase.com)
2. Sign in to your account
3. Select your Bloem project (or the project you created for this app)

### Step 2: Get API Credentials

1. In your project dashboard, click **Settings** (gear icon in sidebar)
2. Click **API** in the settings menu
3. You'll see the API Settings page

### Step 3: Copy Your Credentials

You need three values:

**1. Project URL:**
```
Location: Configuration > Project URL
Format: https://xxxxxxxxxxxxx.supabase.co
Copy this value
```

**2. Anon/Public Key:**
```
Location: Project API keys > anon public
Format: eyJhbGc... (long JWT token)
This is safe to use in client-side code
Copy this value
```

**3. Service Role Key:**
```
Location: Project API keys > service_role
Format: eyJhbGc... (long JWT token)
⚠️ IMPORTANT: This is a SECRET key - never commit to git!
Copy this value
```

## Part 2: Configure Environment Variables

### Step 1: Create .env.local File

In your terminal, from the project root:

```bash
cd src/frontend
cp env.example .env.local
```

### Step 2: Add Your Credentials

Open `src/frontend/.env.local` in your editor and replace the placeholder values:

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://your-actual-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.ey...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.ey...

# Leave the rest as placeholders for now
NEXT_PUBLIC_ADYEN_CLIENT_KEY=placeholder
ADYEN_API_KEY=placeholder
ADYEN_MERCHANT_ACCOUNT=placeholder
ADYEN_HMAC_KEY=placeholder
RESEND_API_KEY=placeholder
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### Step 3: Verify .env.local is Ignored

Check that `.env.local` is in your `.gitignore`:

```bash
# From project root
cat .gitignore | grep env.local
```

You should see `.env.local` listed. ✅

## Part 3: Execute Database Migrations

Now you need to set up the database schema.

### Step 1: Open SQL Editor

1. In Supabase Dashboard, click **SQL Editor** in the left sidebar
2. Click **New query** button

### Step 2: Run Schema Migration

1. Open the file: `src/backend/supabase/migrations/001_initial_schema.sql`
2. Copy the entire contents (Ctrl+A, Ctrl+C)
3. Paste into the SQL Editor in Supabase
4. Click **Run** button (or press Ctrl+Enter)
5. Wait for execution (should take 5-10 seconds)
6. ✅ Success message should appear

**Verify Tables Created:**
```sql
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
ORDER BY table_name;
```

You should see 11 tables:
- carts
- cart_items
- favorites
- hanger_rentals
- items
- markets
- notifications
- payouts
- profiles
- qr_codes
- transactions

### Step 3: Run RLS Policies Migration

1. Click **New query** button again
2. Open the file: `src/backend/supabase/migrations/002_rls_policies.sql`
3. Copy the entire contents
4. Paste into SQL Editor
5. Click **Run** button
6. ✅ Success message should appear

**Verify RLS Enabled:**
```sql
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public'
ORDER BY tablename;
```

All tables should show `t` (true) for rowsecurity.

## Part 4: Configure Storage Buckets

Storage buckets are used to store item images uploaded by users.

### Step 1: Create First Bucket (Full-size Images)

1. In Supabase Dashboard, click **Storage** in the left sidebar
2. Click **New bucket** button
3. Fill in the form:
   - **Name:** `items-images-full`
   - **Public bucket:** ✅ Check this box
   - **File size limit:** 5242880 (5 MB)
   - **Allowed MIME types:** Leave empty or add: `image/jpeg, image/png, image/webp`
4. Click **Create bucket**

### Step 2: Create Second Bucket (Thumbnails)

1. Click **New bucket** button again
2. Fill in the form:
   - **Name:** `items-images-thumbnails`
   - **Public bucket:** ✅ Check this box
   - **File size limit:** 512000 (500 KB)
   - **Allowed MIME types:** Leave empty or add: `image/jpeg, image/png, image/webp`
3. Click **Create bucket**

### Step 3: Configure Storage Policies for items-images-full

1. Click on **items-images-full** bucket
2. Click **Policies** tab
3. Click **New policy** button

**Policy 1 - Public SELECT (Anyone can view):**
- Policy name: `Public can view images`
- Allowed operation: **SELECT** ✅
- Policy definition:
  ```sql
  true
  ```
- Target roles: **public** ✅
- Click **Review** → **Save policy**

**Policy 2 - Authenticated INSERT (Users can upload):**
- Click **New policy** button
- Policy name: `Authenticated users can upload`
- Allowed operation: **INSERT** ✅
- Policy definition:
  ```sql
  (bucket_id = 'items-images-full' AND auth.role() = 'authenticated')
  ```
- Target roles: **authenticated** ✅
- Click **Review** → **Save policy**

**Policy 3 - Users can UPDATE own files:**
- Click **New policy** button
- Policy name: `Users can update own images`
- Allowed operation: **UPDATE** ✅
- Policy definition:
  ```sql
  (bucket_id = 'items-images-full' AND auth.uid()::text = (storage.foldername(name))[1])
  ```
- Target roles: **authenticated** ✅
- Click **Review** → **Save policy**

**Policy 4 - Users can DELETE own files:**
- Click **New policy** button
- Policy name: `Users can delete own images`
- Allowed operation: **DELETE** ✅
- Policy definition:
  ```sql
  (bucket_id = 'items-images-full' AND auth.uid()::text = (storage.foldername(name))[1])
  ```
- Target roles: **authenticated** ✅
- Click **Review** → **Save policy**

### Step 4: Configure Storage Policies for items-images-thumbnails

Repeat all 4 policies above for the `items-images-thumbnails` bucket.

**Just change `items-images-full` to `items-images-thumbnails` in each policy definition.**

For example, Policy 2 becomes:
```sql
(bucket_id = 'items-images-thumbnails' AND auth.role() = 'authenticated')
```

## Part 5: Configure Authentication Providers

### Email Provider (Required)

1. Go to **Authentication** > **Providers**
2. Find **Email** in the list
3. Ensure it's **Enabled** (toggle should be green)
4. Optional: Configure email templates
   - Click **Email** to expand
   - You can customize confirmation, reset password, and magic link emails
   - For now, the defaults are fine

### Google OAuth Provider (Optional - Can do later)

1. Still in **Authentication** > **Providers**
2. Find **Google** in the list
3. For now, you can skip this - we'll configure it in Phase 1 when building auth flows

## Part 6: Test Your Setup

### Test 1: Check Environment Variables

```bash
cd src/frontend
cat .env.local
```

Verify all three Supabase variables are filled in (not placeholders).

### Test 2: Test Database Connection

In Supabase SQL Editor:
```sql
SELECT NOW();
```

Should return current timestamp. ✅

### Test 3: Test Storage Access

1. Go to **Storage** > `items-images-full`
2. Try uploading a test image (any .jpg or .png)
3. Should upload successfully
4. Delete the test image

### Test 4: Start Development Server

```bash
cd src/frontend
npm run dev
```

- Should start without errors
- Visit http://localhost:3000
- Should see "Welcome to Bloem" page

### Test 5: Check Supabase Client Connection

Create a test file to verify connection:

```bash
cd src/frontend
```

Create `test-connection.ts`:
```typescript
import { createClient } from '@/lib/supabase/client';

async function testConnection() {
  const supabase = createClient();
  
  const { data, error } = await supabase
    .from('profiles')
    .select('count')
    .limit(1);
  
  if (error) {
    console.error('Connection failed:', error);
  } else {
    console.log('✅ Connection successful!');
  }
}

testConnection();
```

Then test it (optional - you can skip this).

## Verification Checklist

- [ ] ✅ Supabase project accessible
- [ ] ✅ API credentials copied
- [ ] ✅ `.env.local` file created with real values
- [ ] ✅ 001_initial_schema.sql executed successfully
- [ ] ✅ 002_rls_policies.sql executed successfully
- [ ] ✅ 11 tables exist in database
- [ ] ✅ RLS enabled on all tables
- [ ] ✅ `items-images-full` bucket created
- [ ] ✅ `items-images-thumbnails` bucket created
- [ ] ✅ 4 storage policies on items-images-full
- [ ] ✅ 4 storage policies on items-images-thumbnails
- [ ] ✅ Email authentication provider enabled
- [ ] ✅ `npm run dev` starts without errors
- [ ] ✅ Can view app at http://localhost:3000

## Troubleshooting

### "Cannot find module" errors
- Run `npm install` in src/frontend directory
- Ensure .env.local is in src/frontend, not project root

### Database connection errors
- Verify credentials in .env.local are correct
- Check project is not paused in Supabase Dashboard
- Ensure no extra spaces in environment variables

### Storage upload fails
- Check bucket policies are configured correctly
- Verify bucket names match exactly (case-sensitive)
- Ensure file size is within limits

### Migration errors
- Check for any typos when copying SQL
- Ensure you copied the ENTIRE file
- Try running each CREATE TABLE statement separately if needed

## Next Steps

Once all checklist items are ✅, Phase 0.3 is **COMPLETE**!

You can now proceed to test the full setup or continue with remaining development tasks.

## Quick Reference

**Supabase Dashboard URLs:**
- Main: https://app.supabase.com
- Your project: https://app.supabase.com/project/YOUR-PROJECT-ID

**Key Files:**
- Environment template: `src/frontend/env.example`
- Your secrets: `src/frontend/.env.local` (never commit!)
- Schema migration: `src/backend/supabase/migrations/001_initial_schema.sql`
- RLS policies: `src/backend/supabase/migrations/002_rls_policies.sql`

**Need Help?**
- Supabase docs: https://supabase.com/docs
- Storage docs: https://supabase.com/docs/guides/storage
- Auth docs: https://supabase.com/docs/guides/auth

