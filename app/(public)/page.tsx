import CareersGrid from "@/components/CareersGrid";
import ActiveAds from "@/components/ActiveAds";
import HomepageInteractiveDemo from "@/components/demo/HomepageInteractiveDemo";
import Link from "next/link";

export default function Home() {
  return (
    <div className="text-center py-10 px-4">
      <h1 className="text-4xl font-bold mb-4">Verified Work History for Real Careers</h1>
      <p className="text-lg mb-8 max-w-2xl mx-auto">
        Build trust, verify experience, and hire with confidence. WorkVouch connects employers with reliable staff and helps employees showcase their verified career experience.
      </p>

      <Link
        href="/demo"
        className="inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-violet-600 hover:from-blue-700 hover:to-violet-700 text-white font-semibold px-6 py-3 shadow-lg hover:shadow-xl transition-all duration-300 mb-10"
      >
        Try Interactive Demo
      </Link>

      <HomepageExperience />

      {/* Only show active ads (no career targeting on homepage) */}
      <ActiveAds />

      <CareersGrid />
    </div>
  );
}
