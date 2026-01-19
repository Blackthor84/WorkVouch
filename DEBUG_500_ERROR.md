# Debug 500 Internal Server Error

## Quick Checks

### 1. Check Terminal Output

Look at the terminal where `npm run dev` is running. You should see error messages there that explain the 500 error.

**Share the error message from the terminal.**

### 2. Common Causes

#### A. Missing Database Column
If you haven't run `QUICK_ADD_ROLE_COLUMN.sql` yet, the `role` column doesn't exist in the `profiles` table, causing queries to fail.

**Fix:** Run `QUICK_ADD_ROLE_COLUMN.sql` in Supabase SQL Editor.

#### B. Database Connection Error
Supabase connection might be failing.

**Fix:** Check `.env.local` file has correct credentials.

#### C. RLS Policy Error
Row Level Security policies might be blocking queries.

**Fix:** Make sure you've run all the SQL migrations.

### 3. Check Browser Console

1. Open browser DevTools (F12)
2. Go to **Console** tab
3. Look for any error messages
4. Share the error messages

### 4. Check Network Tab

1. Open browser DevTools (F12)
2. Go to **Network** tab
3. Find the failed request (red)
4. Click on it
5. Check the **Response** tab for error details

## Most Likely Issue

If you haven't run `QUICK_ADD_ROLE_COLUMN.sql` yet, that's probably the issue. The code is trying to query a `role` column that doesn't exist.

**Quick Fix:**
1. Open Supabase SQL Editor
2. Run `QUICK_ADD_ROLE_COLUMN.sql`
3. Restart dev server

---

**Please share the error message from your terminal!**
