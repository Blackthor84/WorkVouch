/**
 * Server-side Supabase admin client
 * ⚠️ MUST remain secret - never expose to browser
 * Uses service role key - bypasses RLS
 * Only use in API routes and server actions
 */
import { createClient } from '@supabase/supabase-js'
import { Database } from '@/types/database'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL || 'https://sjwxcrmtivmhbqqlkrsh.supabase.co'
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNqd3hjcm10aXZtaGJxcWxrcnNoIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NzcxODc1OCwiZXhwIjoyMDgzMjk0NzU4fQ.k_ymo3UDNSfMnvvZvGPwg6AJm5c2Tfu5jhT_bthQ7og'

export const supabaseServer = createClient<Database>(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
})
