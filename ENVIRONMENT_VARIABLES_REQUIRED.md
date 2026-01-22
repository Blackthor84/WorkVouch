# WorkVouch Environment Variables Reference

This document lists all environment variables that the WorkVouch application expects. **Do not store actual values in this file.**

## Required Environment Variables

### Supabase Configuration
- `NEXT_PUBLIC_SUPABASE_URL` - Your Supabase project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Supabase anonymous/public key (safe for client-side)
- `SUPABASE_SERVICE_ROLE_KEY` - Supabase service role key (server-side only, keep secret!)

### Stripe Configuration (Required for payments/subscriptions)
- `STRIPE_SECRET_KEY` - Stripe secret API key (server-side only)
- `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` - Stripe publishable key (safe for client-side)
- `STRIPE_WEBHOOK_SECRET` - Stripe webhook signing secret
- `STRIPE_PRICE_BASIC` - Stripe price ID for Basic plan (optional)
- `STRIPE_PRICE_PRO` - Stripe price ID for Pro plan (optional)
- `STRIPE_PRICE_ENTERPRISE` - Stripe price ID for Enterprise plan (optional)

### SendGrid Configuration (Required for email)
- `SENDGRID_API_KEY` - SendGrid API key for sending emails

### OpenAI Configuration (Required for resume parsing)
- `OPENAI_API_KEY` - OpenAI API key for resume parsing

### Application URLs
- `NEXT_PUBLIC_URL` - Public application URL (e.g., http://localhost:3000 for dev)
- `NEXT_PUBLIC_APP_URL` - Alternative app URL variable (used for redirects)

## Optional Environment Variables

### NextAuth (If using NextAuth)
- `NEXTAUTH_SECRET` - Secret for NextAuth session encryption
- `NEXTAUTH_URL` - Base URL for NextAuth callbacks

## Security Notes

1. **Never commit `.env.local` to Git** - It's already in `.gitignore`
2. **Never hardcode API keys in source code** - Always use `process.env.VARIABLE_NAME`
3. **Service role keys are secret** - Only use on server-side, never expose to client
4. **Public keys are safe** - Variables prefixed with `NEXT_PUBLIC_` are exposed to the browser

## Where to Set These

- **Local Development**: Add to `.env.local` in project root
- **Vercel Production**: Set via Vercel Dashboard or CLI (`vercel env add`)
- **Other Platforms**: Use their environment variable configuration

## Verification

The application will throw errors at runtime if required environment variables are missing. Check your `.env.local` file to ensure all required variables are set.
