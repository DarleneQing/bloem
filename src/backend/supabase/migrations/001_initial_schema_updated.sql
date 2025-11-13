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
  first_name TEXT NOT NULL CHECK (LENGTH(TRIM(first_name)) > 0),
  last_name TEXT NOT NULL CHECK (LENGTH(TRIM(last_name)) > 0),
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
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  
  -- Email format constraint
  CONSTRAINT profiles_email_format CHECK (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$')
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
  
  -- Hanger capacity (added in migration 005)
  max_hangers INTEGER DEFAULT 0 NOT NULL CHECK (max_hangers >= 0),
  current_hangers INTEGER DEFAULT 0 NOT NULL CHECK (current_hangers >= 0),
  
  -- Pricing
  hanger_price DECIMAL(10, 2) NOT NULL, -- Price per hanger
  
  -- Status
  status market_status DEFAULT 'DRAFT' NOT NULL,
  
  -- Metadata
  created_by UUID NOT NULL REFERENCES profiles(id) ON DELETE RESTRICT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  
  -- Constraints
  CONSTRAINT markets_hanger_capacity_check CHECK (current_hangers <= max_hangers)
);

-- Add foreign key constraint from items to markets
ALTER TABLE items
  ADD CONSTRAINT items_market_id_fkey 
  FOREIGN KEY (market_id) REFERENCES markets(id) ON DELETE SET NULL;

-- Hanger Rentals Table
CREATE TABLE hanger_rentals (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  market_id UUID NOT NULL REFERENCES markets(id) ON DELETE CASCADE,
  
  -- Rental details
  hanger_count INTEGER NOT NULL CHECK (hanger_count > 0),
  total_price DECIMAL(10, 2) NOT NULL CHECK (total_price > 0),
  
  -- Status
  status TEXT DEFAULT 'ACTIVE' NOT NULL,
  
  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  
  -- One rental per user per market
  UNIQUE(user_id, market_id)
);

-- QR Codes Table
CREATE TABLE qr_codes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  
  -- QR code details
  code TEXT NOT NULL UNIQUE,
  type TEXT NOT NULL, -- 'ITEM', 'MARKET', 'USER', etc.
  data JSONB NOT NULL, -- Flexible data storage
  
  -- Status
  status qr_code_status DEFAULT 'UNUSED' NOT NULL,
  
  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Carts Table
CREATE TABLE carts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  
  -- Cart details
  items JSONB NOT NULL DEFAULT '[]'::jsonb,
  total_amount DECIMAL(10, 2) DEFAULT 0.00,
  
  -- Expiration
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  
  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Transactions Table
CREATE TABLE transactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  
  -- Parties
  buyer_id UUID NOT NULL REFERENCES profiles(id) ON DELETE RESTRICT,
  seller_id UUID NOT NULL REFERENCES profiles(id) ON DELETE RESTRICT,
  
  -- Transaction details
  type transaction_type NOT NULL,
  status transaction_status DEFAULT 'PENDING' NOT NULL,
  
  -- Amounts
  total_amount DECIMAL(10, 2) NOT NULL CHECK (total_amount > 0),
  platform_fee DECIMAL(10, 2) NOT NULL CHECK (platform_fee >= 0),
  seller_amount DECIMAL(10, 2) NOT NULL CHECK (seller_amount >= 0),
  
  -- Related data
  items JSONB NOT NULL, -- Array of item IDs and details
  market_id UUID REFERENCES markets(id) ON DELETE SET NULL,
  
  -- Payment
  stripe_payment_intent_id TEXT,
  
  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

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
  stripe_payout_id TEXT,
  
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
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
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
CREATE INDEX idx_profiles_first_name ON profiles(first_name);
CREATE INDEX idx_profiles_last_name ON profiles(last_name);
CREATE INDEX idx_profiles_name_search ON profiles USING gin(to_tsvector('english', first_name || ' ' || last_name));
CREATE INDEX idx_profiles_name_email_search ON profiles(first_name, last_name, email);
CREATE INDEX idx_profiles_seller_verification ON profiles(iban_verified_at) WHERE iban_verified_at IS NOT NULL;
CREATE INDEX idx_profiles_role_active ON profiles(role, created_at) WHERE role = 'ADMIN';
CREATE INDEX idx_profiles_recent_users ON profiles(created_at DESC) WHERE created_at > NOW() - INTERVAL '30 days';

-- Items
CREATE INDEX idx_items_owner ON items(owner_id);
CREATE INDEX idx_items_status ON items(status);
CREATE INDEX idx_items_category ON items(category);
CREATE INDEX idx_items_market ON items(market_id);
CREATE INDEX idx_items_buyer ON items(buyer_id);
CREATE INDEX idx_items_created_at ON items(created_at DESC);

-- Markets
CREATE INDEX idx_markets_status ON markets(status);
CREATE INDEX idx_markets_dates ON markets(start_date, end_date);
CREATE INDEX idx_markets_location ON markets USING gist(ll_to_earth(location_lat, location_lng));
CREATE INDEX idx_markets_created_by ON markets(created_by);
CREATE INDEX idx_markets_hanger_capacity ON markets(max_hangers, current_hangers);

-- Hanger Rentals
CREATE INDEX idx_hanger_rentals_user ON hanger_rentals(user_id);
CREATE INDEX idx_hanger_rentals_market ON hanger_rentals(market_id);
CREATE INDEX idx_hanger_rentals_created_at ON hanger_rentals(created_at DESC);

-- QR Codes
CREATE INDEX idx_qr_codes_user ON qr_codes(user_id);
CREATE INDEX idx_qr_codes_code ON qr_codes(code);
CREATE INDEX idx_qr_codes_status ON qr_codes(status);

-- Carts
CREATE INDEX idx_carts_user ON carts(user_id);
CREATE INDEX idx_carts_expires_at ON carts(expires_at);

-- Transactions
CREATE INDEX idx_transactions_buyer ON transactions(buyer_id);
CREATE INDEX idx_transactions_seller ON transactions(seller_id);
CREATE INDEX idx_transactions_status ON transactions(status);
CREATE INDEX idx_transactions_market ON transactions(market_id);
CREATE INDEX idx_transactions_created_at ON transactions(created_at DESC);

-- Payouts
CREATE INDEX idx_payouts_seller ON payouts(seller_id);
CREATE INDEX idx_payouts_status ON payouts(status);
CREATE INDEX idx_payouts_requested_at ON payouts(requested_at DESC);

-- Notifications
CREATE INDEX idx_notifications_user ON notifications(user_id);
CREATE INDEX idx_notifications_read ON notifications(read);
CREATE INDEX idx_notifications_type ON notifications(type);
CREATE INDEX idx_notifications_created_at ON notifications(created_at DESC);

-- Favorites
CREATE INDEX idx_favorites_user ON favorites(user_id);
CREATE INDEX idx_favorites_market ON favorites(market_id);

-- ============================================================================
-- TRIGGERS
-- ============================================================================

-- Function to update updated_at column
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply updated_at triggers to all tables
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
DECLARE
  user_first_name TEXT;
  user_last_name TEXT;
  full_name_from_meta TEXT;
BEGIN
  -- Try to get first_name and last_name from metadata
  user_first_name := NEW.raw_user_meta_data->>'first_name';
  user_last_name := NEW.raw_user_meta_data->>'last_name';
  
  -- If first_name and last_name are not provided separately,
  -- try to extract from full_name in metadata
  IF user_first_name IS NULL OR user_last_name IS NULL THEN
    full_name_from_meta := COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email);
    
    -- Split the full_name
    IF POSITION(' ' IN TRIM(full_name_from_meta)) > 0 THEN
      user_first_name := COALESCE(user_first_name, TRIM(SPLIT_PART(TRIM(full_name_from_meta), ' ', 1)));
      user_last_name := COALESCE(user_last_name, TRIM(SUBSTRING(TRIM(full_name_from_meta) FROM POSITION(' ' IN TRIM(full_name_from_meta)) + 1)));
    ELSE
      -- If only one word, use it for both
      user_first_name := COALESCE(user_first_name, TRIM(full_name_from_meta));
      user_last_name := COALESCE(user_last_name, TRIM(full_name_from_meta));
    END IF;
  END IF;
  
  -- Ensure we have valid names
  IF user_first_name IS NULL OR TRIM(user_first_name) = '' THEN
    user_first_name := 'User';
  END IF;
  
  IF user_last_name IS NULL OR TRIM(user_last_name) = '' THEN
    user_last_name := 'User';
  END IF;
  
  -- Insert profile with first_name and last_name
  INSERT INTO public.profiles (id, email, first_name, last_name, created_at, updated_at)
  VALUES (
    NEW.id,
    NEW.email,
    TRIM(user_first_name),
    TRIM(user_last_name),
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

-- Function to update market hanger counts when hanger rentals change
CREATE OR REPLACE FUNCTION update_market_hanger_count()
RETURNS TRIGGER AS $$
BEGIN
  -- Update the market's current_hangers count
  UPDATE markets 
  SET current_hangers = (
    SELECT COALESCE(SUM(hanger_count), 0)
    FROM hanger_rentals 
    WHERE market_id = COALESCE(NEW.market_id, OLD.market_id)
  ),
  updated_at = NOW()
  WHERE id = COALESCE(NEW.market_id, OLD.market_id);
  
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_market_hanger_count_trigger
  AFTER INSERT OR UPDATE OR DELETE ON hanger_rentals
  FOR EACH ROW
  EXECUTE FUNCTION update_market_hanger_count();

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

-- Function to get user's full name
CREATE OR REPLACE FUNCTION get_user_full_name(user_id UUID)
RETURNS TEXT AS $$
BEGIN
  RETURN (
    SELECT CONCAT(first_name, ' ', last_name)
    FROM profiles
    WHERE id = user_id
  );
END;
$$ LANGUAGE plpgsql STABLE;

-- Function to search users by name
CREATE OR REPLACE FUNCTION search_users_by_name(search_term TEXT)
RETURNS TABLE(
  id UUID,
  email TEXT,
  first_name TEXT,
  last_name TEXT,
  full_name TEXT,
  role user_role,
  created_at TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    p.id,
    p.email,
    p.first_name,
    p.last_name,
    CONCAT(p.first_name, ' ', p.last_name) as full_name,
    p.role,
    p.created_at
  FROM profiles p
  WHERE 
    p.first_name ILIKE '%' || search_term || '%' OR
    p.last_name ILIKE '%' || search_term || '%' OR
    CONCAT(p.first_name, ' ', p.last_name) ILIKE '%' || search_term || '%' OR
    p.email ILIKE '%' || search_term || '%'
  ORDER BY p.created_at DESC;
END;
$$ LANGUAGE plpgsql STABLE;

-- Function to get user statistics for admin dashboard
CREATE OR REPLACE FUNCTION get_user_statistics()
RETURNS TABLE(
  total_users BIGINT,
  admin_users BIGINT,
  verified_sellers BIGINT,
  recent_signups BIGINT,
  active_users BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    (SELECT COUNT(*) FROM profiles) as total_users,
    (SELECT COUNT(*) FROM profiles WHERE role = 'ADMIN') as admin_users,
    (SELECT COUNT(*) FROM profiles WHERE iban_verified_at IS NOT NULL) as verified_sellers,
    (SELECT COUNT(*) FROM profiles WHERE created_at > NOW() - INTERVAL '7 days') as recent_signups,
    (SELECT COUNT(*) FROM profiles WHERE id IN (
      SELECT DISTINCT owner_id FROM items
      UNION
      SELECT DISTINCT buyer_id FROM transactions WHERE buyer_id IS NOT NULL
    )) as active_users;
END;
$$ LANGUAGE plpgsql STABLE;

-- ============================================================================
-- COMMENTS
-- ============================================================================

COMMENT ON TABLE profiles IS 'User profiles extending Supabase auth.users';
COMMENT ON COLUMN profiles.first_name IS 'User first name';
COMMENT ON COLUMN profiles.last_name IS 'User last name';
COMMENT ON COLUMN profiles.iban_verified_at IS 'Timestamp when seller verification was completed';
COMMENT ON COLUMN markets.max_hangers IS 'Maximum number of hangers available for this market';
COMMENT ON COLUMN markets.current_hangers IS 'Current number of hangers rented for this market';

COMMENT ON FUNCTION get_user_full_name(UUID) IS 'Returns the full name (first_name + last_name) for a given user ID';
COMMENT ON FUNCTION search_users_by_name(TEXT) IS 'Searches users by first name, last name, full name, or email';
COMMENT ON FUNCTION get_user_statistics() IS 'Returns user statistics for admin dashboard';

COMMENT ON INDEX idx_profiles_name_email_search IS 'Composite index for efficient user search by name and email';
COMMENT ON INDEX idx_profiles_seller_verification IS 'Index for verified sellers queries';
COMMENT ON INDEX idx_profiles_role_active IS 'Index for admin user queries';
COMMENT ON INDEX idx_profiles_recent_users IS 'Index for recent user queries';

-- ============================================================================
-- END OF SCHEMA
-- ============================================================================
