-- VERIFY FIX - Run this to check if everything is set up correctly

-- Check 1: Do profiles exist?
SELECT 
  'Profiles' as table_name,
  COUNT(*) as count,
  STRING_AGG(email, ', ') as emails
FROM public.profiles;

-- Check 2: Do user_roles exist?
SELECT 
  'User Roles' as table_name,
  COUNT(*) as count,
  STRING_AGG(user_id::text, ', ') as user_ids
FROM public.user_roles;

-- Check 3: What policies exist?
SELECT 
  tablename,
  policyname,
  cmd as operation
FROM pg_policies 
WHERE schemaname = 'public' 
  AND (tablename = 'profiles' OR tablename = 'user_roles')
ORDER BY tablename, policyname;

-- Check 4: Does trigger exist?
SELECT 
  tgname as trigger_name,
  tgrelid::regclass as table_name
FROM pg_trigger 
WHERE tgname = 'on_auth_user_created';

-- Check 5: Does function exist?
SELECT 
  proname as function_name,
  prosecdef as is_security_definer
FROM pg_proc 
WHERE proname = 'handle_new_user';

-- If any of these return 0 or empty, run COMPLETE_FIX.sql again
