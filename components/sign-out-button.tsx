"use client";

import { getSupabaseClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { Button } from "./ui/button";

export function SignOutButton() {
  const router = useRouter();

  const handleSignOut = async () => {
    const supabase = getSupabaseClient();
    await supabase.auth.signOut();
    router.push("/");
    router.refresh();
  };

  return (
    <Button variant="ghost" size="sm" onClick={handleSignOut}>
      Sign Out
    </Button>
  );
}
