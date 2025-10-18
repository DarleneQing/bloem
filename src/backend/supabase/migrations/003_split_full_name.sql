-- Bloem Circular Fashion Marketplace Database Schema
-- Migration 003: Split full_name into first_name and last_name

-- ============================================================================
-- ADD NEW COLUMNS
-- ============================================================================

-- Add first_name and last_name as nullable initially to allow data migration
ALTER TABLE profiles 
  ADD COLUMN first_name TEXT,
  ADD COLUMN last_name TEXT;

-- ============================================================================
-- MIGRATE EXISTING DATA
-- ============================================================================

-- Split full_name into first_name and last_name
-- Logic: First word becomes first_name, remaining words become last_name
-- If only one word exists, use it for both first_name and last_name
UPDATE profiles
SET 
  first_name = CASE
    WHEN POSITION(' ' IN TRIM(full_name)) > 0 
    THEN TRIM(SPLIT_PART(TRIM(full_name), ' ', 1))
    ELSE TRIM(full_name)
  END,
  last_name = CASE
    WHEN POSITION(' ' IN TRIM(full_name)) > 0 
    THEN TRIM(SUBSTRING(TRIM(full_name) FROM POSITION(' ' IN TRIM(full_name)) + 1))
    ELSE TRIM(full_name)
  END;

-- ============================================================================
-- MAKE COLUMNS NOT NULL
-- ============================================================================

-- Now that all rows have values, make the columns NOT NULL
ALTER TABLE profiles 
  ALTER COLUMN first_name SET NOT NULL,
  ALTER COLUMN last_name SET NOT NULL;

-- ============================================================================
-- DROP OLD COLUMN
-- ============================================================================

-- Remove the old full_name column
ALTER TABLE profiles 
  DROP COLUMN full_name;

-- ============================================================================
-- UPDATE TRIGGER FUNCTION
-- ============================================================================

-- Update the handle_new_user trigger to use first_name and last_name
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
  
  -- Insert profile with first_name and last_name
  INSERT INTO public.profiles (id, email, first_name, last_name, created_at, updated_at)
  VALUES (
    NEW.id,
    NEW.email,
    user_first_name,
    user_last_name,
    NOW(),
    NOW()
  );
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- ADD INDEXES FOR SEARCH (OPTIONAL BUT RECOMMENDED)
-- ============================================================================

-- Add indexes for name searches
CREATE INDEX idx_profiles_first_name ON profiles(first_name);
CREATE INDEX idx_profiles_last_name ON profiles(last_name);

-- Full-text search index for names
CREATE INDEX idx_profiles_name_search ON profiles 
  USING gin(to_tsvector('english', first_name || ' ' || last_name));

-- ============================================================================
-- COMMENTS
-- ============================================================================

COMMENT ON COLUMN profiles.first_name IS 'User first name';
COMMENT ON COLUMN profiles.last_name IS 'User last name';

-- ============================================================================
-- END OF MIGRATION
-- ============================================================================

