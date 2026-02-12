import { requireAdmin } from "@/lib/auth/requireAdmin";
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
  await requireAdmin();
  return (
    <InvestorLayout>
      <InvestorDemoClient />
    </InvestorLayout>
  );
}
