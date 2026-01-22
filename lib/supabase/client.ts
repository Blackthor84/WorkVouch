/**
 * Client-side Supabase client
 * Safe to use in browser/React components
 * Uses anon key - safe to expose to frontend
 */
import { createClient as createSupabaseClient } from '@supabase/supabase-js'
import { Database } from '@/types/database'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing required Supabase environment variables: NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY must be set in .env.local')
}

// Export the client instance
export const supabaseClient = createSupabaseClient<Database>(supabaseUrl, supabaseAnonKey)

// Export createClient function for backward compatibility
export const createClient = () => createSupabaseClient<Database>(supabaseUrl, supabaseAnonKey)
