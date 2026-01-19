# Fix "Failed to Fetch" Error

## Most Common Cause: Database Schema Not Run

The "failed to fetch" error usually means the database tables don't exist yet.

## Solution: Run the Database Schema

### Step 1: Open Supabase SQL Editor

1. Go to your Supabase dashboard
2. Click **SQL Editor** in the left sidebar
3. Click **New Query**

### Step 2: Run the Schema

1. Open the file `supabase/schema.sql` from your project
2. **Select ALL** the content (Ctrl+A)
3. **Copy** it (Ctrl+C)
4. **Paste** into Supabase SQL Editor (Ctrl+V)
5. Click **Run** button (or press Ctrl+Enter)

### Step 3: Wait for Success

- You should see "Success" message
- May take 10-30 seconds to complete
- Check for any error messages

### Step 4: Verify Tables Were Created

1. In Supabase dashboard, click **Table Editor**
2. You should see these tables:
   - ✅ profiles
   - ✅ user_roles
   - ✅ jobs
   - ✅ connections
   - ✅ references
   - ✅ trust_scores

### Step 5: Refresh Your App

1. Go back to http://localhost:3000
2. Refresh the page (Ctrl+Shift+R)
3. Try signing up again

---

## Other Possible Causes

### 1. RLS Policies Blocking Access
- Make sure you ran the FULL schema.sql
- It includes all RLS policies

### 2. Network Issues
- Check your internet connection
- Verify Supabase project is active (not paused)

### 3. Wrong Environment Variables
- Double-check `.env.local` file
- Make sure URL and key are correct
- Restart dev server after changing `.env.local`

---

## Quick Checklist

- [ ] Ran `supabase/schema.sql` in Supabase SQL Editor
- [ ] Saw "Success" message after running SQL
- [ ] Tables appear in Table Editor
- [ ] `.env.local` file has correct credentials
- [ ] Restarted dev server (`npm run dev`)
- [ ] Refreshed browser

---

## Still Not Working?

Check browser console (F12) for specific error messages and share them.
