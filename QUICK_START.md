# Quick Start Guide

## ✅ Phase 0 Complete!

Your Bloem marketplace foundation is ready. Follow these steps to get started.

## 1. Database Setup (5 minutes)

### Execute Migrations in Supabase:

1. Open [Supabase Dashboard](https://app.supabase.com)
2. Select your project
3. Go to **SQL Editor**
4. Run migration 1:
   - Copy `src/backend/supabase/migrations/001_initial_schema.sql`
   - Paste and click **Run**
5. Run migration 2:
   - Copy `src/backend/supabase/migrations/002_rls_policies.sql`
   - Paste and click **Run**

### Create Storage Buckets:

6. Go to **Storage** > **New bucket**
7. Create `items-images-full` (Public, 5MB limit)
8. Create `items-images-thumbnails` (Public, 500KB limit)
9. Add storage policies (see PHASE_0_COMPLETE.md)

## 2. Environment Setup (2 minutes)

```bash
cd src/frontend
cp .env.example .env.local
```

Edit `.env.local` with your Supabase credentials:
- Get them from **Settings > API** in Supabase Dashboard

## 3. Start Development (1 minute)

```bash
cd src/frontend
npm run dev
```

Visit http://localhost:3000

## 4. Create Admin User (after signup)

After signing up through the UI:

```sql
UPDATE profiles 
SET role = 'ADMIN' 
WHERE email = 'your-email@example.com';
```

## What You Have Now

✅ Complete Next.js 14 application structure
✅ Supabase database with 11 tables
✅ Row Level Security enabled
✅ Authentication middleware ready
✅ Tailwind CSS with your brand colors
✅ Custom Gordita fonts loaded
✅ All dependencies installed

## Next: Phase 1

Start building authentication:
- Sign-up/Sign-in pages
- Google OAuth integration
- User profiles
- Seller activation

## Need Help?

- **Detailed setup**: See `PHASE_0_COMPLETE.md`
- **Frontend docs**: See `src/frontend/SETUP.md`
- **Database docs**: See `src/backend/supabase/README.md`
- **Implementation plan**: See `Implementation Plan.md`

## File Structure

```
bloem/
├── src/
│   ├── frontend/          ← Your Next.js app
│   │   ├── app/          ← Pages and layouts
│   │   ├── components/   ← React components
│   │   ├── lib/          ← Utilities
│   │   └── .env.local    ← Your secrets (create this!)
│   └── backend/
│       └── supabase/
│           └── migrations/ ← Run these in Supabase!
├── PHASE_0_COMPLETE.md   ← Detailed completion report
└── Implementation Plan.md ← Full roadmap
```

## Commands Reference

```bash
# Development
npm run dev          # Start dev server

# Build
npm run build        # Production build
npm run start        # Start production server

# Lint
npm run lint         # Run ESLint
```

## Git Workflow

```bash
# Feature branch created
git status           # See changes
git add .           # Stage changes
git commit -m "Complete Phase 0 foundation"
git push origin task/phase-0-foundation_2025-10-17_1
```

---

**You're ready to build! 🚀**

