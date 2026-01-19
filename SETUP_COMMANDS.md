# Setup Commands - Copy & Paste

Here are all the commands you need, ready to copy and paste.

## Step 1: Install Dependencies ✅
```bash
npm install
```
**Status:** ✅ Already done!

---

## Step 2: Set Up Database

### For Neon (Recommended):
1. Go to: https://neon.tech
2. Sign up (free)
3. Create project
4. Copy connection string

### For Local PostgreSQL:
```bash
# Create database (in psql)
CREATE DATABASE workvouch;
```

---

## Step 3: Create .env.local

**Create the file first, then add:**

```env
DATABASE_URL="your_connection_string_here"
NEXTAUTH_SECRET="generate_this_below"
NEXTAUTH_URL="http://localhost:3000"
```

**Generate NEXTAUTH_SECRET:**

**Windows PowerShell:**
```powershell
[Convert]::ToBase64String([System.Text.Encoding]::UTF8.GetBytes([System.Guid]::NewGuid().ToString() + [System.Guid]::NewGuid().ToString()))
```

**Mac/Linux:**
```bash
openssl rand -base64 32
```

Copy the output and paste it as `NEXTAUTH_SECRET` in `.env.local`

---

## Step 4: Initialize Database

```bash
# Generate Prisma client
npm run db:generate

# Create tables in database
npm run db:push
```

---

## Step 5: Create Superadmin

```bash
npm run create-superadmin
```

Then follow the prompts:
- Enter your email
- Enter a password (at least 8 characters)
- Confirm password

---

## Step 6: Start Development Server

```bash
npm run dev
```

Then open: http://localhost:3000

---

## Optional: View Database

```bash
npm run db:studio
```

Opens at: http://localhost:5555

---

## Troubleshooting Commands

```bash
# If dependencies are broken
rm -rf node_modules package-lock.json
npm install

# If Prisma is broken
npm run db:generate

# Check Node version
node --version
```
