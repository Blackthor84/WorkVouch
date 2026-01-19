-- ============================================================================
-- DIAGNOSE SIGNUP ERROR
-- ============================================================================
-- Run this to check what's wrong with signup
-- ============================================================================

-- Check 1: Does role column exist?
SELECT 
  CASE 
    WHEN EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_schema = 'public' 
      AND table_name = 'profiles' 
      AND column_name = 'role'
    ) THEN '✅ Role column EXISTS'
    ELSE '❌ Role column DOES NOT EXIST - Run QUICK_ADD_ROLE_COLUMN.sql'
  END AS role_column_status;

-- Check 2: What columns does profiles table have?
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_schema = 'public' 
AND table_name = 'profiles'
ORDER BY ordinal_position;

-- Check 3: What is the current trigger function?
SELECT 
  CASE 
    WHEN EXISTS (
      SELECT 1 FROM pg_proc WHERE proname = 'handle_new_user'
    ) THEN '✅ Trigger function EXISTS'
    ELSE '❌ Trigger function DOES NOT EXIST'
  END AS trigger_function_status;

-- Check 4: What is the current trigger?
SELECT 
  CASE 
    WHEN EXISTS (
      SELECT 1 FROM pg_trigger WHERE tgname = 'on_auth_user_created'
    ) THEN '✅ Trigger EXISTS'
    ELSE '❌ Trigger DOES NOT EXIST'
  END AS trigger_status;

-- Check 5: What roles are in the user_role enum?
SELECT unnest(enum_range(NULL::user_role)) AS valid_roles;

-- Check 6: What constraints exist on profiles.role?
SELECT 
  conname AS constraint_name,
  contype AS constraint_type,
  pg_get_constraintdef(oid) AS constraint_definition
FROM pg_constraint
WHERE conrelid = 'public.profiles'::regclass
AND conname LIKE '%role%';
