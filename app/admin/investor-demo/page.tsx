import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/authOptions";
import { redirect } from "next/navigation";
import InvestorLayout from "@/components/investor/InvestorLayout";
import InvestorDemoClient from "@/components/investor/InvestorDemoClient";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Investor Demo",
  description: "Private investor and boardroom simulation. Not indexed.",
  robots: {
    index: false,
    follow: false,
  },
};

export default async function AdminInvestorDemoPage() {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    redirect("/auth/signin");
  }

  const roles = (session.user as { roles?: string[] })?.roles ?? [];
  const isAdmin = roles.includes("admin") || roles.includes("superadmin");

  if (!isAdmin) {
    redirect("/dashboard");
  }

  return (
    <InvestorLayout>
      <InvestorDemoClient />
    </InvestorLayout>
  );
}
