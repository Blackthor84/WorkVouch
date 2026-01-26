# Required Environment Variables

This document lists all required environment variables for the WorkVouch application.

## Supabase Configuration

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
```

## Stripe Configuration

```env
STRIPE_SECRET_KEY=sk_test_... (or sk_live_... for production)
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_... (or pk_live_... for production)
STRIPE_WEBHOOK_SECRET=whsec_... (for webhook verification)
```

### Stripe Price IDs (Optional - for pricing page)

```env
# Employee Plans
STRIPE_PRICE_PRO_WORKER=price_...
STRIPE_PRICE_TRUST_BOOST=price_...

# Employer Plans
STRIPE_PRICE_STARTER=price_...
STRIPE_PRICE_TEAM=price_...
STRIPE_PRICE_PRO=price_...
STRIPE_PRICE_ENTERPRISE=price_...
STRIPE_PRICE_PAY_PER_USE=price_...
STRIPE_PRICE_SECURITY_BUNDLE=price_...

# Legacy/Alternative Names
STRIPE_PRICE_BASIC=price_... (can be used as fallback for STARTER)
```

## NextAuth Configuration

```env
NEXTAUTH_URL=https://yourdomain.com (or http://localhost:3000 for local)
NEXTAUTH_SECRET=your_secret_key_here
```

### Generate NEXTAUTH_SECRET

Run this command to generate a secure secret:

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

## Application URL

```env
NEXT_PUBLIC_URL=https://yourdomain.com (or http://localhost:3000 for local)
```

## Optional Services

### SendGrid (Email)

```env
SENDGRID_API_KEY=SG....
```

### OpenAI (AI Features)

```env
OPENAI_API_KEY=sk-...
```

## Setup Instructions

1. Copy `.env.local.example` to `.env.local` (if it exists)
2. Fill in all required variables
3. For production, set these in Vercel Environment Variables:
   - Go to your Vercel project settings
   - Navigate to "Environment Variables"
   - Add each variable with the appropriate value
   - Make sure to set them for "Production", "Preview", and "Development" as needed

## Verification

After setting up environment variables:

1. Restart your development server: `npm run dev`
2. Check that the app loads without errors
3. Test authentication (sign in/sign up)
4. Test Stripe checkout (use test mode)
5. Verify Supabase connection

## Security Notes

- **Never commit `.env.local` to git** - it's already in `.gitignore`
- Use different keys for development and production
- Rotate secrets regularly
- Use Stripe test keys during development
- Keep `SUPABASE_SERVICE_ROLE_KEY` secret - it has admin access
