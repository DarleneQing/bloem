# Bloem Frontend

This is the Next.js 14 frontend application for the Bloem circular fashion marketplace.

## Getting Started

First, install dependencies:

```bash
npm install
```

Then, run the development server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript (strict mode)
- **Styling**: Tailwind CSS
- **UI Components**: Shadcn UI + Radix UI
- **Database**: Supabase
- **Authentication**: Supabase Auth
- **Payments**: Adyen for Platforms
- **Email**: Resend + React Email

## Project Structure

```
src/frontend/
├── app/                  # Next.js App Router pages
├── components/           # React components
│   └── ui/              # Shadcn UI components
├── lib/                 # Utility functions and configurations
│   ├── supabase/        # Supabase client and utilities
│   └── utils.ts         # General utilities
├── features/            # Feature-based modules
│   └── [feature]/
│       ├── actions.ts   # Server actions
│       ├── queries.ts   # Data fetching
│       ├── validations.ts
│       └── components/
└── types/               # TypeScript type definitions
```

## Environment Variables

Copy `.env.example` to `.env.local` and fill in the required values:

```bash
cp .env.example .env.local
```

## Learn More

- [Next.js Documentation](https://nextjs.org/docs)
- [Supabase Documentation](https://supabase.com/docs)
- [Shadcn UI Documentation](https://ui.shadcn.com)

