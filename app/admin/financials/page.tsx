import { FinancialsClient } from "./FinancialsClient";

export const dynamic = "force-dynamic";

export default function FinancialsPage() {
  return (
    <div className="p-6">
      <h1 className="text-2xl font-semibold text-[#0F172A] mb-6">Financials</h1>
      <FinancialsClient />
    </div>
  );
}
