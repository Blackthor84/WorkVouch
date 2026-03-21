import Link from "next/link";

export const metadata = {
  title: "Upgrade | WorkVouch Enterprise",
};

export default function EnterpriseUpgradePage() {
  return (
    <div className="max-w-4xl mx-auto space-y-10">
      <div>
        <Link href="/enterprise/dashboard" className="text-sm text-indigo-600 font-medium hover:underline">
          ← Back to dashboard
        </Link>
        <h1 className="text-3xl font-bold text-slate-900 mt-4 tracking-tight">Upgrade your plan</h1>
        <p className="text-slate-600 mt-2">
          Free employers get limited previews. Choose Pro or Enterprise for full hiring intelligence, team risk,
          and unlimited simulations.
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <section className="rounded-2xl border-2 border-indigo-200 bg-white p-6 shadow-sm flex flex-col">
          <h2 className="text-xl font-semibold text-slate-900">Pro</h2>
          <p className="text-sm text-slate-500 mt-1">For growing hiring teams</p>
          <ul className="mt-4 space-y-2 text-sm text-slate-700 list-disc list-inside flex-1">
            <li>Full candidate access</li>
            <li>Unlimited simulations</li>
            <li>Full trust insights &amp; breakdown</li>
          </ul>
          <Link
            href="/employer/upgrade"
            className="mt-6 inline-flex justify-center rounded-xl bg-indigo-600 px-4 py-3 text-sm font-semibold text-white hover:bg-indigo-700"
          >
            Upgrade to Pro
          </Link>
        </section>

        <section className="rounded-2xl border border-slate-200 bg-slate-50/80 p-6 shadow-sm flex flex-col">
          <h2 className="text-xl font-semibold text-slate-900">Enterprise</h2>
          <p className="text-sm text-slate-500 mt-1">For org-wide workforce programs</p>
          <ul className="mt-4 space-y-2 text-sm text-slate-700 list-disc list-inside flex-1">
            <li>Team risk dashboard</li>
            <li>Advanced analytics</li>
            <li>Priority support</li>
          </ul>
          <a
            href="mailto:support@workvouch.com?subject=Enterprise%20plan"
            className="mt-6 inline-flex justify-center rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm font-semibold text-slate-800 hover:bg-slate-50"
          >
            Contact sales
          </a>
        </section>
      </div>

      <p className="text-xs text-slate-500">
        Billing and checkout may use the employer billing portal. This page summarizes what each tier unlocks.
      </p>
    </div>
  );
}
