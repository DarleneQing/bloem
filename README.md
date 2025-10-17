# Bloem - Circular Fashion Marketplace

A web application that organizes pop-up flea markets with digital labeling solutions for second-hand clothing. The platform connects sellers with buyers at physical market events using QR code technology for seamless transactions.

## Overview

Bloem is a circular fashion marketplace that brings sustainability to clothing retail through pop-up markets and digital technology. Sellers can list their second-hand items, rent hangers at physical market locations, and use QR codes to enable buyers to scan and purchase items on the spot.

## Key Features

### For Buyers
- Browse upcoming and active markets
- Scan QR codes to view item details and purchase
- Digital wardrobe to upload and showcase personal items
- Seamless cart and checkout experience
- Real-time market updates

### For Sellers
- Digital wardrobe management with status tracking (wardrobe/rack/sold)
- Hanger rental system for physical markets
- QR code integration for items
- Item listing and market registration
- Direct payouts to registered IBAN
- Real-time notifications for sales

### For Admins
- Market creation and management
- User and item database access
- QR code generation and management
- Platform oversight and analytics

## Tech Stack

### Frontend
- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript (strict mode)
- **UI Components**: Shadcn UI + Radix UI
- **Styling**: Tailwind CSS
- **Form Validation**: Zod + react-hook-form
- **QR Scanner**: @yudiel/react-qr-scanner
- **Image Optimization**: browser-image-compression

### Backend
- **Platform**: Next.js Server Actions with next-safe-action
- **Database**: Supabase (PostgreSQL)
- **Authentication**: Supabase Auth (Email/Password + Google OAuth)
- **Storage**: Supabase Storage
- **Real-time**: Supabase Realtime
- **Email**: Resend + React Email

### Payments
- **Provider**: Adyen for Platforms
- **Features**: Split payments, IBAN payouts, webhook handling

### Infrastructure
- **Hosting**: Vercel
- **CDN**: Supabase CDN
- **Monitoring**: Sentry (error tracking)

## User Roles

### Regular User (Buyer)
- Browse markets and items
- Scan QR codes to view and purchase
- Upload items to personal wardrobe for display/sharing
- Activate as seller by providing IBAN information

### Active Seller (Activated User)
- All Regular User capabilities
- Prepare items for selling (move to "rack")
- Rent hangers at markets
- List items on markets
- Link QR codes to items
- Receive payouts to IBAN

### Admin
- Full platform management
- Create and manage markets
- Manage users and items
- Generate and manage QR codes
- Process payouts

## Project Structure

```
bloem/
├── src/
│   ├── assets/           # Static assets (fonts, images)
│   ├── backend/          # Backend services and configurations
│   └── frontend/         # Next.js application
├── old version/          # Previous Flutter implementation (archived)
├── AGENTS.md            # AI agent instructions
├── Implementation Plan.md
├── Requirements - User Stories.md
└── Roles.md
```

## Getting Started

### Prerequisites
- Node.js 18+ and npm/yarn
- Supabase account
- Vercel account (for deployment)
- Adyen account (for payments)

### Installation

1. Clone the repository:
```bash
git clone https://github.com/DarleneQing/bloem.git
cd bloem
```

2. Install dependencies:
```bash
cd src/frontend
npm install
```

3. Set up environment variables:
```bash
cp .env.example .env.local
```

Fill in the required environment variables:
- Supabase credentials
- Adyen API keys
- Resend API key
- Other service credentials

4. Run the development server:
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Development Phases

The project is being developed in systematic phases:

### Phase 0: Project Foundation ✅ COMPLETED
- ✅ Next.js 14 setup with TypeScript (strict mode)
- ✅ Tailwind CSS & Shadcn UI configuration with purple brand theme
- ✅ Supabase client utilities (browser, server, middleware)
- ✅ Complete database schema (11 tables, 11 enums, 40+ indexes)
- ✅ Row Level Security policies (50+ policies)
- ✅ Development tools (ESLint, Prettier, .env.example)
- ✅ All core dependencies installed

**See PHASE_0_COMPLETE.md for details and next steps**

### Phase 1: Authentication & User Management (Next)
- Email/Password authentication
- Google OAuth integration
- User profile management
- Seller activation with IBAN

### Phase 2: Digital Wardrobe
- Item upload with image compression
- Item metadata management
- Status tracking (wardrobe/rack/sold)
- Privacy settings

### Phase 3: Market Management
- Market creation (Admin)
- Market browsing
- Market registration for sellers
- Hanger rental system

### Phase 4: QR Code & Shopping
- QR code generation
- QR scanning functionality
- Item-QR linking
- Cart and checkout

### Phase 5: Payments & Payouts
- Adyen integration
- Split payment processing
- Seller payouts
- Transaction history

### Phase 6: Real-time & Notifications
- Live market updates
- Sale notifications
- Inventory sync

### Phase 7: Polish & Launch
- Performance optimization
- SEO implementation
- Testing and bug fixes
- Production deployment

## Documentation

- [Implementation Plan](./Implmentation%20Plan.md) - Detailed technical implementation guide
- [Requirements & User Stories](./Requirements%20-%20User%20Stories.md) - Complete user stories and acceptance criteria
- [Roles](./Roles.md) - User roles and permissions overview

## Design Assets

The project uses custom brand fonts and imagery:
- **Font**: Gordita (Black, Bold, Light, Medium, Regular)
- **Secondary Font**: Lexend Deca
- **Brand Colors**: Purple theme
- **Logo**: Available in multiple formats (transparent, white, black-white)

## Contributing

This is currently a private project under active development. Contribution guidelines will be added when the project moves to open development.

## License

Proprietary - All rights reserved

## Contact

For inquiries about the project, please contact the repository owner.
