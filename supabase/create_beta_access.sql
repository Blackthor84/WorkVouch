-- Add beta role support and beta access fields

-- 1. Ensure beta role exists in user_roles (if not already present)
-- This will be handled by inserting into user_roles when creating beta users

-- 2. Add beta_expiration and login_token to profiles table
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS beta_expiration timestamptz,
ADD COLUMN IF NOT EXISTS login_token text;

-- Create index for login_token lookups
CREATE INDEX IF NOT EXISTS profiles_login_token_idx ON public.profiles(login_token) WHERE login_token IS NOT NULL;

-- Create index for beta_expiration queries
CREATE INDEX IF NOT EXISTS profiles_beta_expiration_idx ON public.profiles(beta_expiration) WHERE beta_expiration IS NOT NULL;

-- RLS Policy: Users can view their own beta status
CREATE POLICY IF NOT EXISTS "Users can view own beta status" ON public.profiles
  FOR SELECT USING (auth.uid() = id);

-- RLS Policy: Admins can view all beta users
CREATE POLICY IF NOT EXISTS "Admins can view all beta users" ON public.profiles
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid()
      AND role IN ('admin', 'superadmin')
    )
  );

-- Function to check if beta access is expired
CREATE OR REPLACE FUNCTION public.is_beta_expired(user_id uuid)
RETURNS boolean AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = user_id
    AND beta_expiration IS NOT NULL
    AND beta_expiration < NOW()
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to generate unique login token
CREATE OR REPLACE FUNCTION public.generate_login_token()
RETURNS text AS $$
BEGIN
  RETURN encode(gen_random_bytes(32), 'hex');
END;
$$ LANGUAGE plpgsql;
