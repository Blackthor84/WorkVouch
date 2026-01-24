import CareersGrid from '../components/CareersGrid';

export default function Home() {
  return (
    <div className="max-w-7xl mx-auto py-10 px-4">
      <h1 className="text-4xl font-bold text-center mb-10">
        Verified Work History for Real Careers
      </h1>
      <p className="text-center mb-10">
        Build trust, verify experience, and hire with confidence.
      </p>

      {/* Career section */}
      <CareersGrid />

      {/* Placeholder for ads (invisible for visitors) */}
      <div className="hidden" id="admin-ads-panel">
        <p>Admin Ad System Goes Here</p>
      </div>
    </div>
  );
}
