# Quick Start Guide - View Your App

## Prerequisites

1. **Install Node.js** (if not already installed)
   - Download from: https://nodejs.org/
   - Choose the LTS version
   - Install and restart your terminal/IDE

2. **Set up Supabase** (if not already done)
   - Create account at: https://supabase.com
   - Create a new project
   - Get your project URL and anon key from Settings > API

## Setup Steps

### 1. Install Dependencies

```bash
npm install
```

### 2. Create Environment File

Create a file named `.env.local` in the project root with:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

Replace with your actual Supabase values.

### 3. Set Up Database

1. Open your Supabase project dashboard
2. Go to **SQL Editor**
3. Open the file `supabase/schema.sql` from this project
4. Copy the entire contents
5. Paste into Supabase SQL Editor
6. Click **Run** to execute

### 4. Start Development Server

```bash
npm run dev
```

### 5. View the App

Open your browser and go to:
```
http://localhost:3000
```

## First Steps After Launching

1. **Sign Up**: Create your first user account
2. **Create Admin** (optional): 
   - Note your user ID from Supabase Auth dashboard
   - Run this SQL in Supabase:
   ```sql
   INSERT INTO public.user_roles (user_id, role) 
   VALUES ('your-user-id-here', 'admin');
   ```

## Troubleshooting

- **"npm not recognized"**: Install Node.js and restart terminal
- **Port 3000 in use**: Change port with `npm run dev -- -p 3001`
- **Database errors**: Make sure you ran the schema.sql file
- **Auth errors**: Verify your Supabase URL and key in `.env.local`




