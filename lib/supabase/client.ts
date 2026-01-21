/**
 * Client-side Supabase client
 * Safe to use in browser/React components
 * Uses anon key - safe to expose to frontend
 */
import { createClient as createSupabaseClient } from '@supabase/supabase-js'
import { Database } from '@/types/database'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://sjwxcrmtivmhbqqlkrsh.supabase.co'
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNqd3hjcm10aXZtaGJxcWxrcnNoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njc3MTg3NTgsImV4cCI6MjA4MzI5NDc1OH0.k_ymo3UDNSfMnvvZvGPwg6AJm5c2Tfu5jhT_bthQ7og'

// Export the client instance
export const supabaseClient = createSupabaseClient<Database>(supabaseUrl, supabaseAnonKey)

// Export createClient function for backward compatibility
export const createClient = () => createSupabaseClient<Database>(supabaseUrl, supabaseAnonKey)
