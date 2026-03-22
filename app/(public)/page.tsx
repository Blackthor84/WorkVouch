import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import Footer from "@/components/Footer";

export const metadata: Metadata = {
  title: "Get verified by coworkers | WorkVouch",
  description:
    "Stop relying on resumes. Prove you're legit with real coworker confirmation. Add your job, invite coworkers, get verified.",
};

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gray-50 px-6">
      {/* LOGO — add public/images/workvouch-logo.png (or use /images/workvouch.png) */}
      <img
        src="/images/workvouch-logo.png"
        alt="WorkVouch"
        className="mb-6 w-40"
        width={160}
        height={160}
      />

      {/* CARD (same vibe as login) */}
      <div className="w-full max-w-md rounded-2xl border border-gray-200 bg-white p-8 text-center shadow-lg">
        <h1 className="mb-4 text-2xl font-bold">Get verified by people you actually worked with</h1>

        <p className="mb-6 text-gray-600">
          Stop relying on resumes. If you&apos;ve worked with solid people, prove it in seconds.
        </p>

        <Link
          href="/onboarding"
          className="block rounded-xl bg-blue-600 px-6 py-3 text-lg font-semibold text-white hover:bg-blue-700"
        >
          Get Your First Vouch
        </Link>

        {/* MICRO TRUST */}
        <p className="mt-3 text-xs text-gray-400">Takes less than 60 seconds</p>

        <p className="mt-1 text-xs text-gray-400">
          Don&apos;t fall behind — people are already getting verified
        </p>

        {/* EMPLOYER LINK (SUBTLE) */}
        <p className="mt-4 text-xs text-gray-500">
          Hiring?{" "}
          <Link href="/employers" className="underline">
            View verified workers
          </Link>
        </p>
      </div>

      <Footer />
    </div>
  );
}
