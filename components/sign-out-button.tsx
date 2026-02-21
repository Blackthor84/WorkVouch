"use client";

import { supabaseBrowser } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { Button } from "./ui/button";

export function SignOutButton() {
  const router = useRouter();
  const supabase = supabaseBrowser;

  const handleSignOut = async () => {
    try {
      await fetch("/api/sandbox/impersonate/exit", { method: "POST", credentials: "include" });
    } catch {
      // ignore
    }
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
