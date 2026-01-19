-- MANUAL PROFILE CREATION - Run this for your specific user
-- Replace 'ajayeaglin@gmail.com' with your actual email

-- Get your user ID first
SELECT id, email FROM auth.users WHERE email = 'ajayeaglin@gmail.com';

-- Then create profile (replace USER_ID_HERE with the ID from above)
INSERT INTO public.profiles (id, full_name, email)
VALUES (
  'USER_ID_HERE',  -- Replace with your actual user ID
  'Your Name',      -- Replace with your name
  'ajayeaglin@gmail.com'
)
ON CONFLICT (id) DO UPDATE SET
  full_name = EXCLUDED.full_name,
  email = EXCLUDED.email;

-- Create user role
INSERT INTO public.user_roles (user_id, role)
VALUES (
  'USER_ID_HERE',  -- Replace with your actual user ID
  'user'
)
ON CONFLICT (user_id, role) DO NOTHING;

-- OR: Do it all in one query (easier)
INSERT INTO public.profiles (id, full_name, email)
SELECT 
  id,
  COALESCE(raw_user_meta_data->>'full_name', 'User'),
  email
FROM auth.users
WHERE email = 'ajayeaglin@gmail.com'
ON CONFLICT (id) DO UPDATE SET
  full_name = COALESCE(EXCLUDED.full_name, profiles.full_name),
  email = EXCLUDED.email;

INSERT INTO public.user_roles (user_id, role)
SELECT id, 'user'
FROM auth.users
WHERE email = 'ajayeaglin@gmail.com'
ON CONFLICT (user_id, role) DO NOTHING;
