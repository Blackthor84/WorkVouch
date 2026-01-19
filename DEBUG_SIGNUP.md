# Debug Signup "Failed to Fetch" Error

## Step 1: Check Browser Console

1. Open http://localhost:3000/auth/signup
2. Press **F12** to open Developer Tools
3. Go to **Console** tab
4. Try to sign up
5. **Copy the exact error message** you see

## Step 2: Check Network Tab

1. In Developer Tools, go to **Network** tab
2. Try to sign up
3. Look for failed requests (red)
4. Click on the failed request
5. Check the **Response** tab for error details

## Step 3: Verify in Supabase

1. Go to Supabase → **Authentication** → **Users**
2. Check if a user was created (even if signup "failed")
3. Go to **Table Editor** → **profiles**
4. Check if a profile was created

## Common Issues:

### Issue 1: Profile Trigger Not Working
- User created in auth.users but no profile
- **Fix:** Check if trigger exists in Supabase

### Issue 2: RLS Policy Still Blocking
- Policy might not have been created
- **Fix:** Verify policy exists in Supabase

### Issue 3: Email Confirmation Required
- Supabase might require email confirmation
- **Fix:** Disable email confirmation in Supabase settings
