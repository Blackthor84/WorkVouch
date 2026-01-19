# Disable Email Confirmation for Development

## Quick Fix

1. Go to **Supabase Dashboard**
2. Click **Authentication** (left sidebar)
3. Click **Settings** (under Authentication)
4. Scroll down to **Email Auth**
5. Find **"Enable email confirmations"**
6. **Turn it OFF** (toggle switch)
7. Click **Save**

## What This Does

- Users can sign up and immediately sign in
- No email confirmation required
- Perfect for development/testing

## ⚠️ Important

**Only disable this in development!** In production, you should:
- Keep email confirmation enabled
- Set up proper email templates
- Use a real email service (not Supabase's default)

## Alternative: Confirm Email Manually

If you want to keep email confirmation enabled but manually confirm users:

1. Go to **Supabase Dashboard** → **Authentication** → **Users**
2. Find the user you just created
3. Click on the user
4. Click **"Confirm Email"** button

---

**Go to Supabase Dashboard → Authentication → Settings → Turn OFF "Enable email confirmations"**
