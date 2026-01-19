# WorkVouch Complete Rebuild - Setup Guide

This document provides setup instructions for the completely rebuilt WorkVouch application.

## 🚀 Quick Start

### 1. Install Dependencies

```bash
npm install
```

### 2. Set Up Database

#### Option A: Neon (Recommended)
1. Create a Neon account at https://neon.tech
2. Create a new project
3. Copy the connection string
4. Add to `.env.local`:
   ```env
   DATABASE_URL="postgresql://user:password@host/database?sslmode=require"
   ```

#### Option B: Local PostgreSQL
1. Install PostgreSQL locally
2. Create a database:
   ```sql
   CREATE DATABASE workvouch;
   ```
3. Add to `.env.local`:
   ```env
   DATABASE_URL="postgresql://user:password@localhost:5432/workvouch"
   ```

### 3. Set Up Environment Variables

Create `.env.local` with:

```env
# Database
DATABASE_URL="your_postgres_connection_string"

# NextAuth
NEXTAUTH_SECRET="generate_a_random_secret_here"
NEXTAUTH_URL="http://localhost:3000"

# Stripe (for employer subscriptions)
STRIPE_SECRET_KEY="sk_test_..."
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY="pk_test_..."
STRIPE_WEBHOOK_SECRET="whsec_..."

# UploadThing (for document uploads)
UPLOADTHING_SECRET="sk_live_..."
UPLOADTHING_APP_ID="your_app_id"
```

Generate `NEXTAUTH_SECRET`:
```bash
openssl rand -base64 32
```

### 4. Initialize Database

```bash
# Generate Prisma Client
npm run db:generate

# Push schema to database
npm run db:push

# Or run migrations
npm run db:migrate
```

### 5. Create Superadmin

```bash
npm run create-superadmin
```

Follow the prompts to create your first admin account.

### 6. Run Development Server

```bash
npm run dev
```

Visit http://localhost:3000

## 📁 Project Structure

```
├── app/
│   ├── api/
│   │   ├── auth/              # NextAuth routes
│   │   ├── user/              # User API routes
│   │   ├── employer/          # Employer API routes
│   │   ├── admin/             # Admin API routes
│   │   └── stripe/            # Stripe webhooks
│   ├── auth/                  # Auth pages (signin, signup)
│   ├── dashboard/             # User dashboard
│   ├── employer/              # Employer dashboard
│   └── admin/                 # Admin dashboard
├── components/                # React components
├── lib/                       # Utilities
│   ├── prisma.ts             # Prisma client
│   ├── auth.ts               # Auth utilities
│   ├── auth-config.ts        # NextAuth config
│   └── middleware/           # Middleware utilities
├── prisma/
│   └── schema.prisma         # Database schema
└── scripts/
    └── create-superadmin.ts  # Admin creation script
```

## 🔑 Key Features

### User Features
- Sign up / Sign in
- Add job history
- Toggle visibility to employers
- Request verification
- Upload documents for disputes
- View coworker references

### Employer Features (Paid)
- **Free Tier**: No access
- **Basic ($49/mo)**: View employees, search roster, request verification
- **Pro ($99/mo)**: All Basic + file disputes, priority reviews

### Admin Features
- View disputes queue
- Review verification requests
- Approve/reject verifications
- Resolve disputes

## 🔒 Privacy & Security

### Employee Privacy
- Jobs are **hidden by default** (`isVisibleToEmployer = false`)
- Employers can only see jobs if:
  - User makes job visible, OR
  - User requests verification, OR
  - Employer searches manually (paid feature)
- **No job search activity tracking**
- **No login history visible to employers**
- **Employers never see employee documents**

### Dispute System
1. Employer files dispute (Pro plan only)
2. Job status → "disputed"
3. Employee receives notification
4. Employee uploads documents (pay stub, W2, etc.)
5. Admin reviews documents
6. Admin approves/rejects
7. Employers **never see documents**

## 💳 Stripe Integration

### Set Up Products

Create these products in Stripe Dashboard:

1. **Employer Basic** - $49/month (recurring)
2. **Employer Pro** - $99/month (recurring)

### Webhook Setup

1. In Stripe Dashboard → Webhooks
2. Add endpoint: `https://your-domain.com/api/stripe/webhook`
3. Select events:
   - `checkout.session.completed`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
4. Copy webhook secret to `.env.local`

## 📝 API Routes

### User Routes
- `POST /api/auth/signup` - Sign up (user or employer)
- `POST /api/auth/login` - Login (via NextAuth)
- `GET /api/user/me` - Get current user
- `POST /api/user/add-job` - Add job history
- `POST /api/user/edit-job` - Edit job history
- `POST /api/user/set-visibility` - Toggle visibility
- `POST /api/user/request-verification` - Request verification

### Employer Routes
- `GET /api/employer/me` - Get current employer
- `GET /api/employer/search-employees?name=...` - Search employees
- `GET /api/employer/view-job-history?jobHistoryId=...` - View job history
- `POST /api/employer/file-dispute` - File dispute (Pro only)
- `POST /api/employer/request-verification` - Request verification

### Admin Routes
- `GET /api/admin/disputes` - Get disputes
- `POST /api/admin/resolve-dispute` - Resolve dispute
- `POST /api/admin/approve-verification` - Approve verification
- `POST /api/admin/reject-verification` - Reject verification

## 🧪 Testing

### Test Cards (Stripe Test Mode)
- Success: `4242 4242 4242 4242`
- Decline: `4000 0000 0000 0002`

### Test Flow
1. Create user account
2. Add job history
3. Create employer account
4. Subscribe to Basic or Pro plan
5. Search for employees
6. File dispute (Pro only)
7. Upload documents as user
8. Review as admin

## 🐛 Troubleshooting

### Database Connection Issues
- Verify `DATABASE_URL` is correct
- Check database is running
- Ensure SSL mode is correct for Neon

### NextAuth Issues
- Verify `NEXTAUTH_SECRET` is set
- Check `NEXTAUTH_URL` matches your domain
- Clear browser cookies if session issues

### Stripe Issues
- Verify API keys are correct
- Check webhook secret matches
- Ensure webhook endpoint is accessible

## 📚 Next Steps

1. Set up UploadThing for document uploads
2. Customize UI with ShadCN components
3. Add email notifications
4. Set up production deployment
5. Configure Stripe live mode

## 🆘 Support

For issues or questions, check:
- Prisma docs: https://www.prisma.io/docs
- NextAuth docs: https://next-auth.js.org
- Stripe docs: https://stripe.com/docs
