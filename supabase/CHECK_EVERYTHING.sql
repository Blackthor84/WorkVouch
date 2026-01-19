-- ============================================================================
-- CHECK EVERYTHING - COMPREHENSIVE DIAGNOSTIC
-- ============================================================================
-- Run this to see what's wrong with your database setup
-- ============================================================================

-- Check 1: Does profiles table exist?
SELECT 
  CASE 
    WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'profiles')
    THEN '✅ profiles table EXISTS'
    ELSE '❌ profiles table DOES NOT EXIST - Run schema.sql'
  END AS profiles_table_status;

-- Check 2: What columns does profiles table have?
SELECT 
  'Profiles table columns:' AS info,
  column_name, 
  data_type, 
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_schema = 'public' 
AND table_name = 'profiles'
ORDER BY ordinal_position;

-- Check 3: Does user_roles table exist?
SELECT 
  CASE 
    WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'user_roles')
    THEN '✅ user_roles table EXISTS'
    ELSE '❌ user_roles table DOES NOT EXIST - Run schema.sql'
  END AS user_roles_table_status;

-- Check 4: Does trigger function exist?
SELECT 
  CASE 
    WHEN EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'handle_new_user')
    THEN '✅ handle_new_user function EXISTS'
    ELSE '❌ handle_new_user function DOES NOT EXIST'
  END AS trigger_function_status;

-- Check 5: Does trigger exist?
SELECT 
  CASE 
    WHEN EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'on_auth_user_created')
    THEN '✅ on_auth_user_created trigger EXISTS'
    ELSE '❌ on_auth_user_created trigger DOES NOT EXIST'
  END AS trigger_status;

-- Check 6: What is the current trigger function code?
SELECT 
  'Current trigger function:' AS info,
  pg_get_functiondef(oid) AS function_definition
FROM pg_proc
WHERE proname = 'handle_new_user';

-- Check 7: What roles are in the user_role enum?
SELECT 
  'Valid user_role enum values:' AS info,
  unnest(enum_range(NULL::user_role)) AS valid_roles;

-- Check 8: Does industry_type enum exist?
SELECT 
  CASE 
    WHEN EXISTS (SELECT 1 FROM pg_type WHERE typname = 'industry_type')
    THEN '✅ industry_type enum EXISTS'
    ELSE '❌ industry_type enum DOES NOT EXIST'
  END AS industry_type_status;

-- Check 9: What values are in industry_type enum?
SELECT 
  'Valid industry_type enum values:' AS info,
  unnest(enum_range(NULL::industry_type)) AS valid_industries;

-- Check 10: What RLS policies exist on profiles?
SELECT 
  'RLS policies on profiles:' AS info,
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE tablename = 'profiles';

-- Check 11: Is RLS enabled on profiles?
SELECT 
  CASE 
    WHEN (SELECT relrowsecurity FROM pg_class WHERE relname = 'profiles') = true
    THEN '✅ RLS is ENABLED on profiles'
    ELSE '❌ RLS is DISABLED on profiles'
  END AS rls_status;

-- Check 12: What RLS policies exist on user_roles?
SELECT 
  'RLS policies on user_roles:' AS info,
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE tablename = 'user_roles';
