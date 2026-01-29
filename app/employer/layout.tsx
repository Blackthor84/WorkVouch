import { redirect } from "next/navigation";
import { createServerSupabase } from "@/lib/supabase/server";
import { NavbarServer } from "@/components/navbar-server";

export default async function EmployerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createServerSupabase();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  return (
    <>
      <NavbarServer />
      <main className="flex-1 bg-background dark:bg-[#0D1117] min-h-screen">
        {children}
      </main>
    </>
  );
}
