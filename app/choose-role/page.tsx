"use client";

import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase/client";

export default function ChooseRole() {
  const router = useRouter();

  async function setRole(role: "employee" | "employer") {
    const { data } = await supabase.auth.getUser();

    if (!data?.user) return;

    await supabase
      .from("profiles")
      .update({ role })
      .eq("id", data.user.id);

    router.replace("/dashboard");
  }

  return (
    <div className="flex gap-6">
      <button onClick={() => setRole("employee")}>I&apos;m an Employee</button>
      <button onClick={() => setRole("employer")}>I&apos;m an Employer</button>
    </div>
  );
}
