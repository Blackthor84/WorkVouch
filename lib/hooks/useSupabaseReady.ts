"use client";

import { useEffect, useState } from "react";
import { supabaseBrowser } from "@/lib/supabase/client";

/**
 * Blocks rendering until Supabase session has been hydrated (getSession run).
 * Use at the top of protected client components so no POST fires before cookies exist.
 */
export function useSupabaseReady() {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let mounted = true;

    async function hydrate() {
      const { data } = await supabaseBrowser.auth.getSession();
      if (mounted) {
        setReady(true);
      }
    }

    hydrate();

    return () => {
      mounted = false;
    };
  }, []);

  return ready;
}
