# Circular Fashion Marketplace - User Stories & Requirements

## Project Overview

A circular fashion marketplace web application that organizes pop-up flea markets with digital labeling solutions for second-hand clothing. The platform connects sellers with buyers at physical market events using QR code technology for seamless transactions.

---

## User Roles

### 1. Regular User (Buyer)
- Can browse markets and items
- Can scan QR codes to view and purchase items
- Can upload items to personal wardrobe for display/sharing
- Can activate as seller by providing IBAN information

### 2. Active Seller (Activated User)
- All Regular User capabilities
- Can prepare items for selling (move to "rack")
- Can rent hangers at markets
- Can list items on markets
- Can link QR codes to items
- Can receive payouts to IBAN

### 3. Admin
- Full platform management capabilities
- Can create and manage markets
- Can manage users and items
- Can generate and manage QR codes
- Can process payouts

---

## Epic 1: User Authentication & Profile Management

### Story 1.1: User Registration
**As a** new visitor  
**I want to** create an account with email and password or Google  
**So that** I can access the platform and start shopping

**Acceptance Criteria:**
- User can register with email, password, first name, last name, phone, and address
- User can alternatively register with "Sign up with Google" button
- For email/password: Email validation is performed, password must meet security requirements (minimum 8 characters)
- For Google OAuth: User redirected to Google sign-in, after authorization redirected back to app with profile data
- For Google users: Name and email pre-filled from Google profile, phone and address collected in profile completion step
- Confirmation email is sent upon successful registration
- User is automatically logged in after registration
- User account is created with USER role by default

### Story 1.2: User Login
**As a** registered user  
**I want to** log in with my email and password or Google  
**So that** I can access my account and features

**Acceptance Criteria:**
- User can log in with valid email and password
- User can alternatively click "Sign in with Google" button
- For Google OAuth: User redirected to Google, after authorization redirected back to app
- "Remember me" option available (for email/password login)
- Error message shown for invalid credentials
- User is redirected to appropriate dashboard after login
- Session persists across browser refreshes
- OAuth session managed by Supabase Auth

### Story 1.2.1: Google OAuth Authentication
**As a** new or existing user  
**I want to** authenticate with my Google account  
**So that** I can quickly access the platform without creating a password

**Acceptance Criteria:**
- "Sign up with Google" button visible on registration page
- "Sign in with Google" button visible on login page
- Clicking button redirects to Google OAuth consent screen
- User selects Google account and grants permissions
- After authorization, user redirected back to app
- For new users: Account created automatically with email and name from Google, profile marked as incomplete if phone/address missing, user prompted to complete profile
- For existing users: User logged in immediately, session established
- OAuth callback handled securely with state parameter validation
- If OAuth fails: User shown error message, option to retry or use email/password
- Google profile picture optionally stored for user avatar
- Email from Google account is verified automatically (no confirmation email needed)

### Story 1.3: Password Reset
**As a** user who forgot their password  
**I want to** reset my password via email  
**So that** I can regain access to my account

**Acceptance Criteria:**
- User can request password reset with email address
- Only available for email/password accounts (not Google OAuth)
- Google OAuth users shown message: "You signed up with Google. Please use Google to sign in."
- Password reset email is sent with secure link
- Reset link expires after 24 hours
- User can set new password via reset link
- User is notified of successful password change

### Story 1.4: Profile Management
**As a** logged-in user  
**I want to** view and edit my profile information  
**So that** I can keep my details up to date

**Acceptance Criteria:**
- User can view personal information (name, email, phone, address)
- User can edit name, phone, and address
- Email is displayed but not editable (read-only)
- For Google OAuth users on first login: Prompted to complete profile if phone/address missing
- Profile completion can be skipped initially but prompted again before selling/buying
- Authentication provider displayed (Email/Password or Google)
- Changes are saved with confirmation message
- Validation errors are displayed clearly

### Story 1.4.1: Sign Out
**As a** logged-in user  
**I want to** sign out of my account  
**So that** I can securely end my session

**Acceptance Criteria:**
- Sign out button available in profile/account settings
- Clicking sign out clears user session
- User is redirected to landing page after sign out
- User cannot access protected routes after signing out
- Session cookies are cleared
- User must sign in again to access authenticated features
- No confirmation dialog required (immediate sign out)

### Story 1.5: Seller Activation
**As a** registered user  
**I want to** provide my IBAN information to become a seller  
**So that** I can sell items at markets and receive payments

**Acceptance Criteria:**
- User sees "Start Selling" section in profile if IBAN not set
- User can enter IBAN, bank name, and account holder name
- IBAN format is validated (correct format check)
- All three fields are required to activate
- Upon saving, user status changes to "Active Seller"
- "Verified Seller" badge is displayed after activation
- User can edit IBAN information after activation
- IBAN is displayed in masked format (DE89****7890) for security

---

## Epic 2: Digital Wardrobe (Universal Feature)

### Story 2.1: Upload Item to Wardrobe
**As a** logged-in user (buyer or seller)  
**I want to** upload items to my digital wardrobe  
**So that** I can catalog my clothes and share my style

**Acceptance Criteria:**
- User can upload 1-5 images per item (required)
- Images can be reordered (first image is cover)
- Images are compressed automatically before upload (1920px full + 400px thumbnail)
- User can enter: title (required), brand, category (required), size (required), condition (required), color, material, description (20-500 chars, required)
- User can optionally enter original purchase price
- Verified sellers see additional option: "Ready to Sell" section with checkbox
- If "Ready to Sell" is checked, selling price input appears (€1-€1000, required)
- Item is saved with WARDROBE status by default
- If "Ready to Sell" checked by verified seller, item moves directly to RACK status with selling price
- Privacy managed at wardrobe level, not per item (future implementation)
- Compression progress indicator shown during upload
- Success message displayed after upload
- User is redirected to wardrobe after successful upload

### Story 2.2: View My Wardrobe
**As a** logged-in user  
**I want to** view all my uploaded items  
**So that** I can manage my digital wardrobe

**Acceptance Criteria:**
- User sees grid view of all their items
- Each item card shows: image, title, brand, size, status badge (color-coded)
- Non-activated sellers see info banner: "Activate Your Seller Account" with link to profile
- All users see tabs: All, Display (WARDROBE status), For Sale (RACK status), Sold (SOLD status)
- Tab counts show number of items in each status
- Upload Item button prominently displayed
- Status badges: WARDROBE (green), RACK (blue), SOLD (amber)
- Empty state shown for new users with onboarding message and CTA
- Note: Search, filter, and sort features deferred to future phase

### Story 2.3: Toggle Item Privacy [DEFERRED]
**As a** user with wardrobe items  
**I want to** control visibility of my wardrobe  
**So that** I can manage who can see my items

**Acceptance Criteria (Future Implementation):**
- Privacy managed at wardrobe level, not per individual item
- Wardrobe-wide public/private toggle in profile settings
- Public wardrobes show all WARDROBE status items
- Private wardrobes hidden from public view
- Items in RACK status remain visible when listed on markets
- Note: Per-item privacy removed in favor of simpler wardrobe-level control

### Story 2.4: View Public Wardrobe
**As a** visitor or logged-in user  
**I want to** view another user's public wardrobe  
**So that** I can see their style and discover items

**Acceptance Criteria:**
- Public wardrobe accessible via URL: /wardrobe/user/[userId]
- Page shows user's name, "Verified Seller" badge (if applicable), member since date
- Shows items with WARDROBE status
- Items displayed in grid with images, titles, brands
- User can filter by category
- Empty state if user has no items
- Own profile indicator shown if viewing own wardrobe
- Clicking item navigates to item detail page
- Note: Full privacy controls to be implemented in future phase

### Story 2.5: Edit Wardrobe Item
**As a** item owner  
**I want to** edit my item details  
**So that** I can correct information or update descriptions

**Acceptance Criteria:**
- User can access edit functionality from item detail page
- All item fields editable except status and images
- Images cannot be changed after upload (implementation constraint)
- Cannot edit items with SOLD status
- Changes are validated before saving
- Success message displayed after saving
- User is redirected back to item detail or wardrobe
- Note: Full edit page placeholder created, detailed implementation deferred

### Story 2.6: Delete Wardrobe Item
**As a** item owner  
**I want to** delete items from my wardrobe  
**So that** I can remove items I no longer own

**Acceptance Criteria:**
- Delete button available on items with status: WARDROBE or RACK
- Delete button is disabled/hidden for SOLD items
- Confirmation dialog shown before deletion
- Upon confirmation, item deleted from database
- Image files remain in storage (cleanup deferred to future implementation)
- Success message displayed
- Item removed from wardrobe view
- Cannot delete items with SOLD status (historical record)

### Story 2.7: Move Item to Rack (Prepare for Selling)
**As an** active seller  
**I want to** move items from my wardrobe to my "rack"  
**So that** I can prepare them for selling at markets

**Acceptance Criteria:**
- "Move to Rack" button visible on WARDROBE status items only for verified sellers
- Non-verified users do not see this option
- Clicking button opens dialog to enter selling price (€1-€1000, required)
- Price validation: minimum €1, maximum €1000
- Upon confirmation, item status changes from WARDROBE to RACK
- Selling price is saved with item
- Item now appears in "For Sale" tab in wardrobe (RACK status)
- Status badge changes to blue "Ready to Sell"
- Item is available for listing on markets (Phase 4)

### Story 2.8: Remove Item from Rack
**As an** active seller  
**I want to** remove items from my rack  
**So that** I can move them back to display-only wardrobe

**Acceptance Criteria:**
- "Remove from Rack" button available on RACK status items
- Button not available if item is listed on a market (Phase 4 implementation)
- Clicking button shows confirmation dialog
- Upon confirmation, item status changes from RACK back to WARDROBE
- Selling price is cleared
- Item moves from "For Sale" tab to "Display" tab
- Status badge changes to green "In Wardrobe"
- Success message displayed

---

## Epic 3: Admin - Market Management

### Story 3.1: Create Market
**As an** admin  
**I want to** create a new market event  
**So that** sellers can register and list items

**Acceptance Criteria:**
- Admin can access market creation page
- Admin enters: name (required), location (required), start date & time (required), end date & time (required), description, max vendors (required, default 50), hanger price per unit (required)
- End date must be after start date
- Market is created with status: DRAFT
- Success message displayed
- Admin can "Save as Draft" or "Publish" (set to ACTIVE)
- Admin is redirected to market management page

### Story 3.2: Edit Market
**As an** admin  
**I want to** edit market details  
**So that** I can update information or fix errors

**Acceptance Criteria:**
- Admin can access market edit page for any market
- All market fields are editable
- Cannot edit if market status is COMPLETED
- Changes are validated before saving
- Success message displayed after update
- Vendors are notified if market dates change significantly

### Story 3.3: Change Market Status
**As an** admin  
**I want to** change market status between DRAFT, ACTIVE, and COMPLETED  
**So that** I can control market lifecycle

**Acceptance Criteria:**
- Admin can change status from DRAFT to ACTIVE (publish market)
- Admin can change status from ACTIVE to COMPLETED (archive market)
- Cannot change from COMPLETED back to ACTIVE
- Status change confirmation dialog shown
- Status change is logged
- Vendors are notified of status changes

### Story 3.4: View Market Analytics
**As an** admin  
**I want to** view detailed analytics for a market  
**So that** I can understand market performance

**Acceptance Criteria:**
- Admin can access analytics page for any market
- Analytics show: total vendors, total items listed, total sales, revenue generated, platform fees collected, hanger rentals
- Vendor list with individual earnings displayed
- Items list with sale status displayed
- Sales timeline chart (optional)
- Export data to CSV button available

### Story 3.5: Delete Market
**As an** admin  
**I want to** delete a market  
**So that** I can remove cancelled or test markets

**Acceptance Criteria:**
- Delete option only available for DRAFT markets with no registered vendors
- Confirmation dialog with warning shown
- Upon confirmation, market is permanently deleted
- Success message displayed
- Cannot delete markets with vendors or completed status

---

## Epic 4: Admin - User Management

### Story 4.1: View All Users
**As an** admin  
**I want to** view a list of all users  
**So that** I can manage user accounts

**Acceptance Criteria:**
- Admin can access users management page
- Users displayed in table: Name, Email, Role, Seller status, Items count, Sales count, Member since, Actions
- Admin can filter by: Role (All, User, Admin), Seller status (All, Active sellers, Non-sellers)
- Admin can search by name or email
- Pagination available for large lists
- Clicking user row navigates to user detail page

### Story 4.2: View User Details
**As an** admin  
**I want to** view detailed information about a user  
**So that** I can understand their activity and assist with issues

**Acceptance Criteria:**
- Admin can access user detail page
- Page shows: Full profile information, seller information (including IBAN if set), statistics (items uploaded, items sold, total earnings, active listings)
- User's items list displayed
- Transaction history displayed
- Actions available: Change role, Verify seller manually, Suspend/Unsuspend account

### Story 4.3: Change User Role
**As an** admin  
**I want to** change a user's role  
**So that** I can promote users to admin or demote admins

**Acceptance Criteria:**
- Admin can change role between USER and ADMIN
- Confirmation dialog shown before role change
- Role change is immediate
- User is notified of role change via email
- Change is logged for audit trail

### Story 4.4: Suspend User Account
**As an** admin  
**I want to** suspend a user account  
**So that** I can prevent misuse or policy violations

**Acceptance Criteria:**
- Admin can suspend active accounts
- Reason for suspension is required
- Confirmation dialog shown
- Suspended user cannot log in
- User's active listings are hidden
- User is notified of suspension via email
- Admin can unsuspend accounts later

---

## Epic 5: Admin - QR Code Management

### Story 5.1: Generate QR Code Batch
**As an** admin  
**I want to** generate batches of QR codes  
**So that** they can be printed and used at markets

**Acceptance Criteria:**
- Admin can access QR code generation page
- Admin enters: prefix (e.g., "MARKET01"), count (1-1000)
- System generates QR codes with format: BLOEM-[PREFIX]-[00001 to 99999]
- Each QR code has full URL: https://app.bloem.com/qr/BLOEM-[PREFIX]-[NUMBER]
- All codes created with status: UNUSED
- Batch ID assigned for tracking
- Success message shows batch details
- Admin can immediately export for printing

### Story 5.2: View QR Code Statistics
**As an** admin  
**I want to** view overall QR code statistics  
**So that** I can track QR code usage

**Acceptance Criteria:**
- Admin dashboard shows QR statistics
- Statistics include: Total QR codes, Unused count, Linked count, Sold count, Invalid count
- Statistics displayed in cards with percentages
- Visual chart showing distribution (optional)

### Story 5.3: Export QR Codes for Printing
**As an** admin  
**I want to** export QR codes as printable PDF  
**So that** they can be printed as labels

**Acceptance Criteria:**
- Admin can export any batch for printing
- System generates PDF with QR codes in grid layout (e.g., 4x6 labels)
- Each QR code includes the code text below image
- PDF is optimized for label printing
- Download starts immediately
- PDF filename includes batch ID and date

### Story 5.4: View QR Code History
**As an** admin  
**I want to** view the usage history of a QR code  
**So that** I can track its lifecycle

**Acceptance Criteria:**
- Admin can access QR code detail page
- Page shows: QR code string, full URL, current status, creation date
- Timeline shows: Created, Linked to item (with item link), Sold (with transaction link), Status changes
- If invalid, reason for invalidation shown

### Story 5.5: Invalidate QR Code
**As an** admin  
**I want to** mark a QR code as invalid  
**So that** damaged or lost codes cannot be used

**Acceptance Criteria:**
- Admin can invalidate any QR code
- Reason for invalidation is required
- Confirmation dialog shown
- QR code status changes to INVALID
- Code cannot be linked or used
- Change is logged in history

---

## Epic 6: Selling - Hanger Rental & Item Listing

### Story 6.1: Browse Available Markets
**As an** active seller  
**I want to** browse markets available for vendor registration  
**So that** I can find events to sell at

**Acceptance Criteria:**
- Seller can access markets browse page
- Only ACTIVE status markets shown
- Markets with future or current dates displayed
- Each market card shows: Name, location, date & time, vendor capacity (X/Y spots taken), hanger price
- Status badges shown: "Registered" (if seller already registered), "Almost Full" (>80% capacity), "Full" (at capacity)
- Seller can filter by date range and location
- Seller can search by market name
- Markets sorted by start date (earliest first)

### Story 6.2: View Market Details (Seller Perspective)
**As an** active seller  
**I want to** view detailed information about a market  
**So that** I can decide whether to register

**Acceptance Criteria:**
- Seller can access market detail page
- Page shows: Full market information, vendor capacity status, hanger price per unit
- If not registered: Hanger rental form displayed with count input and cost calculator
- If registered: Rental details shown (hangers rented, cost paid, payment status, usage: X/Y hangers used)
- Listed items for this market displayed
- Actions available based on registration status

### Story 6.3: Rent Hangers for Market
**As an** active seller  
**I want to** rent hangers for a market event  
**So that** I can reserve display space for my items

**Acceptance Criteria:**
- Only active sellers (IBAN verified) can rent hangers
- Seller enters number of hangers to rent
- Cost calculator shows: "X hangers × €Y = €Z total"
- Market capacity check: registration blocked if market is full
- Clicking "Rent Hangers" creates rental record with PENDING payment status
- Market's current_vendors count is incremented
- Seller is redirected to payment page
- After payment confirmation, rental status changes to COMPLETED
- Confirmation email sent to seller

### Story 6.4: List Items on Market
**As an** active seller with hanger rental  
**I want to** list my rack items on a market  
**So that** buyers can find and purchase them

**Acceptance Criteria:**
- Seller can access item listing page for registered markets
- Hanger capacity indicator shows: "X available hangers (Y rented, Z used)"
- Only items with RACK status are available for listing
- Items already listed elsewhere are excluded
- Items displayed in grid with checkboxes
- Seller selects items to list
- Validation: Cannot select more items than available hangers
- Error shown if exceeding capacity
- "List Selected Items" button creates market listings
- Items status remains RACK (not yet LISTED)
- Success message: "X items listed successfully"
- Next step prompt: "Link QR codes to your items"

### Story 6.5: Unlist Item from Market
**As an** active seller  
**I want to** unlist items from a market  
**So that** I can remove items I don't want to sell

**Acceptance Criteria:**
- Seller can unlist items that are on market but not yet QR linked
- "Unlist" button available on item cards in listings view
- Cannot unlist items that have QR codes linked
- Confirmation dialog shown
- Upon confirmation, market listing is deleted
- Item status changes back to RACK
- Hanger usage count decreases
- Success message displayed

---

## Epic 7: Selling - QR Code Linking

### Story 7.1: Scan QR Code for Linking
**As an** active seller at a market  
**I want to** scan a pre-printed QR code  
**So that** I can link it to my item

**Acceptance Criteria:**
- Seller can access QR linking page
- Camera view opens for QR scanning
- Camera permissions requested if not granted
- Seller points camera at QR code label
- System decodes QR code URL
- System validates QR code exists in database
- System checks QR status is UNUSED
- Success feedback shows: "QR code scanned: BLOEM-MARKET01-00123"
- Error feedback for: Invalid QR, Already linked QR, Sold QR
- Manual input option available if camera unavailable

### Story 7.2: Link QR Code to Item
**As an** active seller with scanned QR code  
**I want to** link the QR code to one of my listed items  
**So that** buyers can scan it to purchase

**Acceptance Criteria:**
- After successful QR scan, item selector appears
- Only seller's items that are listed but not QR-linked shown
- Seller can filter items by market
- Seller selects one item via radio button
- "Link to Selected Item" button performs linking
- System updates: QR code status to LINKED, linked_item_id set, linked_at timestamp set, Item linked_qr_code set, item status changes to LISTED
- Success message: "QR code linked successfully"
- QR code image displayed on item card
- Option to download/print QR code

### Story 7.3: View Linked QR Code
**As an** active seller  
**I want to** view the QR code linked to my item  
**So that** I can verify it's correct

**Acceptance Criteria:**
- Seller can view QR code from item detail or listings page
- "View QR" button opens modal/page
- Large QR code image displayed
- QR code string shown: BLOEM-MARKET01-00123
- Full URL shown: https://app.bloem.com/qr/BLOEM-MARKET01-00123
- Item information displayed
- Market information displayed
- Download QR image button available
- Print button available

### Story 7.4: Unlink QR Code from Item
**As an** active seller  
**I want to** unlink a QR code from my item before it's sold  
**So that** I can correct linking mistakes

**Acceptance Criteria:**
- "Unlink" button available on LISTED items that haven't been sold
- Cannot unlink after item is SOLD
- Confirmation dialog shown: "Are you sure? You'll need to re-link a QR code."
- Upon confirmation: QR code status changes to UNUSED, linked_item_id cleared, linked_at cleared, item linked_qr_code cleared, item status changes back to market listed (but not LISTED)
- Success message: "QR code unlinked. You can now link a different QR code."
- Item appears in "needs QR code" list again

### Story 7.5: View Items Needing QR Codes
**As an** active seller  
**I want to** see which of my listed items still need QR codes  
**So that** I can prioritize linking

**Acceptance Criteria:**
- QR linking page shows count: "X items need QR codes"
- Items listed on market but without linked QR codes displayed
- Each item card shows: Image, title, brand, selling price, market name
- "Link QR" button on each item
- Items grouped by market if seller has multiple markets
- Empty state shown when all items have QR codes: "All items have QR codes linked!"

---

## Epic 8: Buying - Shopping & Cart

### Story 8.1: Scan Item QR Code
**As a** buyer at a market  
**I want to** scan a QR code on an item  
**So that** I can view item details and purchase it

**Acceptance Criteria:**
- Buyer can access shop page with QR scanner
- Camera view prominently displayed
- Camera permissions requested
- Buyer points camera at item's QR code label
- System decodes QR code URL
- System looks up QR code in database
- Different responses based on QR status:
  - UNUSED: "Item not available yet" error
  - INVALID: "Invalid QR code" error
  - SOLD: "Item already sold" error
  - LINKED: Item details displayed
- Manual code entry option available

### Story 8.2: View Item from QR Code
**As a** buyer who scanned a QR code  
**I want to** view the item details  
**So that** I can decide if I want to buy it

**Acceptance Criteria:**
- After successful scan, item detail page opens
- Page shows: Image gallery (all item images), title, brand, size, condition, category, color, material, description, selling price (prominent)
- Seller information card: Seller name, "Verified Seller" badge, member since, "View Wardrobe" link
- Market information: Market name, location, available until (market end date)
- Availability status badge: "Available" (green), "In Someone's Cart" (yellow with timer), "Sold" (red)
- Large "Add to Cart" button (disabled if not available)
- "Scan Another Item" button
- Similar items section (other items from same seller)

### Story 8.3: Add Item to Cart
**As a** buyer viewing an available item  
**I want to** add it to my cart  
**So that** I can purchase it

**Acceptance Criteria:**
- "Add to Cart" button enabled only if item is available
- Clicking button checks: Item status is LISTED, Item not already SOLD, Item not in another user's cart (or reservation expired)
- If available: Cart item created with 15-minute reservation, expires_at timestamp set, Success toast shown: "Item added to cart", Cart badge count updates, Option to "View Cart" in toast shown
- If unavailable: Error message shown with reason ("Item in another cart", "Item no longer available")
- Optimistic UI update (add to cart immediately, rollback on error)
- Item status shows "In Someone's Cart" to other users
- Reservation timer starts (15 minutes)

### Story 8.4: View Shopping Cart
**As a** buyer with items in cart  
**I want to** view my cart  
**So that** I can review items before checkout

**Acceptance Criteria:**
- Cart page accessible from navigation or cart icon
- Cart badge shows item count
- If empty: Empty cart illustration, "Your cart is empty" message, "Start Shopping" button
- If has items: Items displayed in list with cards showing: Image thumbnail, title, brand, size, selling price, seller name, reservation timer (countdown)
- Timer shows remaining time: "Reserved for 14 min 32 sec"
- Timer turns yellow when < 10 minutes
- Timer turns red when < 5 minutes
- Warning toast shown at 5 minutes remaining
- Expired items auto-removed from cart
- "Remove" button (trash icon) on each item
- Cart summary sidebar/bottom: Subtotal (sum of item prices), platform fee (10%), total, item count
- "Proceed to Checkout" button (large, primary, disabled if cart empty)
- "Clear Cart" button with confirmation
- "Continue Shopping" button

### Story 8.5: Remove Item from Cart
**As a** buyer with items in cart  
**I want to** remove items  
**So that** I can adjust my selection

**Acceptance Criteria:**
- "Remove" button available on each cart item
- Clicking shows confirmation dialog (optional for quick removal)
- Upon confirmation: Cart item deleted, reservation released, item becomes available to others, cart count updates, cart summary recalculates, success message shown
- If removing last item, empty cart state shown

### Story 8.6: Cart Reservation Expiration
**As a** buyer with items in cart  
**I want to** be notified when my reservation is expiring  
**So that** I can complete checkout in time

**Acceptance Criteria:**
- Reservation timer displayed on each cart item
- Countdown updates every second
- Warning notification at 5 minutes remaining: "Your cart is expiring soon - X items will be released in 5 minutes"
- When timer reaches zero: Item automatically removed from cart, notification shown: "X item(s) removed from cart (reservation expired)", cart updates automatically
- User can attempt to re-add item if still available
- Background job cleans up expired reservations every 5 minutes

---

## Epic 9: Payment & Checkout

### Story 9.1: Proceed to Checkout
**As a** buyer with items in cart  
**I want to** proceed to checkout  
**So that** I can pay and complete my purchase

**Acceptance Criteria:**
- "Proceed to Checkout" button redirects to checkout page
- System validates: All cart items still reserved, All items still available, User is authenticated
- If validation fails: Error message shown, invalid items removed from cart, user returns to cart
- Checkout page displays: Order summary with all items, subtotal calculation, platform fee (10%) breakdown, total amount (prominent), Adyen payment component, terms and conditions checkbox, "Complete Purchase" button

### Story 9.2: Complete Payment
**As a** buyer at checkout  
**I want to** pay with my preferred payment method  
**So that** I can complete my purchase

**Acceptance Criteria:**
- Adyen Drop-in component displays available payment methods
- Supported methods: credit/debit cards, iDEAL (Netherlands), other EU payment methods
- 3D Secure authentication handled automatically by Adyen
- Buyer selects payment method and enters details
- Buyer accepts terms and conditions (required)
- Clicking "Complete Purchase" initiates payment
- Loading state shown during processing
- Payment split configured: 90% to sellers (proportionally), 10% to platform
- Upon success: User redirected to success page
- Upon failure: Error message shown, user can retry, cart items remain reserved

### Story 9.3: View Order Confirmation
**As a** buyer after successful payment  
**I want to** see my order confirmation  
**So that** I know my purchase was successful

**Acceptance Criteria:**
- Success page shows: "Payment Successful" message with icon, order confirmation number, order summary (items, prices, total), payment method used, pickup information (market name, location, dates), "View Order Details" button, "Continue Shopping" button
- Order confirmation email sent to buyer with same information
- Cart is cleared after successful purchase
- Items status updated to SOLD
- QR codes status updated to SOLD

### Story 9.4: View Order Details
**As a** buyer with completed orders  
**I want to** view my order details  
**So that** I can review past purchases

**Acceptance Criteria:**
- Buyer can access order detail page
- Page shows: Order number, order date, status badge (Completed), items purchased (list with images, titles, prices, seller names), payment details (subtotal, platform fee, total paid, payment method), pickup information (market details, instructions)
- "Download Receipt" button (PDF)
- "Contact Seller" buttons per item (future feature placeholder)
- "Need Help" link

### Story 9.5: View Transaction History
**As a** buyer  
**I want to** view my transaction history  
**So that** I can track my purchases

**Acceptance Criteria:**
- Buyer can access transactions page
- Purchases listed in table: Date, items (thumbnails), amount, market, status
- Filter by date range available
- Search by order number or item name
- Clicking transaction navigates to order detail page
- Pagination for long lists
- Export to CSV option available

---

## Epic 10: Seller Earnings & Payouts

### Story 10.1: View Earnings Dashboard
**As an** active seller  
**I want to** view my earnings dashboard  
**So that** I can track my sales and earnings

**Acceptance Criteria:**
- Seller can access earnings page from seller dashboard
- Summary cards show: Total earned (all time), available balance (can withdraw), pending transactions, total paid out
- Earnings displayed prominently
- Available balance highlighted as withdrawable
- Recent sales table: Columns - Item, sold date, price, platform fee (10%), your earnings (90%), status
- Filter by date range
- Export to CSV button
- Earnings chart showing sales over time (optional)

### Story 10.2: Request Payout
**As an** active seller with available balance  
**I want to** request a payout to my IBAN  
**So that** I can receive my earnings

**Acceptance Criteria:**
- "Request Payout" section shows available balance
- Amount input field with validation (max = available balance, min = €10)
- Minimum payout notice: "Minimum payout: €10"
- IBAN displayed in masked format for confirmation
- Estimated arrival date shown: "2-3 business days"
- "Request Payout" button creates payout request
- If balance < €10: Error message "Minimum payout amount is €10"
- If balance insufficient: Error message "Insufficient balance"
- Upon successful request: Transaction created with type PAYOUT, status PENDING, success message shown, confirmation email sent, request appears in payout history

### Story 10.3: View Payout History
**As an** active seller  
**I want to** view my payout history  
**So that** I can track payments received

**Acceptance Criteria:**
- Payout history table on earnings page
- Columns: Payout date, amount, status (Pending/Processing/Completed/Failed), IBAN (masked), reference number
- Status badges color-coded: Pending (yellow), processing (blue), completed (green), failed (red)
- Filter by status available
- Clicking payout shows detail view
- Detail view shows: Full transaction information, payment method (IBAN), processing timeline, status updates

### Story 10.4: Receive Payout Notification
**As an** active seller  
**I want to** be notified when my payout is completed  
**So that** I know funds have been transferred

**Acceptance Criteria:**
- When admin/system processes payout, webhook updates transaction status to COMPLETED
- In-app notification sent: "Payout completed - €X has been transferred to your account"
- Email notification sent: "Payout Completed" with amount, IBAN, transaction reference
- Notification includes estimated arrival date in bank account
- Transaction status updates in payout history
- Available balance decreases by payout amount

### Story 10.5: Seller Sale Notification
**As an** active seller  
**I want to** be notified when my item is sold  
**So that** I know about the sale immediately

**Acceptance Criteria:**
- When item is sold (purchase completed), seller receives notifications
- In-app notification: "Your item was sold! [Item Name] was purchased by [Buyer First Name] for €X"
- Email notification: "Item Sold" with item details, sale price, your earnings (minus 10% fee), buyer pickup info
- Notification links to transaction details
- If multiple items sold in one transaction, separate notifications per item
- Notification includes market information for pickup coordination

---

## Epic 11: Event Exploration & Discovery

### Story 11.1: Browse Upcoming Markets
**As a** visitor or user  
**I want to** browse upcoming markets  
**So that** I can find events to attend

**Acceptance Criteria:**
- Explore page accessible without login (public route)
- Page hero section with title and tagline
- Upcoming markets displayed in grid with cards
- Each card shows: Market name, location with pin icon, date & time, vendor capacity (X/Y vendors), status badges ("Almost Full", "Full")
- Filter bar: search by name/location, location dropdown, date range picker, "Apply Filters" button
- Sort by: Earliest first (default), nearest location (with geolocation)
- "View Details" button on each card
- Pagination or infinite scroll
- Featured markets section at top (optional)
- Past markets section at bottom
- Empty state if no upcoming markets

### Story 11.2: View Market Details (Public)
**As a** visitor or user  
**I want to** view detailed market information  
**So that** I can learn about the event

**Acceptance Criteria:**
- Market detail page accessible publicly
- Header shows: Market name, location, date & time, status badge, favorite button (requires login), share button
- Market information card: description, full address, venue details (if any)
- Vendors section: "X Vendors Participating" heading, vendor grid with avatar, name, "Verified Seller" badge, item count, preview images, "View Wardrobe" button
- Items preview section: "Browse Items" heading, filter bar (category, price range, size, condition), items grid, pagination, "X items available"
- Location section: map embed, address with copy button, "Get Directions" button
- Similar markets section at bottom
- Call-to-action for sellers (if not logged in): "Become a seller and join this market"

### Story 11.3: Browse Items at Market
**As a** user interested in a market  
**I want to** browse items available at that market  
**So that** I can see what's being sold

**Acceptance Criteria:**
- Dedicated items browse page for each market
- Advanced filtering options: multiple categories (checkboxes), price range slider (min/max), multiple sizes (checkboxes), multiple conditions (checkboxes), seller filter (multi-select), color filter (color picker), brand search/filter
- Sort options dropdown: Price low to high, price high to low, recently added, seller name A-Z
- View toggle: Grid view (default), list view
- Active filters displayed as pills with remove option
- "Clear All" button
- Results count: "Showing X of Y items"
- Items displayed in grid with cards
- Pagination controls
- Back to market details link
- Filter changes update URL for shareability

### Story 11.4: Favorite Market
**As a** logged-in user  
**I want to** favorite markets  
**So that** I can save interesting events

**Acceptance Criteria:**
- Favorite button (heart icon) on market detail page
- Clicking toggles favorite status
- Filled heart indicates favorited
- Empty heart indicates not favorited
- Requires login (redirect to login if not authenticated)
- Favorite is saved immediately
- Option to enable notifications for market updates
- Success toast: "Market added to favorites"

### Story 11.5: View My Favorite Markets
**As a** logged-in user  
**I want to** view my favorited markets  
**So that** I can easily access them

**Acceptance Criteria:**
- Favorites page accessible from user navigation
- "My Favorite Markets" heading
- List of favorited markets with cards
- Notification toggle per market: "Notify me of updates"
- Quick unfavorite button
- Filter by: Upcoming, past
- Empty state: "No favorites yet" with "Explore Markets" button
- Clicking market navigates to detail page

### Story 11.6: Receive Market Reminder
**As a** user with favorited markets  
**I want to** receive reminders before markets start  
**So that** I don't forget to attend

**Acceptance Criteria:**
- 24 hours before market starts, reminder sent
- In-app notification: "Market starts tomorrow! [Market Name] begins at [Time] on [Date]"
- Email reminder with: market details, location, date/time, "View Items" button, vendor count
- Only sent for favorited markets with notifications enabled
- Reminder includes "Add to Calendar" button
- Reminder sent once per market

### Story 11.7: Add Market to Calendar
**As a** user interested in a market  
**I want to** add the market to my calendar  
**So that** I remember to attend

**Acceptance Criteria:**
- "Add to Calendar" button on market detail page
- Clicking generates .ics file (iCalendar format)
- File includes: market name as event title, start and end date/time, location, description
- File downloads to user's device
- User can open with calendar app
- Works across platforms (Google Calendar, Apple Calendar, Outlook)

---

## Epic 12: Real-time Notifications

### Story 12.1: Receive In-App Notifications
**As a** logged-in user  
**I want to** receive real-time notifications  
**So that** I stay informed about important events

**Acceptance Criteria:**
- Notification bell icon in header with unread count badge
- Badge shows number of unread notifications
- Badge updates in real-time when new notifications arrive
- Clicking bell opens notifications panel
- New notifications show animation (shake, pulse)
- Sound plays for new notifications (optional, user preference)
- Notifications persist across sessions

### Story 12.2: View Notifications Panel
**As a** logged-in user  
**I want to** view recent notifications quickly  
**So that** I can stay updated without leaving my current page

**Acceptance Criteria:**
- Clicking notification bell opens dropdown panel
- Panel shows most recent 10 notifications
- Header shows: "Notifications" title, "Mark all as read" button, settings icon (future)
- Each notification item shows: type icon, title (bold), message (preview, truncated), timestamp (relative: "5m ago", "2h ago", "Yesterday")
- Unread notifications highlighted (bold, blue background)
- Clicking notification: marks as read, closes panel, navigates to related page
- "View All" link at bottom navigates to full notifications page
- Empty state: "No notifications yet" with illustration
- Loading state: skeleton loaders

### Story 12.3: View All Notifications
**As a** logged-in user  
**I want to** view all my notifications  
**So that** I can review past notifications

**Acceptance Criteria:**
- Full notifications page accessible from panel or navigation
- Page header: "Notifications" title, "Mark all as read" button, "Clear all" button (with confirmation)
- Filter tabs: All, unread, by type (Sales, markets, payouts, system)
- Notifications list: all notifications in chronological order
- Each notification card shows: type icon, title, full message, timestamp (full date), read/unread indicator, action button (type-specific: "View Item", "View Market", "View Transaction"), delete button (trash icon)
- Pagination or infinite scroll
- Empty state per filter
- Bulk actions: select notifications (checkboxes), mark selected as read/unread, delete selected

### Story 12.4: Item Sold Notification
**As a** seller with items listed  
**I want to** be notified when my item sells  
**So that** I know about the sale immediately

**Acceptance Criteria:**
- When item sold, notification created with type: ITEM_SOLD
- Title: "Your item was sold!"
- Message: "[Item Name] was purchased by [Buyer First Name] for €X"
- Data includes: itemId, transactionId
- In-app notification appears immediately (real-time)
- Toast notification shown if user is active
- Email notification sent
- Notification links to transaction details

### Story 12.5: Payout Completed Notification
**As a** seller with payout request  
**I want to** be notified when payout is completed  
**So that** I know funds have been transferred

**Acceptance Criteria:**
- When payout processed, notification created with type: PAYOUT_COMPLETED
- Title: "Payout completed"
- Message: "€X has been transferred to your account"
- Data includes: transactionId, amount
- In-app notification appears immediately
- Toast notification shown
- Email notification sent with transfer details
- Notification links to transaction details

### Story 12.6: Seller Verification Notification
**As a** user who just activated as seller  
**I want to** be notified of successful verification  
**So that** I know I can start selling

**Acceptance Criteria:**
- When IBAN saved and verified, notification created with type: SELLER_VERIFIED
- Title: "You're now a verified seller!"
- Message: "Start listing items on markets"
- In-app notification appears immediately
- Toast notification shown: "Congratulations! You can now sell at markets."
- Email notification sent with seller guide
- Notification links to selling dashboard

### Story 12.7: Cart Expiration Warning
**As a** buyer with items in cart  
**I want to** be warned when my cart is expiring  
**So that** I can complete checkout in time

**Acceptance Criteria:**
- 5 minutes before cart item expiration, notification sent
- Type: ITEM_EXPIRING_SOON
- Title: "Your cart is expiring soon"
- Message: "X items will be released in 5 minutes"
- Data includes: itemIds, expiresAt timestamp
- In-app notification (if user active)
- Toast notification with countdown
- No email (too time-sensitive)
- Notification links to cart page

---

## Epic 13: Admin - Payment & Payout Management

### Story 13.1: View Payment Statistics
**As an** admin  
**I want to** view overall payment statistics  
**So that** I can monitor platform revenue

**Acceptance Criteria:**
- Admin can access payments dashboard
- Statistics cards show: total transactions, total revenue (all time), platform fees collected (10% of all sales), pending payouts (sum of all pending)
- Charts show: revenue over time (daily/weekly/monthly), transaction volume
- Filter by date range
- Export data to CSV

### Story 13.2: View Pending Payouts
**As an** admin  
**I want to** view all pending payout requests  
**So that** I can process them

**Acceptance Criteria:**
- Pending payouts section on admin payments dashboard
- Table shows: seller name, amount requested, request date, IBAN (masked), "Process" button
- Sorted by request date (oldest first)
- Filter by amount range
- Search by seller name
- Bulk select option for processing multiple payouts
- "Process Selected" button
- Count indicator: "X pending payouts (€Y total)"

### Story 13.3: Process Seller Payout
**As an** admin  
**I want to** process a payout request  
**So that** sellers receive their earnings

**Acceptance Criteria:**
- Admin clicks "Process" button on payout request
- Confirmation dialog shows: seller details, amount, IBAN (full), estimated arrival date
- "Confirm Payout" button triggers Adyen Payouts API
- System calls Adyen with: amount, seller IBAN, seller name, reference number
- Transaction status updates to PROCESSING during API call
- Upon Adyen success: status updates to COMPLETED, timestamp recorded, seller notified (in-app + email)
- Upon Adyen failure: status updates to FAILED, error message recorded, admin notified, seller notified with instructions
- Change is logged for audit trail

### Story 13.4: View Failed Transactions
**As an** admin  
**I want to** view failed payment transactions  
**So that** I can investigate and resolve issues

**Acceptance Criteria:**
- Failed transactions section on admin payments dashboard
- Table shows: transaction type, user, amount, failure reason, date, "Investigate" button
- Filter by: type (purchase, rental, payout), date range
- Clicking "Investigate" shows: full transaction details, error messages, user contact info, retry option (for payouts)
- Admin can add notes to failed transactions
- Admin can mark as resolved

### Story 13.5: View Transaction Details (Admin)
**As an** admin  
**I want to** view detailed information about any transaction  
**So that** I can assist users and troubleshoot issues

**Acceptance Criteria:**
- Admin can access transaction detail page for any transaction
- Page shows: transaction ID, type, user (clickable to user profile), amount breakdown, platform fee, status, payment method, timestamps (created, updated, completed)
- For purchases: items purchased (list), seller information
- For rentals: market information, hanger count
- For payouts: IBAN, bank name, Adyen reference
- Adyen webhook history (if applicable)
- Status change timeline
- Admin actions: refund (future), cancel (if pending), add note

---

## Epic 14: Security & Performance

### Story 14.1: Secure Payment Processing
**As a** platform user  
**I want to** know my payment information is secure  
**So that** I feel safe making purchases

**Acceptance Criteria:**
- All payment pages served over HTTPS
- PCI DSS compliance: no card data stored in database, all card data handled by Adyen
- Security headers configured: HSTS, X-Frame-Options, X-Content-Type-Options, CSP
- 3D Secure authentication implemented for card payments
- Webhook signatures verified (HMAC-SHA256)
- Payment operations are idempotent
- Rate limiting on payment endpoints
- All payment operations logged

### Story 14.2: Data Privacy Protection
**As a** user  
**I want to** know my personal data is protected  
**So that** my privacy is maintained

**Acceptance Criteria:**
- IBAN displayed in masked format: DE89****7890
- Row Level Security (RLS) enabled on all database tables
- Users can only access their own data
- Admins have controlled access to user data
- Server-side validation on all inputs
- XSS protection: user content sanitized (DOMPurify)
- SQL injection prevention: parameterized queries via Supabase
- CSRF protection enabled
- Session management secure

### Story 14.3: Image Upload Security
**As a** user uploading images  
**I want to** know only safe images are accepted  
**So that** malicious files cannot be uploaded

**Acceptance Criteria:**
- File type whitelist: only jpeg, png, webp accepted
- File extension validation insufficient - magic byte verification performed
- File size limit: 5MB per image enforced
- EXIF data stripped for privacy
- Images compressed before storage
- Virus scanning on uploads (optional)
- Storage quotas enforced per user
- Orphaned images cleaned up periodically

### Story 14.4: Fast Page Load Times
**As a** user  
**I want to** experience fast page loads  
**So that** the platform is pleasant to use

**Acceptance Criteria:**
- Core Web Vitals targets met: LCP <2.5s, FID <100ms, CLS <0.1
- Lighthouse score >90 on key pages
- Images optimized: compressed, WebP format, lazy loaded
- Code splitting implemented
- Critical CSS inlined
- Fonts optimized (font-display: swap)
- Static assets cached
- Bundle size <200KB initial
- Mobile-first design optimized

### Story 14.5: Error Monitoring & Recovery
**As a** developer/admin  
**I want to** monitor errors in production  
**So that** issues can be quickly identified and fixed

**Acceptance Criteria:**
- Sentry error monitoring integrated
- All errors captured: unhandled exceptions, promise rejections, server errors
- Error context included: user ID, action attempted, request details
- Error alerts sent for critical issues
- Error rate monitored
- User-friendly error messages shown (no technical details exposed)
- Error boundaries implemented (global and feature-specific)
- Users can report issues with error context

---

## Non-Functional Requirements

### Performance
- Page load time: <3 seconds on 4G connection
- Time to Interactive (TTI): <5 seconds
- Image optimization: <100KB thumbnails, <2MB full size
- API response time: <500ms average, <2s max
- Real-time notification latency: <1 second
- Cart reservation cleanup: every 5 minutes

### Scalability
- Support 1000+ concurrent users
- Handle 100+ QR scans per minute during market events
- Database pagination for all lists (20 items per page)
- Efficient database indexing
- CDN for static assets and images
- Connection pooling for database

### Security
- HTTPS only (no HTTP)
- HSTS header enabled
- Row Level Security on all tables
- Rate limiting: 5 login attempts per 15 min, 100 QR scans per hour
- Session timeout: 7 days (remember me), 24 hours (default)
- Password requirements: min 8 chars, 1 uppercase, 1 number
- Webhook signature verification mandatory
- API keys in environment variables only

### Availability
- Uptime target: 99.5%
- Automated backups: daily
- Point-in-time recovery available
- Maintenance windows: announced 48 hours in advance
- Graceful degradation for non-critical features
- Error logging and monitoring

### Usability
- Mobile-first responsive design
- Touch targets minimum 44px
- WCAG 2.1 AA compliance
- Support for: Chrome, Firefox, Safari, Edge (latest 2 versions)
- Camera permissions handled gracefully
- Clear error messages with actionable guidance
- Loading states for all async operations
- Optimistic UI updates where appropriate

### Data Retention
- User accounts: until deletion requested
- Transactions: indefinite (legal requirement)
- Notifications: 30 days
- Expired cart items: immediate cleanup
- Images: until item deleted
- Audit logs: 1 year

---

## Technical Constraints

### Required Technologies
- Frontend: Next.js 14 (App Router), React, TypeScript
- UI: Shadcn UI, Radix UI, Tailwind CSS
- Backend: Next.js Server Actions with next-safe-action
- Database: Supabase (PostgreSQL)
- Authentication: Supabase Auth (Email/Password + Google OAuth)
- Storage: Supabase Storage
- Real-time: Supabase Realtime
- Payments: Adyen for Platforms
- Email: Resend
- Hosting: Vercel

### Browser Support
- Modern browsers only (ES2020+)
- No IE support
- Chrome/Edge: latest 2 versions
- Firefox: latest 2 versions
- Safari: latest 2 versions
- Mobile: iOS Safari 14+, Chrome Android latest

### API Integrations
- Adyen: API v70+
- Supabase: Latest stable
- Resend: Latest stable

---

## Success Metrics

### User Adoption
- Target: 100 active users in first month
- Target: 20 active sellers in first month
- Target: 5 markets created in first month

### Engagement
- Average items per user: 5+
- Seller conversion rate: 20% of users
- Cart conversion rate: 60%
- Market attendance rate: 40% of favorited markets

### Transaction Metrics
- Average transaction value: €50
- Platform revenue: €1000 in first month
- Payout processing time: <3 business days
- Payment success rate: >95%

### Performance Metrics
- Page load time: <3s (95th percentile)
- Error rate: <1%
- Uptime: >99%
- User satisfaction: >4/5 stars

---

## Future Enhancements (Post-MVP)

### Phase 2 Features
- Advanced search with full-text indexing
- Seller analytics dashboard with charts
- Browse other users' wardrobes feature
- Social features (follow sellers, like items)
- Item favoriting and wishlists

### Phase 3 Features
- In-app messaging between buyers and sellers
- Returns and refunds system
- Dispute resolution workflow
- Seller ratings and reviews
- Item condition verification

### Phase 4 Features
- Mobile app (React Native)
- Push notifications (PWA)
- Multi-language support
- Multi-currency support
- Advanced fraud detection

### Phase 5 Features
- AI-powered item categorization
- Image recognition for brand detection
- Price recommendations based on market data
- Sustainable fashion impact metrics
- Carbon footprint tracking

---

## Glossary

**Active Seller**: A user who has completed IBAN verification and can sell items at markets.

**Cart Reservation**: A 15-minute hold on an item when added to cart, preventing others from purchasing.

**Hanger**: A display spot at a market event. Sellers rent hangers to display items.

**IBAN**: International Bank Account Number - required for sellers to receive payouts.

**Market**: A physical pop-up flea market event organized by admins.

**QR Code Pool**: Pre-generated QR codes that can be printed and linked to items.

**RACK**: Item status indicating an item is prepared for selling but not yet listed on a market.

**RLS (Row Level Security)**: Database-level security that ensures users can only access their own data.

**Split Payment**: Payment divided between seller (90%) and platform (10%).

**Vendor**: A seller who has rented hangers at a specific market.

**Wardrobe**: A user's collection of uploaded items, visible publicly or privately.

---

**Document Version**: 1.0  
**Last Updated**: 2025-01-16  
**Status**: Final for MVP Development

