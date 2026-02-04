"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  CheckCircleIcon,
  ShieldCheckIcon,
  UserGroupIcon,
  ChartBarIcon,
  ClipboardDocumentListIcon,
  LockClosedIcon,
  ScaleIcon,
} from "@heroicons/react/24/outline";

export default function EmployerLandingClient() {
  return (
    <div className="min-h-screen">
      {/* 1. Hero */}
      <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6 lg:py-24">
        <div className="text-center max-w-3xl mx-auto">
          <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white sm:text-4xl lg:text-5xl">
            Verified Employment. Transparent Reputation.
          </h1>
          <p className="mt-5 text-lg leading-relaxed text-slate-600 dark:text-slate-400">
            Access verified work overlap, peer-validated references, trust
            scores, and rehire eligibility indicators — all in one structured
            dashboard.
          </p>
          <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
            <Button href="/pricing" variant="primary" size="lg">
              View Pricing
            </Button>
            <Button href="/contact" variant="secondary" size="lg">
              Request Demo
            </Button>
          </div>
        </div>
      </section>

      {/* 2. What You Gain Access To */}
      <section className="border-t border-slate-200 dark:border-slate-700/80 bg-slate-50/30 dark:bg-slate-800/20">
        <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6 lg:py-20">
          <h2 className="text-center text-2xl font-bold tracking-tight text-slate-900 dark:text-white sm:text-3xl">
            What You Gain Access To
          </h2>
          <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            <Card className="border-slate-200 dark:border-slate-700">
              <CardContent className="pt-6">
                <div className="mb-4 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400">
                  <UserGroupIcon className="h-5 w-5" aria-hidden />
                </div>
                <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
                  Verified Employment Overlap
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-slate-600 dark:text-slate-400">
                  See confirmed coworker overlap for each employment record.
                </p>
              </CardContent>
            </Card>
            <Card className="border-slate-200 dark:border-slate-700">
              <CardContent className="pt-6">
                <div className="mb-4 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400">
                  <ChartBarIcon className="h-5 w-5" aria-hidden />
                </div>
                <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
                  Reputation Score Overview
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-slate-600 dark:text-slate-400">
                  A calculated score based on verified employment, validated
                  references, and fraud indicators.
                </p>
              </CardContent>
            </Card>
            <Card className="border-slate-200 dark:border-slate-700">
              <CardContent className="pt-6">
                <div className="mb-4 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400">
                  <ClipboardDocumentListIcon className="h-5 w-5" aria-hidden />
                </div>
                <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
                  Peer Reference Summaries
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-slate-600 dark:text-slate-400">
                  Read structured, validated feedback from confirmed coworkers.
                </p>
              </CardContent>
            </Card>
            <Card className="border-slate-200 dark:border-slate-700">
              <CardContent className="pt-6">
                <div className="mb-4 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400">
                  <CheckCircleIcon className="h-5 w-5" aria-hidden />
                </div>
                <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
                  Rehire Eligibility Indicators
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-slate-600 dark:text-slate-400">
                  When available, view employer-submitted rehire eligibility
                  signals.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* 3. Designed for High-Trust Industries */}
      <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6 lg:py-20">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white sm:text-3xl">
            Designed for High-Trust Industries
          </h2>
          <p className="mt-5 text-base leading-relaxed text-slate-600 dark:text-slate-400">
            WorkVouch helps employers review verified employment overlap and
            structured peer validation — adding transparency to hiring decisions
            without replacing internal screening processes.
          </p>
          <p className="mt-6 text-sm text-slate-500 dark:text-slate-500">
            WorkVouch does not provide background checks or criminal history
            reports.
          </p>
        </div>
      </section>

      {/* 4. Access Levels */}
      <section className="border-t border-slate-200 dark:border-slate-700/80 bg-slate-50/30 dark:bg-slate-800/20">
        <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6 lg:py-20">
          <h2 className="text-center text-2xl font-bold tracking-tight text-slate-900 dark:text-white sm:text-3xl">
            Access Levels
          </h2>
          <div className="mt-12 grid gap-6 sm:grid-cols-3">
            <Card className="border-slate-200 dark:border-slate-700">
              <CardContent className="pt-6">
                <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
                  Lite
                </h3>
                <ul className="mt-4 space-y-2 text-sm text-slate-600 dark:text-slate-400">
                  <li className="flex items-start gap-2">
                    <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-blue-500" />
                    View reputation score
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-blue-500" />
                    View verified employment count
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-blue-500" />
                    Basic candidate lookup
                  </li>
                </ul>
              </CardContent>
            </Card>
            <Card className="border-slate-200 dark:border-slate-700 ring-2 ring-blue-500/50">
              <CardContent className="pt-6">
                <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
                  Pro
                </h3>
                <ul className="mt-4 space-y-2 text-sm text-slate-600 dark:text-slate-400">
                  <li className="flex items-start gap-2">
                    <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-blue-500" />
                    Full employment verification view
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-blue-500" />
                    Reference summaries
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-blue-500" />
                    Rehire eligibility indicators
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-blue-500" />
                    Dashboard analytics
                  </li>
                </ul>
              </CardContent>
            </Card>
            <Card className="border-slate-200 dark:border-slate-700">
              <CardContent className="pt-6">
                <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
                  Custom
                </h3>
                <ul className="mt-4 space-y-2 text-sm text-slate-600 dark:text-slate-400">
                  <li className="flex items-start gap-2">
                    <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-blue-500" />
                    Multi-location dashboards
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-blue-500" />
                    Admin team roles
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-blue-500" />
                    Advanced reporting
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-blue-500" />
                    API access (future-ready)
                  </li>
                </ul>
              </CardContent>
            </Card>
          </div>
          <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
            <Button href="/signup" variant="primary" size="lg">
              Start With Lite
            </Button>
            <Button href="/pricing" variant="secondary" size="lg">
              Upgrade to Pro
            </Button>
          </div>
        </div>
      </section>

      {/* 5. Transparent & Fair */}
      <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6 lg:py-20">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-center text-2xl font-bold tracking-tight text-slate-900 dark:text-white sm:text-3xl">
            Transparent & Fair
          </h2>
          <ul className="mt-8 space-y-3 text-slate-600 dark:text-slate-400">
            <li className="flex items-start gap-3">
              <ScaleIcon className="h-5 w-5 shrink-0 text-blue-500 mt-0.5" aria-hidden />
              Built-in dispute system
            </li>
            <li className="flex items-start gap-3">
              <ClipboardDocumentListIcon className="h-5 w-5 shrink-0 text-blue-500 mt-0.5" aria-hidden />
              Audit logging
            </li>
            <li className="flex items-start gap-3">
              <CheckCircleIcon className="h-5 w-5 shrink-0 text-blue-500 mt-0.5" aria-hidden />
              Appeal process
            </li>
            <li className="flex items-start gap-3">
              <LockClosedIcon className="h-5 w-5 shrink-0 text-blue-500 mt-0.5" aria-hidden />
              Secure data storage
            </li>
            <li className="flex items-start gap-3">
              <ShieldCheckIcon className="h-5 w-5 shrink-0 text-blue-500 mt-0.5" aria-hidden />
              Role-based access control
            </li>
          </ul>
          <p className="mt-6 text-base leading-relaxed text-slate-600 dark:text-slate-400">
            All reputation scores and verification data can be disputed and
            reviewed. Changes are logged and recalculated to ensure fairness.
          </p>
        </div>
      </section>

      {/* 6. Final CTA */}
      <section className="border-t border-slate-200 dark:border-slate-700/80 bg-slate-50/30 dark:bg-slate-800/20">
        <div className="mx-auto max-w-4xl px-4 py-16 text-center sm:px-6 lg:py-24">
          <h2 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white sm:text-3xl lg:text-4xl">
            Bring Verified Reputation Into Your Hiring Process
          </h2>
          <Button
            href="/signup"
            variant="primary"
            size="lg"
            className="mt-8"
          >
            Get Started
          </Button>
          <p className="mt-4 text-sm text-slate-500 dark:text-slate-500">
            Secure onboarding. Cancel anytime.
          </p>
        </div>
      </section>
    </div>
  );
}
