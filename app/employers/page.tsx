import Link from "next/link";
import type { Metadata } from "next";
import BadHireCalculator from "@/components/marketing/BadHireCalculator";

export const metadata: Metadata = {
  title: "For employers | Hiring risk & verified coworkers | WorkVouch",
  description:
    "Estimate bad-hire cost and hire with verified coworker relationships—not just resumes.",
};

export default function EmployersPage() {
  return (
    <main className="bg-gray-50">
      {/* HERO */}
      <section className="text-center py-24 px-6 bg-white">
        <h1 className="text-4xl md:text-5xl font-bold mb-4">
          Hiring the wrong person is expensive.
        </h1>

        <p className="text-gray-600 text-lg max-w-2xl mx-auto mb-8">
          Most companies rely on resumes and interviews. But those don&apos;t tell
          you how someone actually performs at work.
        </p>

        <a
          href="#calculator"
          className="inline-block bg-black text-white px-6 py-3 rounded-lg hover:opacity-90"
        >
          Calculate your hiring risk
        </a>
      </section>

      {/* CALCULATOR */}
      <div id="calculator">
        <BadHireCalculator />
      </div>

      {/* VALUE SECTION */}
      <section className="py-20 px-6 text-center">
        <h2 className="text-3xl font-bold mb-6">Stop guessing. Start verifying.</h2>

        <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
          <div className="bg-white p-6 rounded-xl shadow-sm">
            <h3 className="font-semibold mb-2">Verified coworkers</h3>
            <p className="text-sm text-gray-600">
              See who has actually worked with the candidate.
            </p>
          </div>

          <div className="bg-white p-6 rounded-xl shadow-sm">
            <h3 className="font-semibold mb-2">Trust scores</h3>
            <p className="text-sm text-gray-600">
              Instantly understand reliability based on real relationships.
            </p>
          </div>

          <div className="bg-white p-6 rounded-xl shadow-sm">
            <h3 className="font-semibold mb-2">Request resumes</h3>
            <p className="text-sm text-gray-600">
              Only access resumes when candidates approve.
            </p>
          </div>
        </div>
      </section>

      {/* SOCIAL PROOF (placeholder for now) */}
      <section className="py-20 px-6 bg-white text-center">
        <h2 className="text-2xl font-bold mb-4">Built for better hiring decisions</h2>

        <p className="text-gray-600 max-w-xl mx-auto">
          WorkVouch helps employers reduce hiring mistakes by showing real, verified
          work relationships — not just resumes.
        </p>
      </section>

      {/* FINAL CTA */}
      <section className="py-24 px-6 text-center">
        <h2 className="text-3xl font-bold mb-4">Start hiring with confidence</h2>

        <p className="text-gray-600 mb-6">
          See verified coworkers before you make your next hire.
        </p>

        <Link
          href="/signup"
          className="inline-block bg-black text-white px-8 py-4 rounded-lg text-lg hover:opacity-90"
        >
          Get started
        </Link>
      </section>
    </main>
  );
}
