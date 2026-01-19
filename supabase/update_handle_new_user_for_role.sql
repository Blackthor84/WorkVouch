-- ============================================================================
-- UPDATE handle_new_user TRIGGER TO SET ROLE
-- ============================================================================
-- Updates the trigger to set role='user' when creating a new profile
-- ============================================================================

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  -- Create profile with industry and role from metadata
  INSERT INTO public.profiles (id, full_name, email, industry, role)
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
    END,
    COALESCE(
      NEW.raw_user_meta_data->>'role',
      CASE 
        WHEN NEW.raw_user_meta_data->>'user_type' = 'employer' THEN 'employer'
        ELSE 'user'
      END,
      'user'
    ) -- Set role from metadata, or infer from user_type, or default to 'user'
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
    ),
    role = COALESCE(
      NEW.raw_user_meta_data->>'role',
      profiles.role,
      'user'
    );
  
  -- Add role to user_roles table (for backwards compatibility)
  -- Use role from profile or infer from user_type
  INSERT INTO public.user_roles (user_id, role)
  VALUES (
    NEW.id,
    COALESCE(
      (SELECT role FROM public.profiles WHERE id = NEW.id),
      CASE 
        WHEN NEW.raw_user_meta_data->>'user_type' = 'employer' THEN 'employer'::user_role
        ELSE 'user'::user_role
      END
    )
  )
  ON CONFLICT (user_id, role) DO NOTHING;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
