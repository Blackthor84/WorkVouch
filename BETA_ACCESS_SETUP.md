# Beta Access System Setup Guide

## Overview

The beta access system allows admins to grant temporary preview access to users without requiring subscriptions. Beta users can explore the site but cannot access pricing or checkout pages.

## Features

- ✅ One-click login links (no password required)
- ✅ Automatic expiration (configurable, default 7 days)
- ✅ Access restrictions (no pricing/checkout access)
- ✅ Admin panel for easy management
- ✅ Preview-only page for beta users

## Database Setup

### 1. Run SQL Migration

Execute the SQL migration in Supabase SQL Editor:

```sql
-- File: supabase/create_beta_access.sql
```

This will:
- Add `beta_expiration` and `login_token` fields to `profiles` table
- Create indexes for performance
- Add RLS policies for security
- Create helper functions

### 2. Verify Beta Role Support

The `beta` role should be supported in your `user_roles` table. If not, add it:

```sql
-- Beta role is automatically added when creating beta users
-- No manual setup needed
```

## Admin Panel Usage

### Creating Beta Access

1. Go to `/admin/beta` (or click "Beta Access Manager" in admin panel)
2. Enter the beta user's email
3. Set expiration days (default: 7 days)
4. Click "Create Beta Access"
5. Copy the generated login URL
6. Share the URL with the beta user

### Login URL Format

```
https://your-site.com/beta-login?token=LOGIN_TOKEN
```

## Beta User Experience

### Login Flow

1. Beta user clicks the login URL
2. System validates the token
3. User is automatically logged in
4. Redirected to `/preview-only` page

### Access Restrictions

Beta users are automatically restricted from:
- `/pricing` page (redirected to `/preview-only`)
- `/api/pricing/checkout` (blocked)
- `/api/stripe/*` (blocked)
- Subscribe buttons (hidden on pricing page)

### Preview-Only Page

Beta users see:
- Welcome message explaining preview access
- List of available features
- Limitations notice
- CTA to sign up for full access
- Career pages and browsing features

## API Endpoints

### Create Beta Access
```
POST /api/admin/create-beta-access
Body: { email: string, expirationDays: number }
Auth: Admin only
```

### Authenticate Beta Token
```
POST /api/beta/authenticate
Body: { token: string }
Returns: { userId, email, role }
```

### Create Beta Session
```
POST /api/beta/create-session
Body: { userId: string, email: string }
Returns: { success: true }
```

## Middleware Configuration

The middleware (`middleware.ts`) automatically:
- Detects beta users from session
- Redirects them away from pricing/checkout
- Allows access to preview-only and browsing features

## NextAuth Integration

Beta role is handled in NextAuth:
- Beta users get `role: "beta"` in session
- Roles array includes `"beta"`
- JWT token includes beta role
- Session callbacks preserve beta status

## Environment Variables

No additional environment variables needed. Uses existing:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `NEXTAUTH_SECRET`

## Testing

### Test Beta Access Creation

1. Log in as admin
2. Go to `/admin/beta`
3. Create beta access for a test email
4. Copy the login URL
5. Open in incognito/private window
6. Verify automatic login works
7. Verify redirect to `/preview-only`
8. Try accessing `/pricing` - should redirect
9. Verify subscribe buttons are hidden

### Test Expiration

1. Create beta access with 1 day expiration
2. Wait or manually set expiration in database
3. Try to login - should show expired message

## Troubleshooting

### "Invalid or expired login token"
- Token may have been used already (one-time use)
- Token may be expired
- Check database for correct token

### "Beta access has expired"
- Check `beta_expiration` in profiles table
- Update expiration date if needed

### "User does not have beta access"
- Verify user has `beta` role in `user_roles` table
- Check that role was created during beta access creation

### Login not working
- Check NextAuth session configuration
- Verify middleware is running
- Check browser console for errors

## Security Notes

- Login tokens are one-time use (consider implementing token invalidation)
- Beta users cannot access payment features
- Expiration is enforced at multiple levels
- RLS policies protect beta user data
- Admin-only access to beta creation

## Future Enhancements

- [ ] Email integration for sending login links
- [ ] Token invalidation after use
- [ ] Beta user management dashboard
- [ ] Analytics for beta user activity
- [ ] Automatic expiration notifications
