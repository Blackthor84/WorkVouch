# WorkVouch Environment Variables Template

Copy the variables below to your `.env.local` file and fill in your actual values.

**⚠️ DO NOT commit `.env.local` to Git - it contains sensitive keys!**

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=PASTE_YOUR_SUPABASE_URL_HERE
NEXT_PUBLIC_SUPABASE_ANON_KEY=PASTE_YOUR_SUPABASE_ANON_KEY_HERE
SUPABASE_SERVICE_ROLE_KEY=PASTE_YOUR_SUPABASE_SERVICE_ROLE_KEY_HERE

# Stripe
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=PASTE_YOUR_STRIPE_PUBLISHABLE_KEY_HERE
STRIPE_SECRET_KEY=PASTE_YOUR_STRIPE_SECRET_KEY_HERE
STRIPE_WEBHOOK_SECRET=PASTE_YOUR_STRIPE_WEBHOOK_SECRET_HERE

# SendGrid
SENDGRID_API_KEY=PASTE_YOUR_SENDGRID_API_KEY_HERE
SENDGRID_SENDER_EMAIL=PASTE_YOUR_VERIFIED_SENDER_EMAIL_HERE

# OpenAI
OPENAI_API_KEY=PASTE_YOUR_OPENAI_API_KEY_HERE

# Enterprise load simulation (never set in production)
# ENTERPRISE_SIMULATION_MODE=true

# Any other WorkVouch API keys go here
# WORKVOUCH_API_KEY=PASTE_YOUR_CUSTOM_API_KEY_HERE
```

## Instructions

1. Create a file named `.env.local` in the root of your project
2. Copy the template above into `.env.local`
3. Replace each `PASTE_YOUR_...` placeholder with your actual API keys
4. Save the file
5. Restart your dev server: `npm run dev`

## Where to Get Your Keys

- **Supabase**: https://supabase.com/dashboard → Your Project → Settings → API
- **Stripe**: https://dashboard.stripe.com/apikeys
- **SendGrid**: https://app.sendgrid.com/settings/api_keys
- **OpenAI**: https://platform.openai.com/api-keys
