import { Building2, LineChart, FlaskConical } from "lucide-react";
import { EnterprisePortalLayout } from "@/components/enterprise/EnterprisePortalLayout";
import { WvCard, WvButton } from "@/components/wv";

export default function EnterprisePage() {
  return (
    <EnterprisePortalLayout>
      <section className="max-w-5xl mx-auto py-12 sm:py-16 space-y-10">
        <div className="space-y-4">
          <p className="text-xs font-semibold uppercase tracking-widest text-indigo-400/90">Enterprise</p>
          <h1 className="text-4xl font-bold text-wv-foreground sm:text-5xl">
            Trust & hiring intelligence for enterprises
          </h1>
          <p className="text-wv-muted text-lg max-w-2xl">
            Make confident hiring decisions with verified data, clear risk signals, and measurable trust.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-4">
          {[
            { title: "Hiring insights", icon: LineChart },
            { title: "Transparent outcomes", icon: Building2 },
            { title: "Policy-aligned scenarios", icon: FlaskConical },
          ].map(({ title, icon: Icon }) => (
            <WvCard key={title} hover className="text-center">
              <Icon className="h-6 w-6 text-indigo-400 mx-auto mb-2" aria-hidden />
              <p className="font-semibold text-wv-foreground">{title}</p>
            </WvCard>
          ))}
        </div>

        <div className="flex flex-wrap gap-4 pt-2">
          <WvButton href="/enterprise/dashboard" size="lg">
            Open Hiring Intelligence Dashboard
          </WvButton>
          <WvButton href="/enterprise/playground" variant="secondary" size="lg">
            Hiring insights lab
          </WvButton>
        </div>

        <p className="text-sm text-wv-subtle">
          Sandbox hiring insights environment available for demos. Production hiring data stays in your secure dashboard.
        </p>
      </section>
    </EnterprisePortalLayout>
  );
}
