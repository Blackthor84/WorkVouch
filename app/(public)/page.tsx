import CareersGrid from "@/components/CareersGrid";
import ActiveAds from "@/components/ActiveAds";

export default function Home() {
  return (
    <div className="text-center py-10 px-4">
      <h1 className="text-4xl font-bold mb-4">Verified Work History for Real Careers</h1>
      <p className="text-lg mb-8 max-w-2xl mx-auto">
        Build trust, verify experience, and hire with confidence. WorkVouch connects employers with reliable staff and helps employees showcase their verified career experience.
      </p>

      {/* Only show active ads (no career targeting on homepage) */}
      <ActiveAds />

      <CareersGrid />
    </div>
  );
}
