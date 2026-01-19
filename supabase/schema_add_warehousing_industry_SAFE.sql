-- ============================================================================
-- ADD WAREHOUSING & LOGISTICS INDUSTRY (SAFE VERSION)
-- ============================================================================
-- Copy and paste this ENTIRE file into Supabase SQL Editor
-- ============================================================================

-- Step 1: Add 'warehousing' to industry_type enum (if enum exists)
DO $$ 
BEGIN
  -- Check if industry_type enum exists
  IF EXISTS (
    SELECT 1 FROM pg_type WHERE typname = 'industry_type'
  ) THEN
    -- Check if 'warehousing' value already exists
    IF NOT EXISTS (
      SELECT 1 FROM pg_enum 
      WHERE enumlabel = 'warehousing' 
      AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'industry_type')
    ) THEN
      ALTER TYPE industry_type ADD VALUE 'warehousing';
    END IF;
  ELSE
    -- If enum doesn't exist, create it with all values
    CREATE TYPE industry_type AS ENUM (
      'law_enforcement',
      'security',
      'hospitality',
      'retail',
      'warehousing'
    );
  END IF;
END $$;

-- Step 2: Add warehouse-specific fields to profiles table
DO $$ 
BEGIN
  -- Add warehouse_type column
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'profiles' 
    AND column_name = 'warehouse_type'
  ) THEN
    ALTER TABLE public.profiles ADD COLUMN warehouse_type TEXT;
  END IF;

  -- Add equipment_operated column (stored as JSONB array)
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'profiles' 
    AND column_name = 'equipment_operated'
  ) THEN
    ALTER TABLE public.profiles ADD COLUMN equipment_operated JSONB DEFAULT '[]'::jsonb;
  END IF;

  -- Add warehouse_responsibilities column (stored as JSONB array)
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'profiles' 
    AND column_name = 'warehouse_responsibilities'
  ) THEN
    ALTER TABLE public.profiles ADD COLUMN warehouse_responsibilities JSONB DEFAULT '[]'::jsonb;
  END IF;

  -- Add warehouse_certifications column (stored as JSONB array)
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'profiles' 
    AND column_name = 'warehouse_certifications'
  ) THEN
    ALTER TABLE public.profiles ADD COLUMN warehouse_certifications JSONB DEFAULT '[]'::jsonb;
  END IF;
END $$;

-- Step 3: Create indexes for warehouse fields
CREATE INDEX IF NOT EXISTS idx_profiles_warehouse_type ON public.profiles(warehouse_type);
CREATE INDEX IF NOT EXISTS idx_profiles_equipment_operated ON public.profiles USING GIN(equipment_operated);
CREATE INDEX IF NOT EXISTS idx_profiles_warehouse_responsibilities ON public.profiles USING GIN(warehouse_responsibilities);
CREATE INDEX IF NOT EXISTS idx_profiles_warehouse_certifications ON public.profiles USING GIN(warehouse_certifications);

-- Step 4: Update handle_new_user function to support warehousing industry
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  -- Create profile with industry from metadata
  INSERT INTO public.profiles (id, full_name, email, industry)
  VALUES (
    NEW.id, 
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''), 
    NEW.email,
    CASE 
      WHEN NEW.raw_user_meta_data->>'industry' = 'law_enforcement' THEN 'law_enforcement'::industry_type
      WHEN NEW.raw_user_meta_data->>'industry' = 'security' THEN 'security'::industry_type
      WHEN NEW.raw_user_meta_data->>'industry' = 'hospitality' THEN 'hospitality'::industry_type
      WHEN NEW.raw_user_meta_data->>'industry' = 'retail' THEN 'retail'::industry_type
      WHEN NEW.raw_user_meta_data->>'industry' = 'warehousing' THEN 'warehousing'::industry_type
      ELSE NULL
    END
  )
  ON CONFLICT (id) DO UPDATE SET
    industry = COALESCE(
      CASE 
        WHEN NEW.raw_user_meta_data->>'industry' = 'law_enforcement' THEN 'law_enforcement'::industry_type
        WHEN NEW.raw_user_meta_data->>'industry' = 'security' THEN 'security'::industry_type
        WHEN NEW.raw_user_meta_data->>'industry' = 'hospitality' THEN 'hospitality'::industry_type
        WHEN NEW.raw_user_meta_data->>'industry' = 'retail' THEN 'retail'::industry_type
        WHEN NEW.raw_user_meta_data->>'industry' = 'warehousing' THEN 'warehousing'::industry_type
        ELSE NULL
      END,
      profiles.industry
    );
  
  -- Add default 'user' role (using SECURITY DEFINER to bypass RLS)
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'user')
  ON CONFLICT (user_id, role) DO NOTHING;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
