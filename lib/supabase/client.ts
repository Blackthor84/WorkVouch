"use client";

/**
 * Browser Supabase client — re-exports singleton from canonical lib/supabase-browser.
 * Single shared client; persistent session (persistSession, autoRefreshToken, pkce).
 */
export { supabaseBrowser } from "@/lib/supabase-browser";
