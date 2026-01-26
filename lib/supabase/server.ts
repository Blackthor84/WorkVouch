import { createClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';

/**
 * Simple server-side Supabase client
 * Uses SUPABASE_URL and SUPABASE_KEY environment variables
 */
export const createSupabaseServerClient = () => {
  if (!process.env.SUPABASE_URL || !process.env.SUPABASE_KEY) {
    throw new Error('Missing SUPABASE_URL or SUPABASE_KEY');
  }

  return createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_KEY
  );
};

/**
 * Create a server-side Supabase client with cookie forwarding
 * Supports both SUPABASE_URL/SUPABASE_KEY and NEXT_PUBLIC_SUPABASE_URL/NEXT_PUBLIC_SUPABASE_ANON_KEY
 * Forwards cookies for authenticated requests
 */
export const createServerClient = async () => {
  // Support both env var patterns for compatibility
  const supabaseUrl = 
    process.env.SUPABASE_URL || 
    process.env.NEXT_PUBLIC_SUPABASE_URL;
  
  const supabaseKey = 
    process.env.SUPABASE_KEY || 
    process.env.SUPABASE_ANON_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseKey) {
    throw new Error('Missing SUPABASE_URL or SUPABASE_KEY environment variables. Please set SUPABASE_URL and SUPABASE_KEY (or NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY).');
  }

  return createClient(
    supabaseUrl,
    supabaseKey,
    {
      headers: { cookie: cookies().toString() },
    }
  );
};

/**
 * Synchronous version for backward compatibility
 * @deprecated Use createServerClient() instead
 */
export function createServerSupabase() {
  const supabaseUrl = 
    process.env.SUPABASE_URL || 
    process.env.NEXT_PUBLIC_SUPABASE_URL;
  
  const supabaseKey = 
    process.env.SUPABASE_KEY || 
    process.env.SUPABASE_ANON_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseKey) {
    throw new Error('Missing SUPABASE_URL or SUPABASE_KEY environment variables');
  }

  return createClient(
    supabaseUrl,
    supabaseKey,
    {
      headers: { cookie: cookies().toString() },
    }
  );
}
