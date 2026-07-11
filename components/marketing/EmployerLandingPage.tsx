import type { ReactNode } from "react";
import Link from "next/link";
import {
  ArrowRight,
  Building2,
  CheckCircle2,
  ShieldCheck,
  Users,
  Zap,
} from "lucide-react";
import { WvShell, WvContainer, WvCard, WvButton, WvPageHeader } from "@/components/wv";
import { EmployerAccessForm } from "./EmployerAccessForm";

export function EmployerLandingPage({ afterHero }: { afterHero?: ReactNode } = {}) {
  return (
    <WvShell>
      <main>
        <WvContainer className="py-12 sm:py-16 lg:py-20">
          <Link
            href="/"
            className="mb-8 inline-flex items-center gap-1.5 text-sm text-wv-muted hover:text-wv-foreground transition-colors"
          >
            ← WorkVouch
          </Link>

          <WvPageHeader
            eyebrow="For employers"
            title="Hire people you can actually trust"
            description="See which candidates are verified by real coworkers — not just resumes."
            action={
              <WvButton href="#request-access" size="lg">
                Request Access
                <ArrowRight className="h-4 w-4" aria-hidden />
              </WvButton>
            }
          />

          {afterHero}

          <div className="mt-16 grid gap-6 lg:grid-cols-2">
            <WvCard className="text-left">
              <p className="text-xs font-semibold uppercase tracking-widest text-red-400/90 mb-3">The problem</p>
              <p className="text-lg text-wv-foreground leading-relaxed">
                Resumes don&apos;t tell you who actually shows up, works hard, and is trusted by their team.
              </p>
            </WvCard>
            <WvCard glow className="text-left">
              <p className="text-xs font-semibold uppercase tracking-widest text-emerald-400/90 mb-3">The solution</p>
              <p className="text-lg font-semibold text-wv-foreground leading-relaxed">
                WorkVouch shows you who is actually trusted by their coworkers — before you extend an offer.
              </p>
            </WvCard>
          </div>

          <section className="mt-16">
            <h2 className="text-xl font-bold text-wv-foreground sm:text-2xl mb-6">How it works</h2>
            <div className="grid gap-4 sm:grid-cols-3">
              {[
                { icon: Users, step: "1", text: "Workers add job history" },
                { icon: ShieldCheck, step: "2", text: "Coworkers confirm it" },
                { icon: Building2, step: "3", text: "You see verified candidates" },
              ].map(({ icon: Icon, step, text }) => (
                <WvCard key={step} hover className="text-left">
                  <div className="flex items-center gap-3 mb-3">
                    <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-500/15 text-sm font-bold text-blue-300">
                      {step}
                    </span>
                    <Icon className="h-5 w-5 text-blue-400" aria-hidden />
                  </div>
                  <p className="text-sm text-wv-muted">{text}</p>
                </WvCard>
              ))}
            </div>
          </section>

          <section className="mt-16">
            <h2 className="text-xl font-bold text-wv-foreground sm:text-2xl mb-6">Why it works</h2>
            <div className="grid gap-3 sm:grid-cols-3">
              {["Reduce bad hires", "Hire faster", "Real trust, not resumes"].map((benefit) => (
                <div
                  key={benefit}
                  className="flex items-center gap-3 rounded-xl border border-wv-border bg-wv-surface/50 px-4 py-3"
                >
                  <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-400" aria-hidden />
                  <span className="text-sm font-medium text-wv-foreground">{benefit}</span>
                </div>
              ))}
            </div>
          </section>

          <section className="mt-16 text-center">
            <WvCard glow padding="lg" className="max-w-2xl mx-auto">
              <Zap className="h-8 w-8 text-violet-400 mx-auto mb-4" aria-hidden />
              <h2 className="text-xl font-bold text-wv-foreground sm:text-2xl">
                Get access to verified workers
              </h2>
              <p className="mt-2 text-wv-muted text-sm">
                Join employers who hire with peer-verified confidence.
              </p>
              <div className="mt-6">
                <WvButton href="#request-access" size="lg">
                  Request Access
                  <ArrowRight className="h-4 w-4" aria-hidden />
                </WvButton>
              </div>
            </WvCard>
          </section>

          <section className="mt-16 max-w-xl mx-auto">
            <h2 id="request-access-heading" className="text-xl font-bold text-wv-foreground text-center mb-6">
              Request early access
            </h2>
            <WvCard glow>
              <EmployerAccessForm />
            </WvCard>
          </section>
        </WvContainer>
      </main>
    </WvShell>
  );
}
