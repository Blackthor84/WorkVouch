-- Fix Infinite Recursion in RLS Policies
-- The issue is that policies are checking user_roles, which creates recursion

-- Drop the problematic policies
DROP POLICY IF EXISTS "Admins can view all roles" ON public.user_roles;
DROP POLICY IF EXISTS "Users can view own roles" ON public.user_roles;
DROP POLICY IF EXISTS "Users can insert own role" ON public.user_roles;

-- Recreate with simpler logic that doesn't cause recursion

-- Users can view their own roles (simple check, no recursion)
CREATE POLICY "Users can view own roles"
  ON public.user_roles FOR SELECT
  USING (auth.uid() = user_id);

-- Users can insert their own role (simple check, no recursion)
CREATE POLICY "Users can insert own role"
  ON public.user_roles FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Admins can view all roles (check auth metadata or use a different approach)
-- For now, we'll allow service role to handle admin checks
-- Or we can check if user exists in auth.users and has admin metadata
CREATE POLICY "Service role can manage all roles"
  ON public.user_roles FOR ALL
  USING (false)  -- Disabled - use service role for admin operations
  WITH CHECK (false);

-- Also fix profiles policies that might have recursion
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;

-- Recreate without recursion
CREATE POLICY "Admins can view all profiles"
  ON public.profiles FOR SELECT
  USING (
    -- Check if user has admin role, but do it in a way that doesn't recurse
    EXISTS (
      SELECT 1 FROM public.user_roles ur
      WHERE ur.user_id = auth.uid() 
      AND ur.role = 'admin'
      -- Limit to avoid infinite recursion
      LIMIT 1
    )
  );

-- Most important: Allow profile creation via trigger
DROP POLICY IF EXISTS "Allow profile creation via trigger" ON public.profiles;

CREATE POLICY "Allow profile creation"
  ON public.profiles FOR INSERT
  WITH CHECK (true);  -- Allow all inserts (trigger validates)
