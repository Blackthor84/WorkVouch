/**
 * Client-side Supabase client
 * Safe to use in browser/React components
 * Uses anon key - safe to expose to frontend
 * ✅ Only used in React pages or components (client-side)
 * 
 * This file re-exports the centralized client from lib/supabaseClient.ts
 * for backward compatibility with existing imports.
 */
export { supabase } from "@/lib/supabaseClient";
export { supabase as getSupabaseClient } from "@/lib/supabaseClient";
export { supabase as supabaseClient } from "@/lib/supabaseClient";
