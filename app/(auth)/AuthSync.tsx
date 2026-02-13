"use client";

import { useEffect } from "react";
import { supabase } from "@/lib/supabase/client";

export default function AuthSync() {
  useEffect(() => {
    supabase.auth.getSession();
  }, []);

  return null;
}
