import Link from "next/link";
import { EmployerAccessForm } from "./EmployerAccessForm";

const ctaClass =
  "inline-block rounded-xl bg-black px-6 py-3 text-lg font-semibold text-white transition hover:bg-gray-900";

export function EmployerLandingPage() {
  return (
    <div className="min-h-screen bg-white px-6 py-12 text-center text-gray-900 antialiased">
      <div className="mx-auto max-w-3xl">
        <p className="mb-10 text-sm text-gray-500">
          <Link href="/" className="font-medium text-gray-700 underline-offset-4 hover:text-gray-900 hover:underline">
            ← WorkVouch
          </Link>
        </p>

        {/* HERO */}
        <h1 className="mb-4 text-3xl font-bold">Hire people you can actually trust</h1>

        <p className="mb-6 text-gray-600">
          See which candidates are verified by real coworkers — not just resumes.
        </p>

        <a href="#request-access" className={ctaClass}>
          Request Access
        </a>

        {/* PROBLEM */}
        <div className="mt-12">
          <p className="text-gray-700">
            Resumes don&apos;t tell you who actually shows up, works hard, and is trusted.
          </p>
        </div>

        {/* SOLUTION */}
        <div className="mt-6">
          <p className="font-semibold">WorkVouch shows you who is actually trusted by their coworkers.</p>
        </div>

        {/* HOW IT WORKS */}
        <div className="mt-10 text-left">
          <h2 className="mb-3 font-bold">How it works</h2>

          <ul className="space-y-2 text-gray-600">
            <li>• Workers add job history</li>
            <li>• Coworkers confirm it</li>
            <li>• You see verified candidates</li>
          </ul>
        </div>

        {/* BENEFITS */}
        <div className="mt-10 text-left">
          <h2 className="mb-3 font-bold">Why it works</h2>

          <ul className="space-y-2 text-gray-600">
            <li>• Reduce bad hires</li>
            <li>• Hire faster</li>
            <li>• Real trust, not resumes</li>
          </ul>
        </div>

        {/* CTA */}
        <div className="mt-12">
          <a href="#request-access" className={ctaClass}>
            Get Access to Verified Workers
          </a>
        </div>

        {/* FORM (wired to API) */}
        <div className="mt-10 text-left">
          <EmployerAccessForm />
        </div>
      </div>

      <Footer />
    </div>
  );
}
