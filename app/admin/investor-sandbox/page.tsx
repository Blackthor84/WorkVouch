import { InvestorSandboxClient } from "./InvestorSandboxClient";

export const dynamic = "force-dynamic";

export default function AdminInvestorSandboxPage() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-100">Investor Sandbox</h1>
        <p className="mt-1 text-sm text-gray-400">
          Read-only projections, data density, and metrics. No production writes. Admin-only visibility.
        </p>
      </div>
      <InvestorSandboxClient />
    </div>
  );
}
