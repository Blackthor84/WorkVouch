# Step-by-Step Setup Guide for WorkVouch

Follow these steps in order to set up your WorkVouch application.

## Step 1: Install Dependencies

Open your terminal in the project directory and run:

```bash
npm install
```

**What this does:** Installs all required packages (Prisma, NextAuth, Stripe, etc.)

**Expected time:** 2-5 minutes

**If you get errors:**
- Make sure you have Node.js 18+ installed: `node --version`
- Try deleting `node_modules` and `package-lock.json`, then run `npm install` again

---

## Step 2: Set Up Database

You have two options. **I recommend Neon (Option A)** - it's free and easier.

### Option A: Neon (Recommended - Free & Easy)

1. **Create Neon Account**
   - Go to https://neon.tech
   - Click "Sign Up" (you can use GitHub)
   - Create a new project

2. **Get Connection String**
   - After creating project, you'll see a connection string like:
     ```
     postgresql://user:password@ep-xxx.us-east-2.aws.neon.tech/neondb?sslmode=require
     ```
   - Copy this entire string (you'll need it in Step 3)

3. **That's it!** Neon handles everything else.

### Option B: Local PostgreSQL

1. **Install PostgreSQL**
   - Windows: Download from https://www.postgresql.org/download/windows/
   - Mac: `brew install postgresql`
   - Linux: `sudo apt-get install postgresql`

2. **Start PostgreSQL**
   - Windows: Start the PostgreSQL service
   - Mac/Linux: `brew services start postgresql` or `sudo systemctl start postgresql`

3. **Create Database**
   - Open terminal/command prompt
   - Run: `psql -U postgres` (or your PostgreSQL username)
   - Then run:
     ```sql
     CREATE DATABASE workvouch;
     ```
   - Exit: `\q`

4. **Connection String Format**
   ```
   postgresql://username:password@localhost:5432/workvouch
   ```
   - Replace `username` and `password` with your PostgreSQL credentials

---

## Step 3: Configure Environment Variables

1. **Create `.env.local` file**
   - In your project root directory (same folder as `package.json`)
   - Create a new file named `.env.local`
   - **Important:** Don't commit this file to git!

2. **Add Database URL**

   Open `.env.local` and add:

   ```env
   # Database (use your connection string from Step 2)
   DATABASE_URL="postgresql://user:password@host/database?sslmode=require"
   ```

   **For Neon:** Paste the connection string you copied
   
   **For Local:** Use format: `postgresql://username:password@localhost:5432/workvouch`

3. **Generate NextAuth Secret**

   Open your terminal and run:

   **Windows (PowerShell):**
   ```powershell
   [Convert]::ToBase64String([System.Text.Encoding]::UTF8.GetBytes([System.Guid]::NewGuid().ToString() + [System.Guid]::NewGuid().ToString()))
   ```

   **Mac/Linux:**
   ```bash
   openssl rand -base64 32
   ```

   Copy the output (it will be a long random string)

4. **Add All Environment Variables**

   Add these to your `.env.local` file:

   ```env
   # Database
   DATABASE_URL="your_connection_string_here"

   # NextAuth (use the secret you generated)
   NEXTAUTH_SECRET="paste_your_generated_secret_here"
   NEXTAUTH_URL="http://localhost:3000"

   # Stripe (optional for now - you can add later)
   # Get these from https://dashboard.stripe.com → Developers → API keys
   STRIPE_SECRET_KEY="sk_test_..."
   NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY="pk_test_..."
   STRIPE_WEBHOOK_SECRET="whsec_..."
   STRIPE_PRICE_BASIC="price_..."
   STRIPE_PRICE_PRO="price_..."

   # UploadThing (optional for now - you can add later)
   # Get these from https://uploadthing.com
   UPLOADTHING_SECRET="sk_live_..."
   UPLOADTHING_APP_ID="your_app_id"
   ```

   **For now, you can skip Stripe and UploadThing** - add them later when you need those features.

   **Minimum required:**
   - `DATABASE_URL`
   - `NEXTAUTH_SECRET`
   - `NEXTAUTH_URL`

5. **Save the file**

---

## Step 4: Initialize Database

1. **Generate Prisma Client**

   ```bash
   npm run db:generate
   ```

   **What this does:** Creates TypeScript types for your database

   **Expected output:** Should complete without errors

2. **Push Schema to Database**

   ```bash
   npm run db:push
   ```

   **What this does:** Creates all tables in your database

   **Expected output:** 
   ```
   ✔ Generated Prisma Client
   Your database is now in sync with your schema.
   ```

   **If you get errors:**
   - Check your `DATABASE_URL` is correct
   - Make sure database is accessible
   - For Neon: Check the connection string includes `?sslmode=require`

3. **Verify (Optional)**

   You can view your database with:

   ```bash
   npm run db:studio
   ```

   This opens a web interface at http://localhost:5555 where you can see your tables.

---

## Step 5: Create Superadmin

1. **Run the script**

   ```bash
   npm run create-superadmin
   ```

2. **Follow the prompts**

   ```
   === Create WorkVouch Superadmin ===

   Email: your-email@example.com
   Password: (type your password - at least 8 characters)
   Confirm Password: (type again)
   ```

3. **Success message**

   You should see:
   ```
   ✅ Superadmin created successfully!
      Email: your-email@example.com
      Role: superadmin
      ID: xxx-xxx-xxx
   ```

   **Save this email/password** - you'll use it to log in as admin!

---

## Step 6: Test the Setup

1. **Start the development server**

   ```bash
   npm run dev
   ```

2. **Open your browser**

   Go to: http://localhost:3000

3. **What you should see:**
   - The app should load (even if pages are incomplete)
   - No database errors in the terminal
   - No connection errors

4. **Test admin login:**
   - Go to `/auth/signin` (or create that page)
   - Try logging in with your superadmin credentials
   - Select "Admin" as account type

---

## Step 7: Build UI Pages (Next Steps)

The backend is complete! Now you need to build the frontend pages. Here's the order:

### Priority 1: Auth Pages
1. **Update Sign-In Page**
   - File: `app/auth/signin/page.tsx`
   - Use the template: `components/sign-in-form-new.tsx`
   - Update to use NextAuth

2. **Create Sign-Up Page**
   - File: `app/auth/signup/page.tsx`
   - Allow user to choose: User or Employer
   - Call `/api/auth/signup` endpoint

### Priority 2: User Dashboard
1. **User Dashboard**
   - File: `app/dashboard/page.tsx`
   - Show job history list
   - Add job button

2. **Add Job Page**
   - File: `app/jobs/add/page.tsx`
   - Form to add job history
   - Call `/api/user/add-job`

3. **Job List Component**
   - Show all user's jobs
   - Toggle visibility button
   - Request verification button

### Priority 3: Employer Dashboard
1. **Employer Dashboard**
   - File: `app/employer/dashboard/page.tsx`
   - Search employees form
   - Employee list
   - Subscription status

2. **Employee Search**
   - Call `/api/employer/search-employees`
   - Display results

### Priority 4: Admin Dashboard
1. **Admin Dashboard**
   - File: `app/admin/dashboard/page.tsx`
   - Disputes queue
   - Verification requests

---

## Troubleshooting

### "Cannot find module '@prisma/client'"
**Solution:** Run `npm run db:generate` first

### "DATABASE_URL is not set"
**Solution:** Make sure `.env.local` exists and has `DATABASE_URL`

### "Error: P1001: Can't reach database server"
**Solution:** 
- Check your connection string is correct
- For Neon: Make sure it includes `?sslmode=require`
- For local: Make sure PostgreSQL is running

### "NEXTAUTH_SECRET is not set"
**Solution:** Add `NEXTAUTH_SECRET` to `.env.local` (see Step 3)

### "Module not found: tsx"
**Solution:** Run `npm install` again

### Database connection timeout
**Solution:**
- Check your internet connection (for Neon)
- Verify firewall isn't blocking PostgreSQL port (for local)
- Try regenerating connection string (for Neon)

---

## Quick Reference

**Essential Commands:**
```bash
npm install              # Install dependencies
npm run db:generate      # Generate Prisma client
npm run db:push          # Create database tables
npm run create-superadmin # Create admin user
npm run dev              # Start development server
npm run db:studio        # View database in browser
```

**Essential Files:**
- `.env.local` - Environment variables (don't commit!)
- `prisma/schema.prisma` - Database schema
- `package.json` - Dependencies and scripts

**Important URLs:**
- App: http://localhost:3000
- Database Studio: http://localhost:5555 (when running `npm run db:studio`)

---

## What's Next?

Once you complete Steps 1-6, you'll have:
- ✅ Database set up with all tables
- ✅ Admin account created
- ✅ Backend API ready to use
- ✅ Development server running

Then you can start building the UI pages (Step 7)!

Need help? Check:
- `WORKVOUCH_REBUILD_SETUP.md` - Detailed setup guide
- `IMPLEMENTATION_SUMMARY.md` - What's been built
- Prisma docs: https://www.prisma.io/docs
- NextAuth docs: https://next-auth.js.org
