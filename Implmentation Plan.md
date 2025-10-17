# Circular Fashion Marketplace - Complete MVP Implementation Plan

This plan outlines the complete implementation for building a circular fashion marketplace MVP with digital labeling solutions for pop-up flea markets. The plan uses a phased approach with detailed user stories and technical specifications, optimized for systematic development.

---

## Tech Stack

**Frontend:**
- Framework: Next.js 14 (App Router)
- Language: TypeScript (strict mode)
- UI Components: Shadcn UI + Radix UI
- Styling: Tailwind CSS
- Form Validation: Zod + react-hook-form
- State Management: Server Components (minimal client state)
- QR Scanner: @yudiel/react-qr-scanner
- Image Optimization: browser-image-compression

**Backend:**
- Platform: Next.js Server Actions with next-safe-action
- Database: Supabase (PostgreSQL)
- Authentication: Supabase Auth
- Storage: Supabase Storage
- Real-time: Supabase Realtime
- Email: Resend + React Email

**Payments:**
- Provider: Adyen for Platforms
- Features: Split payments, IBAN payouts, webhook handling

**Infrastructure:**
- Hosting: Vercel
- CDN: Supabase CDN
- Monitoring: Sentry (errors)

---

## User Model

**Single User Type with Seller Activation:**
- All registered users can buy immediately
- Selling requires IBAN activation (becomes "Active Seller")
- Roles: USER (default) and ADMIN
- No separate buyer/seller accounts

**Wardrobe for Everyone:**
- All users can upload items to wardrobe (display/share)
- Non-activated sellers: Items for display only (PUBLIC/PRIVATE)
- Activated sellers: Can move items to RACK, list on markets, link QR codes, sell

---

## Phase 0: Project Foundation

**Goal:** Set up the complete technical foundation before feature development.

### 0.1. Next.js Project Initialization
- [ ] Create Next.js 14 project with TypeScript
- [ ] Configure `tsconfig.json` with strict mode
- [ ] Set up project directory structure (see full structure in detailed plan)

### 0.2. Tailwind CSS & Shadcn UI Setup
- [ ] Initialize Shadcn UI
- [ ] Configure custom brand colors (purple theme)
- [ ] Add Gordita font configuration
- [ ] Install initial Shadcn components

### 0.3. Supabase Project Setup
- [ ] Create Supabase project
- [ ] Configure environment variables
- [ ] Create Supabase client utilities
- [ ] Configure Storage buckets (items-images-full, items-images-thumbnails)

### 0.4. Database Schema Design & Implementation
- [ ] Create complete ERD with all entities
- [ ] Write SQL migration for schema (see Phase 0.4 in detailed plan for full schema)
- [ ] Execute migration in Supabase
- [ ] Set up database indexes

### 0.5. Row Level Security (RLS) Policies
- [ ] Enable RLS on all tables
- [ ] Create comprehensive security policies (see Phase 0.5 for complete policies)

### 0.6. Development Tools Setup
- [ ] Configure ESLint and Prettier
- [ ] Set up Git workflow
- [ ] Create `.env.example`
- [ ] Install core dependencies

### 0.7. Additional Package Installation
- [ ] Install UI and utility packages (full list in detailed plan)

---

## Phase 1: Authentication & User Management

**Goal:** Implement complete authentication system with user profiles and seller activation.

### 1.1. Supabase Authentication Setup
- [ ] Configure Supabase Auth settings
- [ ] Enable Email + Password provider
- [ ] Enable Google OAuth provider:
    - [ ] Create OAuth credentials in Google Cloud Console
    - [ ] Configure Client ID and Client Secret in Supabase
    - [ ] Set up authorized redirect URIs
- [ ] Create auth middleware
- [ ] Set up redirect URLs for OAuth callbacks

### 1.2. Resend Email Integration
- [ ] Create Resend account and configure API key
- [ ] Create email templates (welcome, order confirmation, payout, market reminder)
- [ ] Create email utility functions

### 1.3. User Profile Entity & Operations
- [ ] Create Zod validation schemas
- [ ] Create type definitions
- [ ] Implement server actions:
    - [ ] `signUp(email, password, profileData)` - Create account + profile (email/password)
    - [ ] `signInWithEmail(email, password)` - Authenticate with email/password
    - [ ] `signInWithGoogle()` - Authenticate with Google OAuth
    - [ ] `handleOAuthCallback()` - Process OAuth callback and create/update profile
    - [ ] `signOut()` - End session
    - [ ] `updateProfile(data)` - Update basic info
    - [ ] `updateIBAN(ibanData)` - Activate seller (sets ibanVerifiedAt timestamp)
    - [ ] `resetPassword(email)` - Send reset link
- [ ] Implement query functions:
    - [ ] `getUserProfile()` - Get current user with computed `isActiveSeller`
    - [ ] `checkSellerStatus()` - Return activation boolean

### 1.4. Authentication UI Components
- [ ] Create auth layout
- [ ] Create sign-up page:
    - [ ] Email/password form (email, password, name, phone, address)
    - [ ] "Sign up with Google" button
    - [ ] Link to sign-in page
- [ ] Create sign-in page:
    - [ ] Email/password form
    - [ ] "Sign in with Google" button
    - [ ] Link to reset password
    - [ ] Link to sign-up page
- [ ] Create OAuth callback handler page
- [ ] Create reset-password page
- [ ] Create update-password page

### 1.5. Profile Management UI
- [ ] Create profile page with sections:
    - [ ] Personal Information (name, email, phone, address)
    - [ ] Seller Information:
        - [ ] If IBAN not set: "Start Selling" CTA with benefits
        - [ ] If IBAN set: Display verified badge, masked IBAN, bank details
    - [ ] Delete Account (danger zone)
- [ ] Create seller activation dialog (IBAN, bank name, account holder)
- [ ] Create seller badge component

### 1.6. Auth Helper Components
- [ ] Create protected-route wrapper
- [ ] Create seller-gate wrapper (show activation prompt if not activated)
- [ ] Create admin-gate wrapper

### 1.7. Role Management
- [ ] Create admin seeding script
- [ ] Create role check utilities

---

## Phase 2: Digital Wardrobe & Item Management

**Goal:** Enable ALL users to create their digital wardrobe with full CRUD operations. Non-activated users can display/share items. Activated sellers can prepare items for selling.

### 2.1. Item Validation Schemas
- [ ] Create comprehensive Zod schemas (itemUploadSchema, itemUpdateSchema, moveToRackSchema, privacyToggleSchema)
- [ ] Define validation rules:
    - [ ] Title: 3-200 characters
    - [ ] Description: 20-500 characters
    - [ ] Images: 1-5 files, max 5MB each
    - [ ] Selling price: €1-€1000 (when moving to RACK)

### 2.2. Image Upload Utilities
- [ ] Create image compression utility
- [ ] Create Supabase storage utilities
- [ ] Implement upload flow:
    - [ ] Compress to 1920px width, max 2MB
    - [ ] Generate thumbnail 400px width, max 100KB
    - [ ] Upload both to Supabase Storage

### 2.3. Item Operations (Server Actions)
- [ ] Create server actions (ALL users can access):
    - [ ] `uploadItem(formData)` - Create new item (all authenticated users)
    - [ ] `updateItem(itemId, data)` - Update details (owner only)
    - [ ] `deleteItem(itemId)` - Remove item (owner only, not if LISTED/SOLD)
    - [ ] `toggleItemPrivacy(itemId)` - Toggle PUBLIC/PRIVATE (all users)
- [ ] Create seller-only actions (require isActiveSeller):
    - [ ] `moveItemToRack(itemId, sellingPrice)` - Prepare for selling
    - [ ] `removeFromRack(itemId)` - Unpublish from selling

### 2.4. Item Query Functions
- [ ] Implement query functions:
    - [ ] `getMyItems(filters?)` - Get current user's items
    - [ ] `getItemById(itemId)` - Get single item details
    - [ ] `getPublicWardrobe(userId)` - Get user's public items
    - [ ] `getItemsInRack()` - Get items ready for selling

### 2.5. Wardrobe UI - Main Page
- [ ] Create wardrobe page with:
    - [ ] For non-activated sellers: Info banner + "Become a Seller" CTA
    - [ ] For activated sellers: Tabs (All/Display/For Sale/Sold) and stats
    - [ ] Filter bar (search, category, status, sort)
    - [ ] Items grid with status badges and action buttons
    - [ ] Empty state with onboarding

### 2.6. Item Upload UI
- [ ] Create upload page with:
    - [ ] Image upload (drag & drop, preview, compression indicator)
    - [ ] Item details form (title, brand, category, size, condition, etc.)
    - [ ] Privacy section (Public/Private radio)
    - [ ] For activated sellers only: "Ready to sell" checkbox + selling price input
    - [ ] Real-time validation feedback

### 2.7. Item Detail & Edit UI
- [ ] Create item detail page with:
    - [ ] Image gallery
    - [ ] Full item information
    - [ ] Action buttons based on status and seller activation
    - [ ] Edit mode or separate edit page

### 2.8. Item Edit UI
- [ ] Create edit page (same form as upload but pre-filled)

### 2.9. Public Wardrobe Profile
- [ ] Create public wardrobe page:
    - [ ] User header (avatar, name, seller badge, member since)
    - [ ] Items grid (only WARDROBE_PUBLIC and LISTED)
    - [ ] Filter by category
    - [ ] "This wardrobe is private" message if no public items

### 2.10. Item Components
- [ ] Create reusable components (item-card, status-badge, image-uploader, image-gallery, dialogs)

### 2.11. QR Code Pool Entity
- [ ] Implemented in Phase 0 database schema
- [ ] QR code management handled in Phase 3 (Admin)

**Item Status Flow:**
- Non-activated users: WARDROBE_PUBLIC ⟷ WARDROBE_PRIVATE
- Activated sellers: WARDROBE → RACK → LISTED → SOLD

---

## Phase 3: Admin Dashboard & Market Management

**Goal:** Provide admins with tools to manage markets, users, items, and QR codes. (Reordered to come before selling features since admins must create markets first)

### 3.1. Admin Route Protection
- [ ] Create admin layout with sidebar navigation
- [ ] Create admin middleware check
- [ ] Role check (redirect if not admin)

### 3.2. Admin Dashboard Overview
- [ ] Create admin dashboard with:
    - [ ] Statistics cards (total users, items, active markets, revenue, active sellers)
    - [ ] Recent activity feed
    - [ ] Quick actions (create market, view users, moderate items, generate QR codes)

### 3.3. Market Management - Data Operations
- [ ] Create server actions:
    - [ ] `createMarket(data)` - Create new market (status: DRAFT)
    - [ ] `updateMarket(marketId, data)` - Edit market details
    - [ ] `changeMarketStatus(marketId, status)` - DRAFT → ACTIVE → COMPLETED
    - [ ] `deleteMarket(marketId)` - Remove market (only if DRAFT, no vendors)
    - [ ] `getMarketAnalytics(marketId)` - Statistics
- [ ] Create query functions:
    - [ ] `getAllMarkets(filters?)` - Admin view
    - [ ] `getMarketDetails(marketId)` - Full info
    - [ ] `getMarketVendors(marketId)` - List sellers
    - [ ] `getMarketItems(marketId)` - All listed items
    - [ ] `checkMarketCapacity(marketId)` - Available spots

### 3.4. Market Management UI
- [ ] Create markets page with table (Name, Location, Dates, Status, Vendors, Actions)
- [ ] Create market creation page (Name, Location, Dates, Description, Max vendors, Hanger price)
- [ ] Create market edit page
- [ ] Create market analytics page (vendor list, items, sales, revenue breakdown)

### 3.5. User Management Operations
- [ ] Create server actions:
    - [ ] `getAllUsers(filters?)` - Paginated user list
    - [ ] `getUserDetails(userId)` - Full profile
    - [ ] `updateUserRole(userId, role)` - Promote to admin
    - [ ] `suspendUser(userId, reason)` - Deactivate account
    - [ ] `verifySellerManually(userId)` - Manual verification
- [ ] Create query functions for user stats and transactions

### 3.6. User Management UI
- [ ] Create users page with table (Name, Email, Role, Seller status, Items count, Sales count, Actions)
- [ ] Create user detail page (profile, stats, items, transactions, actions)

### 3.7. Item Moderation Operations
- [ ] Create server actions:
    - [ ] `searchAllItems(query)` - Full-text search
    - [ ] `flagItem(itemId, reason)` - Mark for review
    - [ ] `unflagItem(itemId)` - Remove flag
    - [ ] `removeItem(itemId, reason)` - Admin delete
    - [ ] `getItemHistory(itemId)` - Lifecycle history

### 3.8. Item Moderation UI
- [ ] Create items page with table (Image, Title, Owner, Category, Price, Status, Flagged, Actions)
- [ ] Create item detail page for moderation

### 3.9. QR Code Management Operations
- [ ] Create server actions:
    - [ ] `generateQRCodeBatch(count, prefix)` - Generate batch (Format: BLOEM-[PREFIX]-[00001])
    - [ ] `getQRCodeStats()` - Overall statistics
    - [ ] `getAllQRCodes(filters?)` - Paginated list
    - [ ] `getQRCodeHistory(code)` - Usage history
    - [ ] `exportQRCodesForPrinting(batchId)` - Generate printable PDF
    - [ ] `invalidateQRCode(code, reason)` - Mark as INVALID

### 3.10. QR Code Management UI
- [ ] Create QR codes page with:
    - [ ] Statistics dashboard (total, unused, linked, sold, invalid)
    - [ ] "Generate New Batch" button with dialog
    - [ ] Batches list with usage stats
    - [ ] QR codes table with filters
    - [ ] Export for printing functionality
- [ ] Create QR code detail page with history timeline

### 3.11. Admin Components
- [ ] Create reusable admin components (sidebar, stat-card, data-table, status-badge, admin-header)

---

## Phase 4: Marketplace & Selling Features

**Goal:** Enable activated sellers to rent hangers, list items on markets, and link QR codes.

### 4.1. Hanger Rental System - Data Operations
- [ ] Create Zod validation schemas
- [ ] Create server actions:
    - [ ] `rentHangers(marketId, hangerCount)` - Reserve hangers (requires isActiveSeller, checks market capacity)
    - [ ] `confirmHangerPayment(rentalId)` - Update after payment
    - [ ] `getMyHangerRentals(marketId?)` - Get user's rentals with usage stats

### 4.2. Item Listing Operations
- [ ] Create server actions:
    - [ ] `listItemOnMarket(itemId, marketId)` - List single item (verify hanger capacity)
    - [ ] `listMultipleItems(itemIds[], marketId)` - Bulk list
    - [ ] `unlistItem(itemId)` - Remove from market (before QR link)
    - [ ] `getMyActiveListings(marketId?)` - Get listed items with QR status

### 4.3. QR Code Linking Operations
- [ ] Create server actions:
    - [ ] `scanQRCode(qrCode)` - Validate and return QR info
    - [ ] `linkQRCodeToItem(qrCode, itemId)` - Link QR to item (requires ownership, item LISTED, QR UNUSED)
    - [ ] `unlinkQRCode(itemId)` - Unlink before sale
    - [ ] `getLinkedQRCode(itemId)` - Get QR for item
    - [ ] `validateQRAvailability(qrCode)` - Check if QR can be linked

### 4.4. Selling Query Functions
- [ ] Create query functions:
    - [ ] `getActiveMarkets()` - Markets available for registration
    - [ ] `getMarketDetails(marketId)` - Market info for sellers
    - [ ] `getItemsReadyForMarket()` - Items in RACK status
    - [ ] `getHangerUsage(marketId)` - Current usage stats
    - [ ] `getUnlinkedListings(marketId)` - Items needing QR codes

### 4.5. Selling Dashboard UI
- [ ] Create selling dashboard with:
    - [ ] Seller activation check (show prompt if not activated)
    - [ ] Quick stats (active listings, upcoming markets, hangers rented, RACK items)
    - [ ] Active markets section
    - [ ] Quick actions

### 4.6. Market Browser for Sellers
- [ ] Create markets page with:
    - [ ] Filter bar (search, date range, sort)
    - [ ] Market cards (name, location, date, capacity, hanger price, status badges)
    - [ ] Registration actions

### 4.7. Market Detail for Sellers
- [ ] Create market detail page with:
    - [ ] Market header and info
    - [ ] Vendor capacity info
    - [ ] Hanger rental form (if not registered)
    - [ ] Rental details card (if registered)
    - [ ] Listed items section
    - [ ] Actions (list items, link QR codes)

### 4.8. Item Listing Flow
- [ ] Create list items page with:
    - [ ] Hanger capacity indicator
    - [ ] Items available for listing (RACK status)
    - [ ] Grid with checkboxes
    - [ ] Validation (cannot exceed hanger capacity)
    - [ ] "List Selected Items" button

### 4.9. QR Code Linking Interface
- [ ] Create QR linking page with:
    - [ ] Instructions panel
    - [ ] Market selector
    - [ ] Items needing QR codes list
    - [ ] QR Scanner section (camera view + manual input)
    - [ ] Item selector after scan
    - [ ] Items with QR codes linked section
- [ ] Create QR scanner component
- [ ] Create QR display component

### 4.10. My Listings Management
- [ ] Create listings page with:
    - [ ] Filter by market and QR status
    - [ ] Listings table/grid with actions
    - [ ] Bulk actions
    - [ ] Stats summary

### 4.11. Hanger Rental Payment Flow
- [ ] Create rental payment page (placeholder for Phase 6 Adyen integration)

### 4.12. Selling Components & Utilities
- [ ] Create reusable selling components
- [ ] Create selling utility functions

### 4.13. Business Logic Validations
- [ ] Implement all server-side validations (cannot rent if market not ACTIVE, cannot list without rental, etc.)

---

## Phase 5: Buying Features & QR Scanning

**Goal:** Enable buyers to scan items, add to cart, and manage purchases.

### 5.1. Cart System - Data Operations
- [ ] Create Zod validation schemas
- [ ] Create server actions:
    - [ ] `getOrCreateCart()` - Get user's cart or create new one
    - [ ] `addToCart(itemId)` - Add item with 15-minute reservation
    - [ ] `removeFromCart(itemId)` - Remove item and release reservation
    - [ ] `clearCart()` - Empty entire cart
    - [ ] `cleanupExpiredReservations()` - Background job

### 5.2. QR Scanning for Buyers
- [ ] Create server actions:
    - [ ] `scanItemQR(qrCode)` - Decode and fetch item (validate status: UNUSED/INVALID/SOLD/LINKED)
    - [ ] `validateItemAvailability(itemId)` - Check before adding to cart

### 5.3. Buying Query Functions
- [ ] Create query functions:
    - [ ] `getCartItems()` - Get cart contents with expiration times
    - [ ] `getCartSummary()` - Quick cart stats
    - [ ] `getItemFromQR(qrCode)` - Public item lookup
    - [ ] `checkItemInCart(itemId)` - Check if item in any cart

### 5.4. Shopping Interface - QR Scanner
- [ ] Create shop page with:
    - [ ] Large QR scanner section (camera view, manual input option)
    - [ ] Scan feedback (success/error states)
    - [ ] Recent scans list
    - [ ] Cart indicator (floating)
- [ ] Create QR scanner component with camera integration

### 5.5. Item Detail Page (Public)
- [ ] Create public item detail page:
    - [ ] Image gallery
    - [ ] Item information (title, brand, price, description, etc.)
    - [ ] Seller information card
    - [ ] Market information
    - [ ] Availability status
    - [ ] "Add to Cart" button
    - [ ] Similar items section

### 5.6. Item Detail via QR
- [ ] Create QR redirect page (lookup and redirect based on QR status)

### 5.7. Cart Management UI
- [ ] Create cart page with:
    - [ ] Empty state or items list
    - [ ] Item cards with reservation timer (countdown from 15 minutes)
    - [ ] Cart summary (subtotal, platform fee 10%, total)
    - [ ] "Proceed to Checkout" button
    - [ ] Expiration warnings and auto-remove expired items

### 5.8. Add to Cart Flow
- [ ] Implement add to cart interaction with optimistic UI updates

### 5.9. Cart Drawer (Optional)
- [ ] Create cart drawer component (slide-in panel)

### 5.10. Concurrent Purchase Protection
- [ ] Implement 15-minute reservation system
- [ ] Handle race conditions with database constraints
- [ ] Automatic cleanup via cron or on-demand

### 5.11. Item Availability Indicator
- [ ] Create real-time availability component (Available/In a cart/Sold)

### 5.12. Shopping Components & Utilities
- [ ] Create reusable buying components
- [ ] Create buying utility functions

### 5.13. Reservation Cleanup Job
- [ ] Create background job for expired reservations (Supabase function or Vercel Cron)

---

## Phase 6: Payment System

**Goal:** Implement Adyen payment processing for purchases, hanger rentals, and seller payouts.

### 6.1. Adyen Integration Setup
- [ ] Create Adyen for Platforms account
- [ ] Configure environment variables (API key, merchant account, client key, HMAC key)
- [ ] Install Adyen dependencies (@adyen/api-library, @adyen/adyen-web)
- [ ] Create Adyen client utility

### 6.2. Purchase Payment Operations
- [ ] Create Zod schemas
- [ ] Create server actions:
    - [ ] `createCheckoutSession(cartItems[])` - Initialize Adyen session with split payment (10% platform fee)
    - [ ] `processPurchase(sessionId, cartId)` - Complete purchase (update items to SOLD, update QR codes, clear cart, send notifications)
    - [ ] `handlePaymentFailure(sessionId)` - Handle failed payment

### 6.3. Webhook Handling
- [ ] Create webhook endpoint `/api/webhooks/adyen/route.ts`
- [ ] Verify webhook signature (HMAC-SHA256)
- [ ] Handle notification types (AUTHORISATION, CAPTURE, REFUND, PAYOUT)
- [ ] Set up webhook URL in Adyen dashboard

### 6.4. Hanger Rental Payment
- [ ] Create rental payment actions:
    - [ ] `createRentalPaymentSession(rentalId)` - Initialize rental payment
    - [ ] `confirmRentalPayment(sessionId, rentalId)` - Complete rental payment

### 6.5. Seller Payout System
- [ ] Create payout operations:
    - [ ] `calculateSellerEarnings(userId)` - Calculate available balance
    - [ ] `verifySellerIBAN(iban)` - Validate with Adyen
    - [ ] `requestPayout(amount)` - Seller initiates payout (minimum €10)
    - [ ] `processPayout(payoutRequestId)` - Admin/automated payout via Adyen Payouts API
    - [ ] `getPayoutHistory(userId)` - Fetch payout history

### 6.6. Checkout UI
- [ ] Create checkout page with:
    - [ ] Order summary (items, subtotal, platform fee, total)
    - [ ] Adyen Drop-in integration
    - [ ] Terms and conditions
    - [ ] Payment processing states
- [ ] Create payment result page (success/failure)

### 6.7. Order Confirmation
- [ ] Create order confirmation page (order number, items, payment details, pickup info)

### 6.8. Seller Earnings Dashboard
- [ ] Create earnings page with:
    - [ ] Earnings summary (total earned, available balance, pending, paid out)
    - [ ] Request payout section
    - [ ] Recent sales table
    - [ ] Payout history table
    - [ ] Earnings chart (optional)
- [ ] Create payout request dialog

### 6.9. Transaction History
- [ ] Create transactions page (for buyers: purchases; for sellers: sales and payouts)

### 6.10. Admin Payment Management
- [ ] Add to admin dashboard:
    - [ ] Payment statistics
    - [ ] Pending payouts queue
    - [ ] Failed transactions list
    - [ ] Refund management (future)

### 6.11. Payment Utilities & Components
- [ ] Create payment utility functions
- [ ] Create reusable payment components

### 6.12. Email Notifications for Payments
- [ ] Create and trigger payment email templates (order confirmation, seller sale notification, payout requested, payout completed)

### 6.13. Payment Error Handling
- [ ] Implement comprehensive error handling for all payment scenarios

### 6.14. Payment Security
- [ ] Implement security measures (server-side only, webhook verification, idempotency, rate limiting, logging)

### 6.15. Test Payment Flows
- [ ] Set up and test with Adyen test cards

---

## Phase 7: Event Exploration & Discovery

**Goal:** Allow users to discover and explore upcoming markets and events.

### 7.1. Market Discovery Operations
- [ ] Create query functions:
    - [ ] `getUpcomingMarkets(filters?)` - Fetch future markets (filter by date, location; sort by earliest/nearest)
    - [ ] `getMarketDetails(marketId)` - Public market information
    - [ ] `getMarketVendors(marketId)` - List participating sellers
    - [ ] `getMarketItems(marketId, filters?)` - Browse items at market (with filters)
    - [ ] `favoriteMarket(marketId)` - Save market to favorites
    - [ ] `unfavoriteMarket(marketId)` - Remove from favorites
    - [ ] `getMyFavoriteMarkets()` - User's saved markets

### 7.2. Explore Markets Page
- [ ] Create explore page (public route) with:
    - [ ] Page hero section
    - [ ] Search and filter bar (location, date range)
    - [ ] Upcoming markets grid (cards with name, location, date, capacity, stats)
    - [ ] Featured markets section
    - [ ] Past markets section
    - [ ] CTA for sellers

### 7.3. Market Detail Page
- [ ] Create market detail page (public route) with:
    - [ ] Market header (name, location, date, status, favorite/share buttons)
    - [ ] Market information card (description, address, venue details)
    - [ ] Vendors section (grid of vendor cards)
    - [ ] Items preview section (browse and filter items)
    - [ ] Location section (map embed, directions)
    - [ ] Similar markets section

### 7.4. Market Items Browse
- [ ] Create dedicated items browse page with:
    - [ ] Advanced filtering (categories, price, sizes, conditions, sellers, colors, brands)
    - [ ] Sort options
    - [ ] View options (grid/list)
    - [ ] Active filters display
    - [ ] Pagination

### 7.5. Vendor Preview
- [ ] Create vendors page with vendor list and item previews

### 7.6. Market Search & Discovery
- [ ] Create search page (global search for markets, items, vendors)

### 7.7. Calendar View
- [ ] Create calendar page (monthly view with markets on dates)

### 7.8. Favorites & Notifications
- [ ] Create favorites system (database table, server actions)
- [ ] Create favorites page

### 7.9. Market Reminders
- [ ] Implement reminder system ("Add to Calendar" .ics file, email reminders, in-app notifications)

### 7.10. Location-Based Discovery
- [ ] Add geolocation features (request permission, calculate distance, sort by nearest)
- [ ] Create nearby markets page (map view, distance display)

### 7.11. Explore Components & Utilities
- [ ] Create reusable explore components
- [ ] Create explore utility functions

### 7.12. SEO Optimization
- [ ] Implement SEO for market pages (dynamic meta tags, Open Graph, Schema.org Event markup, sitemap)

---

## Phase 8: Real-time Notifications

**Goal:** Implement real-time notification system for important events using Supabase Realtime.

### 8.1. Notification System Setup
- [ ] Enable Supabase Realtime on notifications table
- [ ] Create notification types enum (ITEM_SOLD, MARKET_REMINDER, HANGER_RENTAL_CONFIRMED, PAYOUT_COMPLETED, etc.)

### 8.2. Notification Operations
- [ ] Create server actions:
    - [ ] `createNotification(userId, type, title, message, data?)` - Create notification
    - [ ] `markAsRead(notificationId)` - Mark single as read
    - [ ] `markAllAsRead()` - Mark all as read
    - [ ] `deleteNotification(notificationId)` - Remove notification
    - [ ] `clearAllNotifications()` - Clear all
- [ ] Create query functions:
    - [ ] `getMyNotifications(filters?)` - Fetch user's notifications
    - [ ] `getUnreadCount()` - Count unread
    - [ ] `getRecentNotifications(limit)` - Latest notifications

### 8.3. Notification Triggers
- [ ] Create notification trigger functions for all key events:
    - [ ] Item sold, Market reminder, Hanger rental confirmed, Payout completed, QR linked, Seller verified, Cart expiring soon
- [ ] Integrate triggers into existing actions

### 8.4. Real-time Notification Listener
- [ ] Create useNotifications hook with Supabase real-time subscription

### 8.5. Notification Bell Component
- [ ] Create bell icon with unread badge in header

### 8.6. Notifications Panel
- [ ] Create dropdown/popover from bell (recent 10, mark all as read, view all link)

### 8.7. Notifications Page
- [ ] Create full notifications page (filter tabs, list with actions, pagination)

### 8.8. Notification Toast Component
- [ ] Create toast for real-time notifications (auto-dismiss, action button)

### 8.9. Email Notifications
- [ ] Integrate with Resend email system (check preferences before sending)

### 8.10. Notification Cron Jobs
- [ ] Set up scheduled notification jobs (market reminders 24h before, cart expiration warnings)

### 8.11. Notification Components & Utilities
- [ ] Create reusable notification components and utility functions

### 8.12. Database Functions for Notifications
- [ ] Create cleanup function for old notifications (>30 days)

---

## Phase 9: Security & Performance Optimization

**Goal:** Review and enhance security, optimize performance, and prepare for production deployment.

### 9.1. Security Audit & Hardening

#### 9.1.1. Authentication & Authorization Review
- [ ] Audit all RLS policies (test with different user roles, verify no data leakage)
- [ ] Review server action security (verify auth checks, ownership checks, role checks)
- [ ] Implement rate limiting (protect sensitive endpoints with Vercel/Upstash Rate Limit)
- [ ] Add 2FA for seller accounts (optional, using Supabase Auth MFA)

#### 9.1.2. Payment Security Review
- [ ] Verify Adyen integration security (API keys in env only, webhook HMAC verification)
- [ ] PCI DSS compliance check (no card data stored, HTTPS enforced)
- [ ] Implement payment fraud detection (monitor suspicious patterns)

#### 9.1.3. Data Validation & Sanitization
- [ ] Server-side validation review (all inputs validated with Zod)
- [ ] XSS protection (sanitize user content with DOMPurify, CSP headers)
- [ ] SQL injection prevention (use Supabase client, parameterized queries)
- [ ] CSRF protection (verify origin header, SameSite cookie)

#### 9.1.4. File Upload Security
- [ ] Image upload validation (whitelist types, size limits, magic byte validation, strip EXIF)
- [ ] Supabase Storage security (bucket policies, ownership tracking, orphaned file cleanup)

### 9.2. Performance Optimization

#### 9.2.1. Database Optimization
- [ ] Index optimization (add composite indexes for common queries)
- [ ] Query optimization (use selective fields, pagination, caching, optimize N+1)
- [ ] Database maintenance (VACUUM, update statistics, archive old data)

#### 9.2.2. Image Optimization
- [ ] Implement image optimization pipeline (compression, WebP, responsive sizes, progressive loading)
- [ ] Image lazy loading (Intersection Observer, LQIP, skeleton loaders)
- [ ] CDN configuration (leverage Supabase CDN, cache headers)

#### 9.2.3. Frontend Performance
- [ ] React/Next.js optimizations (minimize 'use client', code splitting, React.memo)
- [ ] Bundle optimization (analyze size, remove unused deps, compress)
- [ ] Caching strategy (static assets, API responses with SWR/React Query)

#### 9.2.4. Web Vitals Optimization
- [ ] Core Web Vitals targets (LCP <2.5s, FID <100ms, CLS <0.1)
- [ ] Lighthouse audit (target score >90 for all categories)

#### 9.2.5. Network Optimization
- [ ] API optimization (batch requests, deduplicate, compress responses)
- [ ] Reduce waterfalls (preload critical resources, prefetch next page)

### 9.3. Error Handling & Monitoring

#### 9.3.1. Error Logging Setup
- [ ] Integrate Sentry for error monitoring (configure, error boundaries, unhandled rejections, alerts)
- [ ] Custom error logging (log to database for audit)

#### 9.3.2. User-Friendly Error Messages
- [ ] Implement error message system (generic + specific actionable messages)
- [ ] Error boundaries (global and feature-specific)

#### 9.3.3. Monitoring & Alerting
- [ ] Set up application monitoring (uptime, performance, database, API times, error rates)
- [ ] Business metrics dashboard (users, sellers, items, markets, transactions)

### 9.4. Testing

#### 9.4.1. Unit Testing
- [ ] Set up testing framework (Vitest, @testing-library/react)
- [ ] Write unit tests for critical functions (target >70% coverage for utilities)

#### 9.4.2. Integration Testing
- [ ] Test critical user flows (registration, item upload, QR scan, checkout, payout)

#### 9.4.3. Payment Testing
- [ ] Test payment scenarios (success, 3D Secure, decline, split payment, webhook, payout)

#### 9.4.4. Load Testing
- [ ] Simulate market day load (concurrent scans, cart adds, checkouts)

### 9.5. Production Readiness

#### 9.5.1. Environment Configuration
- [ ] Set up production environment (production Supabase, Adyen live mode, Resend, env variables)
- [ ] Security headers (configure in next.config.js)

#### 9.5.2. Database Migration
- [ ] Production database setup (run migrations, verify tables/indexes, enable RLS, seed initial data, backups)

#### 9.5.3. Deployment
- [ ] Deploy to Vercel (connect repo, configure build, set env vars, custom domain, auto deployments)
- [ ] DNS configuration (point domain, SSL, www redirect, email DNS)

#### 9.5.4. Post-Deployment Checklist
- [ ] Verify all functionality in production (complete flow testing)
- [ ] Performance verification (Lighthouse, load speeds, Core Web Vitals)
- [ ] Security verification (SSL, security headers, RLS, no exposed secrets, rate limiting, webhooks)

#### 9.5.5. Documentation
- [ ] Create documentation (README, DEPLOYMENT, API docs, Admin guide, User manual)

#### 9.5.6. Monitoring Setup
- [ ] Configure production monitoring (Vercel Analytics, Sentry, uptime monitoring, alerts)

### 9.6. Maintenance & Support
- [ ] Implement backup strategy (automated backups, test restore)
- [ ] Create admin monitoring page (system health indicators)
- [ ] Implement maintenance mode (feature flag, maintenance page)
- [ ] Establish update strategy (staging, preview deployments, rollback plan)

---

## MVP Priority & Next Steps

**For a true MVP, focus on these core phases first:**

1. **Phase 0:** Project foundation and database setup
2. **Phase 1:** User authentication and seller activation
3. **Phase 2:** Digital wardrobe (universal for all users)
4. **Phase 3:** Admin dashboard and market management
5. **Phase 4:** Selling features (hanger rental, item listing, QR linking)
6. **Phase 5:** Buying features (QR scanning, cart, reservations)
7. **Phase 6:** Payment system (Adyen integration)

**Consider launching after these phases and adding in subsequent releases:**
- Phase 7: Event exploration and discovery
- Phase 8: Real-time notifications
- Phase 9: Security hardening and performance optimization

**Post-MVP Enhancements (defer based on user feedback):**
- Advanced search and filtering
- Seller analytics dashboard
- Browse other users' wardrobes feature
- Complex market lifecycle management
- Multi-timezone support
- Refund/return system
- 2FA for all users
- Push notifications (PWA)
- Advanced rate limiting
- Detailed business analytics

---

## Key Business Rules & Workflows

**User & Seller Model:**
- Single user type: All users can buy immediately upon registration
- Selling activation: Users become "Active Sellers" by completing IBAN information
- No role switching: Users are simultaneously buyers and sellers based on activation
- Wardrobe universal: All users can upload items for display/sharing
- Roles: USER (default) and ADMIN only

**Item Status Lifecycle:**
- Non-activated users: `WARDROBE_PUBLIC` ⟷ `WARDROBE_PRIVATE`
- Activated sellers add: `WARDROBE → RACK → LISTED → SOLD`
- Items can only be listed on ONE market at a time
- SOLD items are permanent (historical record)

**Market & Vendor Capacity:**
- Markets have `maxVendors` capacity
- Admins create markets with status: DRAFT → ACTIVE → COMPLETED
- Vendors = sellers who have rented hangers for a market
- Market full when `current_vendors >= maxVendors`

**Hanger Rental System:**
- Sellers rent hangers per market event (not subscription)
- Hanger rental is per-market, not platform-wide
- Can only list items ≤ hangers rented
- Hanger rental requires payment before listing

**QR Code System:**
- Pre-printed QR codes with full URLs: `https://app.bloem.com/qr/BLOEM-[PREFIX]-[NUMBER]`
- QR status: UNUSED → LINKED → SOLD (or INVALID)
- Admin generates batches before events
- Sellers link UNUSED QR codes to their LISTED items on-site
- Buyers scan LINKED QR codes to view and purchase items
- QR codes are NOT reusable after sale (permanent history)
- Sellers CAN unlink and re-link QR codes BEFORE sale

**Cart & Reservation:**
- 15-minute reservation when item added to cart
- One item can only be in one cart at a time
- Auto-cleanup of expired reservations
- Reservation extends during checkout

**Payment & Fees:**
- Fixed 10% platform fee (hardcoded for MVP)
- Split payment via Adyen: 90% to seller, 10% to platform
- Minimum payout amount: €10
- Payouts to seller's IBAN via Adyen Payouts API
- Three transaction types: PURCHASE, RENTAL, PAYOUT

**Wardrobe Privacy:**
- Default: WARDROBE_PUBLIC (visible to all)
- Users can set items to WARDROBE_PRIVATE (only owner sees)
- Public wardrobes accessible via `/wardrobe/[userId]`
- LISTED items always visible (in market context)

---

## Implementation Notes

**Development Approach:**
- Use vertical slice methodology: each phase delivers working end-to-end functionality
- Test thoroughly at each phase before proceeding
- Follow workspace rules strictly (Shadcn UI, Server Components, next-safe-action)
- Mobile-first design throughout
- No guest checkout: authentication required

**Database Strategy:**
- Use Supabase client directly (not Prisma) for tighter integration
- RLS policies are the security foundation
- All tables have RLS enabled
- Composite indexes for performance

**State Management:**
- Maximize Server Components
- Minimal client state
- Use Supabase Realtime for live updates
- React Query/SWR for client-side caching when needed

**Code Organization:**
```
src/features/[feature]/
├── actions.ts       # next-safe-action server actions
├── queries.ts       # data fetching (server components)
├── validations.ts   # Zod schemas
└── components/      # feature-specific UI
```

**Security First:**
- All operations verify authentication
- Ownership checks on all CRUD operations
- Seller activation checks on selling operations
- Payment operations server-side only
- Webhook signature verification mandatory

**Authentication:**
- Supabase Auth supports both Email/Password and Google OAuth natively
- OAuth flow: User clicks "Sign in with Google" → redirects to Google → callback to app → profile creation/update
- For Google OAuth users, extract name and email from OAuth profile data
- All authentication methods share the same user profile structure
- Phone and address must be collected after OAuth sign-in if not provided by Google

---