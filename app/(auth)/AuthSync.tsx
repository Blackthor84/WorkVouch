"use client";

import { useEffect } from "react";
import { supabaseBrowser } from "@/lib/supabase/client";

export default function AuthSync() {
  const supabase = supabaseBrowser;
  useEffect(() => {
    supabase.auth.getSession();
  }, []);

  return null;
}
