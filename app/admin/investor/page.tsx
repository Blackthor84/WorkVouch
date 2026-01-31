import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/authOptions";
import { redirect } from "next/navigation";
import InvestorDashboardClient from "./InvestorDashboardClient";
import { getSupabaseServer } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Investor Dashboard",
  description: "Private investor metrics. Simulation only. Not indexed.",
  robots: { index: false, follow: false },
};

async function getRealCounts() {
  const supabase = getSupabaseServer() as any;
  const count = async (table: string): Promise<number> => {
    try {
      const { count: c, error } = await supabase.from(table).select("*", { count: "exact", head: true });
      return error ? 0 : (typeof c === "number" ? c : 0);
    } catch {
      return 0;
    }
  };
  const [totalUsers, totalEmployers, verificationVolume] = await Promise.all([
    count("profiles"),
    count("employer_accounts"),
    count("verification_requests"),
  ]);
  let demoCount = 0;
  try {
    const { count: d } = await supabase.from("profiles").select("id", { count: "exact", head: true }).eq("demo_account", true);
    demoCount = typeof d === "number" ? d : 0;
  } catch {
    // ignore
  }
  return {
    totalUsers,
    totalEmployers,
    verificationVolume,
    demoAccounts: demoCount,
    realUsers: Math.max(0, totalUsers - demoCount),
  };
}

export default async function AdminInvestorPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect("/auth/signin");

  const roles = (session.user as { roles?: string[] })?.roles ?? [];
  if (!roles.includes("superadmin")) redirect("/dashboard");

  const realCounts = await getRealCounts();

  return (
    <div className="min-h-screen bg-[#0a0e14] text-slate-200">
      <div className="sticky top-0 z-50 border-b border-amber-500/40 bg-amber-500/10 px-4 py-3 text-center">
        <span className="text-sm font-semibold uppercase tracking-wider text-amber-400">
          Investor Dashboard — Private. Not in navbar. Simulation-safe.
        </span>
      </div>
      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        <InvestorDashboardClient realCounts={realCounts} />
      </div>
    </div>
  );
}
