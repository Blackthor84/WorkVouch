# How to Create an Admin User

## Step 1: Sign Up a Regular User

1. Go to http://localhost:3000
2. Click **"Sign Up"** or go to http://localhost:3000/auth/signup
3. Fill in:
   - Full Name
   - Email
   - Password
4. Click **"Sign Up"**
5. You'll be automatically logged in

## Step 2: Get Your User ID

1. Go to your Supabase dashboard
2. Navigate to: **Authentication** → **Users**
3. Find the user you just created (by email)
4. Copy the **User ID** (it's a UUID like: `123e4567-e89b-12d3-a456-426614174000`)

## Step 3: Add Admin Role

1. In Supabase dashboard, go to **SQL Editor**
2. Click **New Query**
3. Paste this SQL (replace `YOUR_USER_ID` with the actual UUID):

```sql
INSERT INTO public.user_roles (user_id, role) 
VALUES ('YOUR_USER_ID_HERE', 'admin');
```

4. Click **Run**

## Step 4: Verify Admin Access

1. Sign out of the app (if logged in)
2. Sign back in with your account
3. You should now see an **"Admin"** link in the navbar
4. Go to http://localhost:3000/admin to access the admin panel

---

## Quick SQL Command Template

Replace `YOUR_USER_ID_HERE` with your actual user ID:

```sql
INSERT INTO public.user_roles (user_id, role) 
VALUES ('YOUR_USER_ID_HERE', 'admin');
```

---

## Alternative: Add Multiple Roles

You can also add the employer role:

```sql
INSERT INTO public.user_roles (user_id, role) 
VALUES ('YOUR_USER_ID_HERE', 'employer');
```

Or add both at once:

```sql
INSERT INTO public.user_roles (user_id, role) VALUES 
('YOUR_USER_ID_HERE', 'admin'),
('YOUR_USER_ID_HERE', 'employer');
```

---

## Troubleshooting

**"User not found" error:**
- Make sure you copied the entire UUID
- Check that the user exists in Authentication → Users

**"Role already exists" error:**
- The user already has that role
- You can check existing roles in the `user_roles` table

**Admin link not showing:**
- Sign out and sign back in
- Clear browser cache
- Check that the SQL ran successfully
