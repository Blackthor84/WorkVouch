/**
 * Server-side Supabase client
 * ⚠️ Uses service role key - bypasses RLS
 * ✅ Only used in Next.js API routes or server actions
 * NEVER expose this to the browser
 */
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

export const supabaseServerClient = createClient(supabaseUrl, supabaseServiceKey);
