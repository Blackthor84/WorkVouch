-- Fix RLS Policies to Allow Profile Creation
-- Run this in Supabase SQL Editor

-- Add INSERT policy for profiles (for trigger to work)
-- The trigger uses SECURITY DEFINER, but we need this for manual inserts too
DROP POLICY IF EXISTS "Allow profile creation via trigger" ON public.profiles;

CREATE POLICY "Allow profile creation via trigger"
  ON public.profiles FOR INSERT
  WITH CHECK (true);  -- Allow all inserts (trigger will handle validation)

-- Ensure user_roles INSERT policy exists
DROP POLICY IF EXISTS "Users can insert own role" ON public.user_roles;

CREATE POLICY "Users can insert own role"
  ON public.user_roles FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Create profiles for ALL existing users (bypasses RLS)
INSERT INTO public.profiles (id, full_name, email)
SELECT 
  u.id,
  COALESCE(u.raw_user_meta_data->>'full_name', 'User'),
  u.email
FROM auth.users u
WHERE NOT EXISTS (
  SELECT 1 FROM public.profiles p WHERE p.id = u.id
)
ON CONFLICT (id) DO NOTHING;

-- Add user roles for ALL existing users
INSERT INTO public.user_roles (user_id, role)
SELECT 
  u.id,
  'user'
FROM auth.users u
WHERE NOT EXISTS (
  SELECT 1 FROM public.user_roles ur 
  WHERE ur.user_id = u.id AND ur.role = 'user'
)
ON CONFLICT (user_id, role) DO NOTHING;
