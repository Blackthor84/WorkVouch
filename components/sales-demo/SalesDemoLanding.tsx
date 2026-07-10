"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import {
  UserGroupIcon,
  ShieldCheckIcon,
  ChartBarIcon,
  ArrowRightIcon,
  CheckCircleIcon,
} from "@heroicons/react/24/outline";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { DemoShell } from "@/components/sales-demo/DemoShell";
import { AnimatedCounter } from "@/components/sales-demo/DemoVisuals";
import {
  LANDING_STATS,
  LANDING_TESTIMONIALS,
  EMPLOYEE_VALUE_BLOCKS,
  EMPLOYER_VALUE_BLOCKS,
} from "@/lib/demo/sales-demo-data";
import { ValueSection } from "@/components/sales-demo/ValueSection";

const fadeUp = {
  initial: { opacity: 0, y: 24 },
  animate: { opacity: 1, y: 0 },
};

export default function SalesDemoLanding() {
  return (
    <DemoShell flow="landing">
      {/* Hero */}
      <motion.section
        {...fadeUp}
        transition={{ duration: 0.5 }}
        className="text-center max-w-4xl mx-auto"
      >
        <span className="inline-flex items-center gap-2 rounded-full bg-blue-100 px-4 py-1.5 text-xs font-semibold uppercase tracking-wide text-blue-800 mb-6">
          <ShieldCheckIcon className="h-4 w-4" />
          Verified workplace reputation
        </span>
        <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-gray-900 tracking-tight leading-[1.1]">
          Trust Built by the People Who Actually Worked With You
        </h1>
        <p className="mt-6 text-lg sm:text-xl text-gray-600 max-w-2xl mx-auto leading-relaxed">
          WorkVouch helps workers build verified reputations and helps employers
          hire with confidence.
        </p>
        <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
          <Button href="/experience/employee" size="lg" className="w-full sm:w-auto gap-2 px-8">
            Explore Employee Experience
            <ArrowRightIcon className="h-4 w-4" />
          </Button>
          <Button
            href="/experience/employer"
            variant="outline"
            size="lg"
            className="w-full sm:w-auto gap-2 px-8 border-gray-300"
          >
            Explore Employer Experience
            <ArrowRightIcon className="h-4 w-4" />
          </Button>
        </div>
      </motion.section>

      {/* Stats */}
      <motion.section
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15, duration: 0.5 }}
        className="mt-16 grid grid-cols-2 lg:grid-cols-4 gap-4"
      >
        {LANDING_STATS.map((stat) => (
          <Card
            key={stat.label}
            className="text-center border-gray-100 bg-white/80 backdrop-blur-sm hover:shadow-md transition-shadow"
            hover
          >
            <p className="text-3xl sm:text-4xl font-bold text-blue-600 tabular-nums">
              <AnimatedCounter
                value={stat.value}
                suffix={stat.suffix}
                decimals={stat.decimals ?? 0}
              />
            </p>
            <p className="mt-2 text-xs sm:text-sm text-gray-600 leading-snug">
              {stat.label}
            </p>
          </Card>
        ))}
      </motion.section>

      {/* Dual value props */}
      <section className="mt-20 grid md:grid-cols-2 gap-8">
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Card featured className="h-full border-blue-100">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-100 text-blue-600 mb-4">
              <UserGroupIcon className="h-6 w-6" />
            </div>
            <h2 className="text-xl font-bold text-gray-900">For Workers</h2>
            <p className="mt-2 text-gray-600 text-sm leading-relaxed">
              Build a portable reputation verified by real coworkers. Stand out
              with trust scores, endorsements, and proof beyond your resume.
            </p>
            <ul className="mt-4 space-y-2">
              {[
                "Verified coworker reviews",
                "Portable trust score",
                "Endorsements that travel with you",
              ].map((item) => (
                <li key={item} className="flex items-center gap-2 text-sm text-gray-700">
                  <CheckCircleIcon className="h-4 w-4 text-emerald-500 shrink-0" />
                  {item}
                </li>
              ))}
            </ul>
            <Link
              href="/experience/employee"
              className="mt-6 inline-flex items-center gap-1 text-sm font-semibold text-blue-600 hover:text-blue-800"
            >
              Start employee demo <ArrowRightIcon className="h-4 w-4" />
            </Link>
          </Card>
        </motion.div>
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.25 }}
        >
          <Card featured className="h-full border-indigo-100">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-indigo-100 text-indigo-600 mb-4">
              <ChartBarIcon className="h-6 w-6" />
            </div>
            <h2 className="text-xl font-bold text-gray-900">For Employers</h2>
            <p className="mt-2 text-gray-600 text-sm leading-relaxed">
              Hire with confidence using peer-verified trust data. Compare
              candidates, reduce risk, and make faster decisions.
            </p>
            <ul className="mt-4 space-y-2">
              {[
                "Trust score comparison",
                "Retention & attendance signals",
                "Hiring risk analytics",
              ].map((item) => (
                <li key={item} className="flex items-center gap-2 text-sm text-gray-700">
                  <CheckCircleIcon className="h-4 w-4 text-emerald-500 shrink-0" />
                  {item}
                </li>
              ))}
            </ul>
            <Link
              href="/experience/employer"
              className="mt-6 inline-flex items-center gap-1 text-sm font-semibold text-indigo-600 hover:text-indigo-800"
            >
              Start employer demo <ArrowRightIcon className="h-4 w-4" />
            </Link>
          </Card>
        </motion.div>
      </section>

      {/* Testimonials */}
      <section className="mt-20">
        <h2 className="text-2xl font-bold text-gray-900 text-center mb-8">
          Trusted by hospitality & security leaders
        </h2>
        <div className="grid md:grid-cols-3 gap-6">
          {LANDING_TESTIMONIALS.map((t, i) => (
            <motion.div
              key={t.author}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 * i }}
            >
              <Card className="h-full bg-white border-gray-100" hover>
                <p className="text-gray-700 text-sm leading-relaxed italic">
                  &ldquo;{t.quote}&rdquo;
                </p>
                <div className="mt-4 pt-4 border-t border-gray-100">
                  <p className="font-semibold text-gray-900 text-sm">{t.author}</p>
                  <p className="text-xs text-gray-500 mt-0.5">{t.role}</p>
                </div>
              </Card>
            </motion.div>
          ))}
        </div>
      </section>

      <ValueSection blocks={[...EMPLOYEE_VALUE_BLOCKS, ...EMPLOYER_VALUE_BLOCKS]} />

      {/* Final CTA */}
      <section className="mt-16 rounded-2xl bg-gray-900 px-8 py-12 text-center text-white">
        <h2 className="text-2xl sm:text-3xl font-bold">
          See the full WorkVouch experience
        </h2>
        <p className="mt-3 text-gray-400 max-w-xl mx-auto">
          Walk through both sides of the platform — no signup, no backend, fully
          interactive.
        </p>
        <div className="mt-8 flex flex-col sm:flex-row justify-center gap-4">
          <Button
            href="/experience/employee"
            size="lg"
            className="bg-white text-gray-900 hover:bg-gray-100"
          >
            Employee Experience
          </Button>
          <Button
            href="/experience/employer"
            size="lg"
            variant="outline"
            className="border-gray-600 text-white hover:bg-gray-800"
          >
            Employer Experience
          </Button>
        </div>
      </section>
    </DemoShell>
  );
}
