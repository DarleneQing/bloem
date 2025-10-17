-- Bloem Circular Fashion Marketplace Database Schema
-- Migration 001: Initial Schema

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm"; -- For full-text search
CREATE EXTENSION IF NOT EXISTS "cube"; -- Required for earthdistance
CREATE EXTENSION IF NOT EXISTS "earthdistance"; -- For geospatial queries

-- ============================================================================
-- ENUMS
-- ============================================================================

-- User roles
CREATE TYPE user_role AS ENUM ('USER', 'ADMIN');

-- Item statuses
CREATE TYPE item_status AS ENUM (
  'WARDROBE',
  'RACK',
  'SOLD'
);

-- Wardrobe visibility statuses
CREATE TYPE wardrobe_status AS ENUM ('PUBLIC', 'PRIVATE');

-- Item categories
CREATE TYPE item_category AS ENUM (
  'TOPS',
  'BOTTOMS',
  'DRESSES',
  'OUTERWEAR',
  'SHOES',
  'ACCESSORIES',
  'BAGS',
  'JEWELRY',
  'OTHER'
);

-- Item conditions
CREATE TYPE item_condition AS ENUM (
  'NEW_WITH_TAGS',
  'LIKE_NEW',
  'EXCELLENT',
  'GOOD',
  'FAIR'
);

-- Item sizes
CREATE TYPE item_size AS ENUM (
  'XXS',
  'XS',
  'S',
  'M',
  'L',
  'XL',
  'XXL',
  'XXXL',
  'ONE_SIZE'
);

-- Market statuses
CREATE TYPE market_status AS ENUM ('DRAFT', 'ACTIVE', 'COMPLETED', 'CANCELLED');

-- QR code statuses
CREATE TYPE qr_code_status AS ENUM ('UNUSED', 'LINKED', 'SOLD', 'INVALID');

-- Transaction types
CREATE TYPE transaction_type AS ENUM ('PURCHASE', 'RENTAL', 'PAYOUT');

-- Transaction statuses
CREATE TYPE transaction_status AS ENUM ('PENDING', 'COMPLETED', 'FAILED', 'REFUNDED');

-- Payout statuses
CREATE TYPE payout_status AS ENUM ('REQUESTED', 'PROCESSING', 'COMPLETED', 'FAILED');

-- Notification types
CREATE TYPE notification_type AS ENUM (
  'ITEM_SOLD',
  'MARKET_REMINDER',
  'HANGER_RENTAL_CONFIRMED',
  'PAYOUT_COMPLETED',
  'QR_LINKED',
  'SELLER_VERIFIED',
  'CART_EXPIRING',
  'GENERAL'
);

-- ============================================================================
-- TABLES
-- ============================================================================

-- Users/Profiles Table
-- Extends Supabase auth.users with additional profile information
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL UNIQUE,
  full_name TEXT NOT NULL,
  phone TEXT,
  address TEXT,
  
  -- Seller activation fields
  iban TEXT,
  bank_name TEXT,
  account_holder_name TEXT,
  iban_verified_at TIMESTAMP WITH TIME ZONE,
  
  -- Role
  role user_role DEFAULT 'USER' NOT NULL,
  
  -- Wardrobe visibility
  wardrobe_status wardrobe_status DEFAULT 'PUBLIC' NOT NULL,
  
  -- Metadata
  avatar_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Items Table
CREATE TABLE items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  owner_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  
  -- Item details
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  brand TEXT,
  category item_category NOT NULL,
  size item_size,
  condition item_condition NOT NULL,
  color TEXT,
  
  -- Pricing
  selling_price DECIMAL(10, 2), -- Required when status = RACK/SOLD
  
  -- Status and visibility
  status item_status DEFAULT 'WARDROBE' NOT NULL,
  
  -- Images (stored in Supabase Storage)
  image_urls TEXT[] NOT NULL, -- Array of full image URLs
  thumbnail_url TEXT NOT NULL, -- Optimized thumbnail
  
  -- Market listing (when on RACK/SOLD)
  market_id UUID, -- Foreign key added after markets table creation
  listed_at TIMESTAMP WITH TIME ZONE,
  sold_at TIMESTAMP WITH TIME ZONE,
  buyer_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  
  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Markets Table
CREATE TABLE markets (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  
  -- Market details
  name TEXT NOT NULL,
  description TEXT,
  location_name TEXT NOT NULL,
  location_address TEXT NOT NULL,
  location_lat DECIMAL(10, 8),
  location_lng DECIMAL(11, 8),
  
  -- Dates
  start_date TIMESTAMP WITH TIME ZONE NOT NULL,
  end_date TIMESTAMP WITH TIME ZONE NOT NULL,
  
  -- Capacity
  max_vendors INTEGER NOT NULL,
  current_vendors INTEGER DEFAULT 0 NOT NULL,
  
  -- Pricing
  hanger_price DECIMAL(10, 2) NOT NULL, -- Price per hanger
  
  -- Status
  status market_status DEFAULT 'DRAFT' NOT NULL,
  
  -- Metadata
  created_by UUID NOT NULL REFERENCES profiles(id) ON DELETE RESTRICT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Add foreign key constraint from items to markets
ALTER TABLE items
  ADD CONSTRAINT items_market_id_fkey 
  FOREIGN KEY (market_id) REFERENCES markets(id) ON DELETE SET NULL;

-- Hanger Rentals Table
CREATE TABLE hanger_rentals (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  market_id UUID NOT NULL REFERENCES markets(id) ON DELETE CASCADE,
  seller_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  
  -- Rental details
  hanger_count INTEGER NOT NULL CHECK (hanger_count > 0),
  total_price DECIMAL(10, 2) NOT NULL,
  
  -- Payment
  payment_confirmed_at TIMESTAMP WITH TIME ZONE,
  transaction_id UUID, -- Foreign key added after transactions table creation
  
  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  
  -- Ensure one rental per seller per market
  UNIQUE(market_id, seller_id)
);

-- QR Codes Pool Table
CREATE TABLE qr_codes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  code TEXT NOT NULL UNIQUE, -- Format: BLOEM-[PREFIX]-[NUMBER]
  
  -- Status
  status qr_code_status DEFAULT 'UNUSED' NOT NULL,
  
  -- Linking
  item_id UUID REFERENCES items(id) ON DELETE SET NULL,
  linked_at TIMESTAMP WITH TIME ZONE,
  
  -- Generation info
  batch_id UUID NOT NULL,
  prefix TEXT NOT NULL,
  
  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Shopping Carts Table
CREATE TABLE carts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  
  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  
  -- One active cart per user
  UNIQUE(user_id)
);

-- Cart Items Table (with reservation system)
CREATE TABLE cart_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  cart_id UUID NOT NULL REFERENCES carts(id) ON DELETE CASCADE,
  item_id UUID NOT NULL REFERENCES items(id) ON DELETE CASCADE,
  
  -- Reservation (15 minutes)
  reserved_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL, -- reserved_at + 15 minutes
  
  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  
  -- Ensure item is only in one cart
  UNIQUE(item_id)
);

-- Transactions Table
CREATE TABLE transactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  
  -- Transaction type
  type transaction_type NOT NULL,
  status transaction_status DEFAULT 'PENDING' NOT NULL,
  
  -- Parties involved
  buyer_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  seller_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  
  -- Amounts
  total_amount DECIMAL(10, 2) NOT NULL,
  platform_fee DECIMAL(10, 2) NOT NULL,
  seller_amount DECIMAL(10, 2) NOT NULL,
  
  -- Payment provider details
  adyen_psp_reference TEXT,
  adyen_session_id TEXT,
  
  -- Related entities
  market_id UUID REFERENCES markets(id) ON DELETE SET NULL,
  item_id UUID REFERENCES items(id) ON DELETE SET NULL,
  
  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Add foreign key constraint from hanger_rentals to transactions
ALTER TABLE hanger_rentals
  ADD CONSTRAINT hanger_rentals_transaction_id_fkey
  FOREIGN KEY (transaction_id) REFERENCES transactions(id) ON DELETE SET NULL;

-- Payouts Table
CREATE TABLE payouts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  seller_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  
  -- Amount
  amount DECIMAL(10, 2) NOT NULL CHECK (amount >= 10.00), -- Minimum €10
  
  -- Status
  status payout_status DEFAULT 'REQUESTED' NOT NULL,
  
  -- Payout details
  iban TEXT NOT NULL,
  bank_name TEXT NOT NULL,
  account_holder_name TEXT NOT NULL,
  
  -- Payment provider
  adyen_payout_reference TEXT,
  
  -- Processing
  requested_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  processed_at TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE,
  
  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Notifications Table
CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  
  -- Notification content
  type notification_type NOT NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  
  -- Related data (JSON for flexibility)
  data JSONB,
  
  -- Status
  read BOOLEAN DEFAULT FALSE NOT NULL,
  read_at TIMESTAMP WITH TIME ZONE,
  
  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Favorites Table (for markets)
CREATE TABLE favorites (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  market_id UUID NOT NULL REFERENCES markets(id) ON DELETE CASCADE,
  
  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  
  -- One favorite per user per market
  UNIQUE(user_id, market_id)
);

-- ============================================================================
-- INDEXES
-- ============================================================================

-- Profiles
CREATE INDEX idx_profiles_email ON profiles(email);
CREATE INDEX idx_profiles_role ON profiles(role);
CREATE INDEX idx_profiles_iban_verified ON profiles(iban_verified_at) WHERE iban_verified_at IS NOT NULL;

-- Items
CREATE INDEX idx_items_owner ON items(owner_id);
CREATE INDEX idx_items_status ON items(status);
CREATE INDEX idx_items_market ON items(market_id) WHERE market_id IS NOT NULL;
CREATE INDEX idx_items_category ON items(category);
CREATE INDEX idx_items_buyer ON items(buyer_id) WHERE buyer_id IS NOT NULL;
CREATE INDEX idx_items_created_at ON items(created_at DESC);
CREATE INDEX idx_items_title_search ON items USING gin(to_tsvector('english', title));
CREATE INDEX idx_items_description_search ON items USING gin(to_tsvector('english', description));

-- Markets
CREATE INDEX idx_markets_status ON markets(status);
CREATE INDEX idx_markets_start_date ON markets(start_date);
CREATE INDEX idx_markets_created_by ON markets(created_by);
CREATE INDEX idx_markets_location ON markets USING gist(ll_to_earth(location_lat, location_lng)) WHERE location_lat IS NOT NULL AND location_lng IS NOT NULL;

-- Hanger Rentals
CREATE INDEX idx_hanger_rentals_market ON hanger_rentals(market_id);
CREATE INDEX idx_hanger_rentals_seller ON hanger_rentals(seller_id);

-- QR Codes
CREATE INDEX idx_qr_codes_code ON qr_codes(code);
CREATE INDEX idx_qr_codes_status ON qr_codes(status);
CREATE INDEX idx_qr_codes_item ON qr_codes(item_id) WHERE item_id IS NOT NULL;
CREATE INDEX idx_qr_codes_batch ON qr_codes(batch_id);

-- Carts
CREATE INDEX idx_carts_user ON carts(user_id);

-- Cart Items
CREATE INDEX idx_cart_items_cart ON cart_items(cart_id);
CREATE INDEX idx_cart_items_item ON cart_items(item_id);
CREATE INDEX idx_cart_items_expires ON cart_items(expires_at);

-- Transactions
CREATE INDEX idx_transactions_buyer ON transactions(buyer_id) WHERE buyer_id IS NOT NULL;
CREATE INDEX idx_transactions_seller ON transactions(seller_id) WHERE seller_id IS NOT NULL;
CREATE INDEX idx_transactions_status ON transactions(status);
CREATE INDEX idx_transactions_type ON transactions(type);
CREATE INDEX idx_transactions_created_at ON transactions(created_at DESC);

-- Payouts
CREATE INDEX idx_payouts_seller ON payouts(seller_id);
CREATE INDEX idx_payouts_status ON payouts(status);
CREATE INDEX idx_payouts_requested_at ON payouts(requested_at DESC);

-- Notifications
CREATE INDEX idx_notifications_user ON notifications(user_id);
CREATE INDEX idx_notifications_read ON notifications(read);
CREATE INDEX idx_notifications_created_at ON notifications(created_at DESC);
CREATE INDEX idx_notifications_user_unread ON notifications(user_id, created_at DESC) WHERE read = FALSE;

-- Favorites
CREATE INDEX idx_favorites_user ON favorites(user_id);
CREATE INDEX idx_favorites_market ON favorites(market_id);

-- ============================================================================
-- TRIGGERS
-- ============================================================================

-- Updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply updated_at triggers
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_items_updated_at BEFORE UPDATE ON items
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_markets_updated_at BEFORE UPDATE ON markets
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_hanger_rentals_updated_at BEFORE UPDATE ON hanger_rentals
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_qr_codes_updated_at BEFORE UPDATE ON qr_codes
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_carts_updated_at BEFORE UPDATE ON carts
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_transactions_updated_at BEFORE UPDATE ON transactions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_payouts_updated_at BEFORE UPDATE ON payouts
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Automatic profile creation on auth.users insert
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, created_at, updated_at)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
    NOW(),
    NOW()
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Update market vendor count on hanger rental
CREATE OR REPLACE FUNCTION update_market_vendor_count()
RETURNS TRIGGER AS $$
BEGIN
  IF (TG_OP = 'INSERT') THEN
    UPDATE markets 
    SET current_vendors = current_vendors + 1 
    WHERE id = NEW.market_id;
  ELSIF (TG_OP = 'DELETE') THEN
    UPDATE markets 
    SET current_vendors = current_vendors - 1 
    WHERE id = OLD.market_id;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_vendor_count_on_rental
  AFTER INSERT OR DELETE ON hanger_rentals
  FOR EACH ROW EXECUTE FUNCTION update_market_vendor_count();

-- ============================================================================
-- FUNCTIONS
-- ============================================================================

-- Function to check if user is active seller
CREATE OR REPLACE FUNCTION is_active_seller(user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = user_id AND iban_verified_at IS NOT NULL
  );
END;
$$ LANGUAGE plpgsql STABLE;

-- Function to get seller earnings
CREATE OR REPLACE FUNCTION get_seller_earnings(seller_id UUID)
RETURNS TABLE (
  total_earned DECIMAL,
  available_balance DECIMAL,
  pending_balance DECIMAL,
  paid_out DECIMAL
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    COALESCE(SUM(CASE WHEN t.status = 'COMPLETED' THEN t.seller_amount ELSE 0 END), 0) as total_earned,
    COALESCE(SUM(CASE WHEN t.status = 'COMPLETED' THEN t.seller_amount ELSE 0 END), 0) - 
      COALESCE((SELECT SUM(amount) FROM payouts WHERE payouts.seller_id = seller_id AND status = 'COMPLETED'), 0) as available_balance,
    COALESCE(SUM(CASE WHEN t.status = 'PENDING' THEN t.seller_amount ELSE 0 END), 0) as pending_balance,
    COALESCE((SELECT SUM(amount) FROM payouts WHERE payouts.seller_id = seller_id AND status = 'COMPLETED'), 0) as paid_out
  FROM transactions t
  WHERE t.seller_id = seller_id AND t.type = 'PURCHASE';
END;
$$ LANGUAGE plpgsql STABLE;

-- Function to cleanup expired cart reservations
CREATE OR REPLACE FUNCTION cleanup_expired_cart_items()
RETURNS INTEGER AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  DELETE FROM cart_items
  WHERE expires_at < NOW();
  
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- COMMENTS
-- ============================================================================

COMMENT ON TABLE profiles IS 'User profiles extending Supabase auth.users';
COMMENT ON TABLE items IS 'Items in user wardrobes, racks, and markets';
COMMENT ON TABLE markets IS 'Pop-up market events';
COMMENT ON TABLE hanger_rentals IS 'Seller hanger rentals for specific markets';
COMMENT ON TABLE qr_codes IS 'Pre-generated QR codes for item labeling';
COMMENT ON TABLE carts IS 'Shopping carts for buyers';
COMMENT ON TABLE cart_items IS 'Items in carts with 15-minute reservations';
COMMENT ON TABLE transactions IS 'All financial transactions (purchases, rentals, payouts)';
COMMENT ON TABLE payouts IS 'Seller payout requests and processing';
COMMENT ON TABLE notifications IS 'Real-time notifications for users';
COMMENT ON TABLE favorites IS 'User-favorited markets';

-- ============================================================================
-- END OF MIGRATION
-- ============================================================================

