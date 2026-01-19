# Verify Supabase Project URL

## Step 1: Check Your Supabase Project

1. Go to: https://supabase.com/dashboard
2. Find your project (should show project name and status)
3. Check if project status shows:
   - ✅ **Active** (green) - Good!
   - ⚠️ **Paused** - Need to resume it
   - ❌ **Deleted** - Need to create new project

## Step 2: Get the Correct URL

1. Click on your project
2. Go to **Settings** → **API**
3. Look for **"Project URL"** or **"URL"**
4. Copy the EXACT URL (should be like `https://xxxxx.supabase.co`)

## Step 3: Verify URL Format

The URL should be:
- Starts with `https://`
- Has your project reference ID
- Ends with `.supabase.co`
- Example: `https://abcdefghijklmnop.supabase.co`

## Step 4: Test the URL

Try opening this in your browser:
```
https://sjwxcmtivmhbqqlkrsh.supabase.co
```

If it doesn't load, the project might be:
- Paused
- Deleted
- URL is incorrect

## Step 5: Update .env.local

If the URL is different, update `.env.local`:
1. Open `.env.local` file
2. Update `NEXT_PUBLIC_SUPABASE_URL` with the correct URL
3. Save the file
4. Restart dev server: `npm run dev`
