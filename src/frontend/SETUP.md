# Bloem Frontend Setup Guide

## Prerequisites

- Node.js 18+ installed
- npm or yarn
- Supabase account with project created
- Git

## Step 1: Install Dependencies

```bash
cd src/frontend
npm install
```

## Step 2: Configure Environment Variables

1. Copy the example environment file:
```bash
cp .env.example .env.local
```

2. Fill in your Supabase credentials:
```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

To find these values:
- Go to your Supabase project dashboard
- Navigate to Settings > API
- Copy the Project URL and anon/public key

## Step 3: Set Up Database

1. Navigate to your Supabase project dashboard
2. Go to SQL Editor
3. Execute the migration files in order:
   - First: `src/backend/supabase/migrations/001_initial_schema.sql`
   - Second: `src/backend/supabase/migrations/002_rls_policies.sql`

See `src/backend/supabase/README.md` for detailed instructions.

## Step 4: Create Storage Buckets

1. In Supabase Dashboard, go to Storage
2. Create two buckets:
   - `items-images-full` (Public, 5MB limit)
   - `items-images-thumbnails` (Public, 500KB limit)
3. Configure storage policies as described in the backend README

## Step 5: Configure Authentication

1. In Supabase Dashboard, go to Authentication > Providers
2. Enable Email/Password provider
3. Enable Google OAuth:
   - Create OAuth credentials in Google Cloud Console
   - Add Client ID and Client Secret to Supabase
   - Configure authorized redirect URIs

## Step 6: Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Step 7: Create Admin User

1. Sign up through the application UI
2. In Supabase Dashboard, go to SQL Editor
3. Run:
```sql
UPDATE profiles 
SET role = 'ADMIN' 
WHERE email = 'your-email@example.com';
```

## Project Structure

```
src/frontend/
├── app/                    # Next.js App Router
│   ├── layout.tsx         # Root layout with fonts
│   ├── page.tsx           # Home page
│   └── globals.css        # Global styles
├── components/            # React components
│   └── ui/               # Shadcn UI components
├── lib/                  # Utilities and configurations
│   ├── supabase/         # Supabase client utilities
│   │   ├── client.ts    # Browser client
│   │   ├── server.ts    # Server client
│   │   └── middleware.ts # Auth middleware
│   └── utils.ts          # Helper functions
├── middleware.ts         # Next.js middleware
└── types/               # TypeScript types (to be created)
```

## Next Steps

After completing setup, you're ready to start implementing Phase 1:
- Authentication flows (sign-up, sign-in, OAuth)
- User profile management
- Seller activation with IBAN

## Troubleshooting

### Database connection issues
- Verify environment variables are correct
- Check Supabase project is not paused
- Ensure migrations ran successfully

### Build errors
- Clear `.next` folder: `rm -rf .next`
- Reinstall dependencies: `rm -rf node_modules && npm install`
- Check for TypeScript errors: `npm run build`

### Font not loading
- Ensure font files exist in `src/assets/fonts/`
- Check font paths in `app/layout.tsx`
- Clear browser cache

## Development Workflow

1. Create feature branch: `git checkout -b feature/your-feature`
2. Make changes
3. Test locally: `npm run dev`
4. Build: `npm run build`
5. Commit and push
6. Create pull request to main

## Resources

- [Next.js Documentation](https://nextjs.org/docs)
- [Supabase Documentation](https://supabase.com/docs)
- [Shadcn UI](https://ui.shadcn.com)
- [Tailwind CSS](https://tailwindcss.com/docs)

