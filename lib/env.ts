/**
 * Centralized Environment Variables
 * ✅ Validates env vars at runtime (not build time)
 * ✅ Works with Vercel environment variables
 * ✅ Server-only variables are never exposed to client
 */

// Server-only environment variables (never expose to client)
export const env = {
  // Supabase - Public (safe for client)
  NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '',
  
  // Supabase - Server-only (NEVER expose to client)
  SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_KEY || '',
  
  // Stripe
  STRIPE_SECRET_KEY: process.env.STRIPE_SECRET_KEY || '',
  NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || '',
  STRIPE_WEBHOOK_SECRET: process.env.STRIPE_WEBHOOK_SECRET || '',
  
  // SendGrid
  SENDGRID_API_KEY: process.env.SENDGRID_API_KEY || '',
  
  // OpenAI
  OPENAI_API_KEY: process.env.OPENAI_API_KEY || '',
  
  // App URLs
  NEXT_PUBLIC_URL: process.env.NEXT_PUBLIC_URL || process.env.NEXT_PUBLIC_APP_URL || '',
  NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL || process.env.NEXT_PUBLIC_URL || '',
} as const

/**
 * Validate required environment variables at runtime
 * Only call this in server-side code when actually needed
 */
export function validateEnv() {
  const missing: string[] = []
  
  if (!env.NEXT_PUBLIC_SUPABASE_URL) {
    missing.push('NEXT_PUBLIC_SUPABASE_URL')
  }
  
  if (!env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    missing.push('NEXT_PUBLIC_SUPABASE_ANON_KEY')
  }
  
  if (missing.length > 0) {
    throw new Error(
      `Missing required environment variables: ${missing.join(', ')}. ` +
      `Please set them in Vercel Project Settings → Environment Variables.`
    )
  }
}

/**
 * Validate server-only environment variables
 * Only call this in server-side code (API routes, server actions)
 */
export function validateServerEnv() {
  validateEnv()
  
  const missing: string[] = []
  
  if (!env.SUPABASE_SERVICE_ROLE_KEY) {
    missing.push('SUPABASE_SERVICE_ROLE_KEY (or SUPABASE_KEY)')
  }
  
  if (missing.length > 0) {
    throw new Error(
      `Missing required server environment variables: ${missing.join(', ')}. ` +
      `Please set them in Vercel Project Settings → Environment Variables.`
    )
  }
}
