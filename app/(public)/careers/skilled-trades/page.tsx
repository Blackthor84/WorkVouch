"use client";

import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { getIndustryImage } from "@/lib/constants/industries";

export default function SkilledTradesCareerPage() {
  const heroImage = getIndustryImage("skilled-trades");

  return (
    <div className="min-h-screen bg-background dark:bg-[#0D1117]">
      <div className="max-w-4xl mx-auto px-4 py-12 sm:px-6 lg:py-16">
        {/* Hero image — same placement as other career pages */}
        <div className="w-full h-40 sm:h-48 md:h-56 bg-gray-50 dark:bg-slate-800 rounded-lg overflow-hidden flex items-center justify-center mb-10">
          <Image
            src={heroImage}
            alt="Skilled Trades"
            width={400}
            height={300}
            className="w-full h-full object-contain p-2"
            unoptimized
          />
        </div>

        {/* SECTION 1 — Hero */}
        <section className="text-center mb-16">
          <h1 className="text-4xl font-bold tracking-tight text-slate-900 dark:text-white sm:text-5xl mb-4">
            Verified work history for skilled trades professionals.
          </h1>
          <p className="text-xl text-slate-600 dark:text-slate-300 max-w-2xl mx-auto mb-8">
            Build trust, verify experience, and stand out with peer-backed references from people who&apos;ve worked alongside you.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-4">
            <Button href="/signup?type=employee" variant="primary" size="lg">
              Get Verified in Skilled Trades
            </Button>
            <Button href="/signup" variant="secondary" size="lg">
              Hire Skilled Trades Through WorkVouch
            </Button>
          </div>
        </section>

        {/* SECTION 2 — Why Skilled Trades Professionals Use WorkVouch (4 cards) */}
        <section className="mb-16">
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-6">
            Why Skilled Trades Professionals Use WorkVouch
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card className="p-6 border-slate-200 dark:border-slate-700">
              <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">Peer-Verified Experience</h3>
              <p className="text-slate-600 dark:text-slate-400">
                Confirm your work history through coworkers and supervisors who actually worked with you.
              </p>
            </Card>
            <Card className="p-6 border-slate-200 dark:border-slate-700">
              <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">Skill & Certification Credibility</h3>
              <p className="text-slate-600 dark:text-slate-400">
                Show proof of hands-on experience, not just licenses or resumes.
              </p>
            </Card>
            <Card className="p-6 border-slate-200 dark:border-slate-700">
              <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">Portable Reputation</h3>
              <p className="text-slate-600 dark:text-slate-400">
                Take your verified reputation with you from job to job, company to company.
              </p>
            </Card>
            <Card className="p-6 border-slate-200 dark:border-slate-700">
              <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">Stand Out Instantly</h3>
              <p className="text-slate-600 dark:text-slate-400">
                Employers see verified trust signals before interviews even begin.
              </p>
            </Card>
          </div>
        </section>

        {/* SECTION 3 — What Can Be Verified (Skilled Trades Only) */}
        <section className="mb-16 border-t border-slate-200 dark:border-slate-700 pt-12">
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-6">
            What Can Be Verified (Skilled Trades Only)
          </h2>
          <ul className="space-y-3 text-slate-600 dark:text-slate-400 list-disc list-inside">
            <li>Job history across companies</li>
            <li>Trade-specific skills (electric, plumbing, HVAC, carpentry, etc.)</li>
            <li>Supervisor and peer references</li>
            <li>Safety and compliance confirmations</li>
            <li>Employment timelines and consistency</li>
          </ul>
        </section>

        {/* SECTION 4 — Why Employers Hire Skilled Trades Through WorkVouch */}
        <section className="mb-16 border-t border-slate-200 dark:border-slate-700 pt-12">
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-6">
            Why Employers Hire Skilled Trades Through WorkVouch
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card className="p-6 border-slate-200 dark:border-slate-700">
              <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">Hire Faster With Confidence</h3>
              <p className="text-slate-600 dark:text-slate-400">
                Instantly see verified work history and peer references.
              </p>
            </Card>
            <Card className="p-6 border-slate-200 dark:border-slate-700">
              <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">Reduce Bad Hires</h3>
              <p className="text-slate-600 dark:text-slate-400">
                Spot inconsistencies, gaps, and trust signals before onboarding.
              </p>
            </Card>
            <Card className="p-6 border-slate-200 dark:border-slate-700">
              <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">Validate Skills, Not Just Claims</h3>
              <p className="text-slate-600 dark:text-slate-400">
                See what coworkers say — not just what resumes say.
              </p>
            </Card>
            <Card className="p-6 border-slate-200 dark:border-slate-700">
              <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">Scales From Small Shops to Enterprise Teams</h3>
              <p className="text-slate-600 dark:text-slate-400">
                From single-location employers to multi-location operations.
              </p>
            </Card>
          </div>
        </section>

        {/* SECTION 5 — Employer Use Cases */}
        <section className="mb-16 border-t border-slate-200 dark:border-slate-700 pt-12">
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-6">
            Employer Use Cases
          </h2>
          <ul className="space-y-2 text-slate-600 dark:text-slate-400 list-disc list-inside">
            <li>Electrical companies</li>
            <li>Plumbing services</li>
            <li>HVAC providers</li>
            <li>Facilities & maintenance teams</li>
            <li>Utilities and service contractors</li>
          </ul>
        </section>

        {/* SECTION 6 — Final CTA */}
        <section className="border-t border-slate-200 dark:border-slate-700 pt-12 text-center">
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">
            Get Verified in Skilled Trades.
          </h2>
          <p className="text-slate-600 dark:text-slate-400 mb-2">
            Stop Guessing. Start Verifying.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-4 mt-6">
            <Button href="/signup?type=employee" variant="primary" size="lg">
              Get Verified in Skilled Trades
            </Button>
            <Button href="/signup" variant="secondary" size="lg">
              Employer Sign Up
            </Button>
          </div>
        </section>
      </div>
    </div>
  );
}
