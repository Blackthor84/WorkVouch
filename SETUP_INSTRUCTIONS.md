# Step-by-Step Setup Instructions

## Step 1: Install Dependencies with npm install

### Prerequisites Check
- ✅ Node.js must be installed (download from https://nodejs.org/)
- ✅ Open terminal/command prompt in the project directory

### Commands to Run:
```bash
# Navigate to project directory (if not already there)
cd C:\Users\ajaye\.cursor

# Install all dependencies
npm install
```

**What this does:**
- Downloads and installs all packages listed in `package.json`
- Creates `node_modules` folder with all dependencies
- Takes a few minutes to complete

**Expected output:**
- Progress bars showing package downloads
- "added X packages" message when complete

---

## Step 2: Set Up Supabase Project and Add Environment Variables

### Part A: Create Supabase Project

1. **Go to Supabase**
   - Visit: https://supabase.com
   - Sign up or log in

2. **Create New Project**
   - Click "New Project"
   - Choose organization
   - Enter project name (e.g., "peercv")
   - Enter database password (save this!)
   - Choose region closest to you
   - Click "Create new project"
   - Wait 2-3 minutes for setup

3. **Get Your Credentials**
   - Go to **Settings** → **API**
   - Find these values:
     - **Project URL** (looks like: `https://xxxxx.supabase.co`)
     - **anon/public key** (long string starting with `eyJ...`)

### Part B: Create Environment File

1. **Create `.env.local` file** in project root (`C:\Users\ajaye\.cursor\.env.local`)

2. **Add these lines** (replace with your actual values):
```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
```

**Example:**
```env
NEXT_PUBLIC_SUPABASE_URL=https://abcdefghijklmnop.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFiY2RlZmdoaWprbG1ub3AiLCJyb2xlIjoiYW5vbiIsImlhdCI6MTY0NTIzNDU2NywiZXhwIjoxOTYwODEwNTY3fQ.xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

**Important:**
- File must be named exactly `.env.local`
- No spaces around the `=` sign
- Don't commit this file to git (it's in .gitignore)

---

## Step 3: Run the SQL Schema in Supabase SQL Editor

### Steps:

1. **Open Supabase Dashboard**
   - Go to your project dashboard
   - Click on **SQL Editor** in the left sidebar

2. **Open the Schema File**
   - In your project, open: `supabase/schema.sql`
   - Select all content (Ctrl+A)
   - Copy it (Ctrl+C)

3. **Paste and Run in Supabase**
   - In Supabase SQL Editor, click **New Query**
   - Paste the entire schema (Ctrl+V)
   - Click **Run** button (or press Ctrl+Enter)
   - Wait for execution to complete

4. **Verify Success**
   - You should see "Success. No rows returned"
   - Check **Table Editor** in sidebar - you should see tables:
     - profiles
     - user_roles
     - jobs
     - connections
     - references
     - trust_scores

**What this does:**
- Creates all database tables
- Sets up indexes for performance
- Configures Row Level Security (RLS) policies
- Creates triggers for trust score calculation
- Sets up automatic profile creation on signup

---

## Step 4: Start Development Server with npm run dev

### Commands to Run:
```bash
# Make sure you're in the project directory
cd C:\Users\ajaye\.cursor

# Start the development server
npm run dev
```

**What this does:**
- Starts Next.js development server
- Compiles TypeScript
- Watches for file changes
- Serves the app on http://localhost:3000

**Expected output:**
```
▲ Next.js 14.0.4
- Local:        http://localhost:3000
- ready started server on 0.0.0.0:3000
```

### View Your App:
1. Open browser
2. Go to: **http://localhost:3000**
3. You should see the PeerCV landing page!

**To stop the server:**
- Press `Ctrl+C` in the terminal

---

## Quick Checklist

- [ ] Node.js installed
- [ ] `npm install` completed successfully
- [ ] Supabase project created
- [ ] `.env.local` file created with credentials
- [ ] SQL schema executed in Supabase
- [ ] `npm run dev` running
- [ ] Browser opened to http://localhost:3000

---

## Troubleshooting

### "npm is not recognized"
- Install Node.js from https://nodejs.org/
- Restart terminal after installation

### "Cannot find module" errors
- Run `npm install` again
- Delete `node_modules` folder and `package-lock.json`, then run `npm install`

### Database connection errors
- Verify `.env.local` file exists and has correct values
- Check Supabase project is active (not paused)
- Ensure SQL schema was run successfully

### Port 3000 already in use
- Use different port: `npm run dev -- -p 3001`
- Or stop other process using port 3000

---

## Next Steps After Setup

1. **Sign up** a test user account
2. **Create admin user** (optional):
   - Get user ID from Supabase Auth dashboard
   - Run in SQL Editor:
   ```sql
   INSERT INTO public.user_roles (user_id, role) 
   VALUES ('your-user-id-here', 'admin');
   ```
3. **Add employer role** (optional):
   ```sql
   INSERT INTO public.user_roles (user_id, role) 
   VALUES ('your-user-id-here', 'employer');
   ```



