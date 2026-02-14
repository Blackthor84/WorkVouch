import { redirect } from "next/navigation";
import { getAdminContext } from "@/lib/admin/getAdminContext";
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
  const admin = await getAdminContext();
  if (!admin.isAdmin) redirect("/login");
  return (
    <InvestorLayout>
      <InvestorDemoClient />
    </InvestorLayout>
  );
}
