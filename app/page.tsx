import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, ShieldCheck, Users, Building2 } from "lucide-react";
import Footer from "@/components/Footer";
import { WvShell, WvContainer, WvCard, WvButton } from "@/components/wv";

export const metadata: Metadata = {
  title: "Get verified by coworkers | WorkVouch",
  description:
    "Stop relying on resumes. Prove you're legit with real coworker confirmation. Add your job, invite coworkers, get verified.",
};

export default function Home() {
  return (
    <WvShell>
      <main className="flex min-h-[calc(100vh-3.5rem)] flex-col">
        <WvContainer className="flex flex-1 flex-col items-center justify-center py-16 sm:py-24">
          <div className="text-center max-w-3xl">
            <span className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-4 py-1.5 text-xs font-semibold uppercase tracking-wider text-blue-300 mb-8">
              <ShieldCheck className="h-3.5 w-3.5" aria-hidden />
              Verified workplace reputation
            </span>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight leading-[1.08] bg-gradient-to-b from-white via-white to-white/70 bg-clip-text text-transparent">
              Get verified by people who actually worked with you
            </h1>
            <p className="mt-6 text-lg sm:text-xl text-wv-muted leading-relaxed max-w-2xl mx-auto">
              Stop relying on resumes. If you&apos;ve worked with solid people, prove it in seconds
              — and carry that trust wherever you go.
            </p>
            <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
              <WvButton href="/signup" size="lg" className="w-full sm:w-auto px-10">
                Get Your First Vouch
                <ArrowRight className="h-4 w-4" aria-hidden />
              </WvButton>
              <WvButton href="/demo" variant="secondary" size="lg" className="w-full sm:w-auto">
                See Live Demo
              </WvButton>
            </div>
            <p className="mt-4 text-sm text-wv-subtle">Takes less than 60 seconds · No credit card</p>
          </div>

          <div className="mt-16 grid sm:grid-cols-2 gap-4 w-full max-w-2xl">
            <WvCard hover className="text-left">
              <Users className="h-6 w-6 text-blue-400 mb-3" aria-hidden />
              <p className="font-semibold text-wv-foreground">For workers</p>
              <p className="mt-1 text-sm text-wv-muted">Build a portable trust score verified by real coworkers.</p>
              <Link href="/signup" className="mt-3 inline-flex text-sm font-medium text-blue-400 hover:text-blue-300">
                Start free →
              </Link>
            </WvCard>
            <WvCard hover className="text-left">
              <Building2 className="h-6 w-6 text-violet-400 mb-3" aria-hidden />
              <p className="font-semibold text-wv-foreground">For employers</p>
              <p className="mt-1 text-sm text-wv-muted">Hire with confidence using peer-verified candidate insights.</p>
              <Link href="/employers" className="mt-3 inline-flex text-sm font-medium text-violet-400 hover:text-violet-300">
                Learn more →
              </Link>
            </WvCard>
          </div>
        </WvContainer>
        <Footer />
      </main>
    </WvShell>
  );
}
