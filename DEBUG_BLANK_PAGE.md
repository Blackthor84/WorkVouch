# Debugging Blank White Page

## Step 1: Check Browser Console

1. Open your browser (http://localhost:3000)
2. Press **F12** to open Developer Tools
3. Click the **Console** tab
4. Look for any red error messages
5. Copy/paste the errors here

## Step 2: Check Terminal Output

Look at your terminal where `npm run dev` is running. Do you see:
- ✅ "Compiled successfully" 
- ❌ Any error messages?

## Common Causes:

### 1. Missing Database Schema
- Error about tables not existing
- **Fix:** Run `supabase/schema.sql` in Supabase SQL Editor

### 2. Environment Variables
- Error about Supabase URL/key
- **Fix:** Check `.env.local` file format

### 3. Build Errors
- TypeScript/compilation errors
- **Fix:** Check terminal output

## Quick Checks:

1. **Terminal shows errors?** → Share the error message
2. **Browser console shows errors?** → Share the error message
3. **Network tab shows failed requests?** → Check for 404s or 500s
