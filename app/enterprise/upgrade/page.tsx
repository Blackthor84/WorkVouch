import { WvPageHeader, WvCard, WvButton } from "@/components/wv";

export const metadata = {
  title: "Upgrade | WorkVouch Enterprise",
};

export default function EnterpriseUpgradePage() {
  return (
    <div className="max-w-4xl mx-auto px-4 py-10 space-y-10">
      <WvPageHeader
        eyebrow="Plans"
        title="Upgrade your plan"
        description="Free employers get limited previews. Choose Pro or Enterprise for full hiring intelligence, team risk, and unlimited simulations."
        action={
          <WvButton href="/enterprise/dashboard" variant="ghost" size="sm">
            ← Back to dashboard
          </WvButton>
        }
      />

      <div className="grid md:grid-cols-2 gap-6">
        <WvCard glow className="flex flex-col border-blue-500/30">
          <h2 className="text-xl font-semibold text-wv-foreground">Pro</h2>
          <p className="text-sm text-wv-muted mt-1">For growing hiring teams</p>
          <ul className="mt-4 space-y-2 text-sm text-wv-muted list-disc list-inside flex-1">
            <li>Full candidate access</li>
            <li>Unlimited simulations</li>
            <li>Full trust insights &amp; breakdown</li>
          </ul>
          <WvButton href="/employer/upgrade" className="mt-6 w-full">
            Upgrade to Pro
          </WvButton>
        </WvCard>

        <WvCard className="flex flex-col">
          <h2 className="text-xl font-semibold text-wv-foreground">Enterprise</h2>
          <p className="text-sm text-wv-muted mt-1">For org-wide workforce programs</p>
          <ul className="mt-4 space-y-2 text-sm text-wv-muted list-disc list-inside flex-1">
            <li>Team risk dashboard</li>
            <li>Advanced analytics</li>
            <li>Priority support</li>
          </ul>
          <WvButton
            href="mailto:support@workvouch.com?subject=Enterprise%20plan"
            variant="secondary"
            className="mt-6 w-full"
          >
            Contact sales
          </WvButton>
        </WvCard>
      </div>

      <p className="text-xs text-wv-muted">
        Billing and checkout may use the employer billing portal. This page summarizes what each tier unlocks.
      </p>
    </div>
  );
}
