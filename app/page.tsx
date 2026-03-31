import type { Metadata } from "next";
import Link from "next/link";
import Footer from "@/components/Footer";

/**
 * Homepage lives at app/page.tsx (root `/`).
 * Global <Navbar /> is rendered in app/layout.tsx — do not duplicate here (avoids double nav when logged in).
 */
export const metadata: Metadata = {
  title: "Get verified by coworkers | WorkVouch",
  description:
    "Stop relying on resumes. Prove you're legit with real coworker confirmation. Add your job, invite coworkers, get verified.",
};

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col bg-gray-50">
      {/* MAIN — Navbar from root layout */}
      <main className="flex flex-1 items-center justify-center px-6">
        <div className="bg-white p-10 rounded-2xl shadow-lg w-full max-w-lg text-center">
          <h1 className="mb-4 text-3xl font-bold">Get verified by people you actually worked with</h1>

          <p className="mb-6 text-gray-600">
            Stop relying on resumes. If you&apos;ve worked with solid people, prove it in seconds.
          </p>

          <a
            href="/onboarding"
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-xl text-lg font-semibold block"
          >
            Get Your First Vouch
          </a>

          <p className="mt-3 text-xs text-gray-400">Takes less than 60 seconds</p>

          <p className="mt-1 text-xs text-gray-400">
            Don&apos;t fall behind — people are already getting verified
          </p>

          <p className="mt-4 text-sm text-gray-500">
            <Link href="/employers" className="font-medium underline">
              For Employers
            </Link>
          </p>
        </div>
      </main>

      <Footer />
    </div>
  );
}
