# How to Get Your Supabase Credentials

## Step 1: Create Supabase Account (if you don't have one)

1. Go to: https://supabase.com
2. Click "Start your project" or "Sign up"
3. Sign up with GitHub, Google, or email

## Step 2: Create a New Project

1. In Supabase dashboard, click **"New Project"**
2. Fill in:
   - **Name**: peercv (or any name you like)
   - **Database Password**: Create a strong password (save this!)
   - **Region**: Choose closest to you
3. Click **"Create new project"**
4. Wait 2-3 minutes for project to be created

## Step 3: Get Your Credentials

1. In your Supabase project dashboard, click **Settings** (gear icon in left sidebar)
2. Click **API** in the settings menu
3. You'll see two values you need:

### Project URL
- Look for **"Project URL"** or **"URL"**
- Looks like: `https://abcdefghijklmnop.supabase.co`
- Copy this entire URL

### Anon/Public Key
- Look for **"anon public"** or **"Project API keys"** → **"anon"** or **"public"**
- It's a long string starting with `eyJ...`
- Copy this entire key

## Step 4: Add to .env.local File

1. Open the `.env.local` file in your project
2. Replace the placeholder values:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-actual-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-actual-anon-key-here
```

**Important:**
- No quotes around the values
- No spaces around the `=` sign
- Replace both values with your actual credentials

## Step 5: Restart the Dev Server

After saving `.env.local`:
1. Stop the server (Ctrl+C in terminal)
2. Start it again: `npm run dev`
3. Refresh your browser

## Quick Links

- Supabase Dashboard: https://supabase.com/dashboard
- API Settings: https://supabase.com/dashboard/project/_/settings/api
- Create Project: https://supabase.com/dashboard/new

## Troubleshooting

**"Invalid API key" error:**
- Make sure you copied the entire key (it's very long)
- Check for extra spaces
- Make sure you're using the "anon" key, not the "service_role" key

**"Project not found" error:**
- Verify the URL is correct
- Make sure your project is active (not paused)
