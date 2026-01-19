-- Add missing INSERT policy for user_roles table
-- This allows users to insert their own role during signup

-- Drop policy if it already exists (safe to run multiple times)
DROP POLICY IF EXISTS "Users can insert own role" ON public.user_roles;

-- Create the policy
CREATE POLICY "Users can insert own role"
  ON public.user_roles FOR INSERT
  WITH CHECK (auth.uid() = user_id);
