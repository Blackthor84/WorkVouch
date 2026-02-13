declare global {
  interface Window {
    __SUPABASE_CLIENT_CREATED__?: boolean;
  }
}

export function enforceSingleSupabaseClient() {
  if (typeof window === "undefined") return;

  if (window.__SUPABASE_CLIENT_CREATED__) {
    throw new Error(
      "❌ Multiple Supabase browser clients detected. You MUST use the singleton from /lib/supabase/client.ts"
    );
  }

  window.__SUPABASE_CLIENT_CREATED__ = true; // claim before creating
}
