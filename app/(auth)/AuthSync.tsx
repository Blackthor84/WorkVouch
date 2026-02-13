"use client";

import { useEffect } from "react";
import { supabaseBrowser } from "@/lib/supabase/client";

export default function AuthSync() {
  useEffect(() => {
    supabaseBrowser.auth.getSession();
  }, []);

  return null;
}
