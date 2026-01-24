import CareersGrid from '../components/CareersGrid';

export default function Home() {
  return (
    <div className="text-center py-10 px-4">
      <h1 className="text-4xl font-bold mb-4">Verified Work History for Real Careers</h1>
      <p className="text-lg mb-8 max-w-2xl mx-auto">
        Build trust, verify experience, and hire with confidence. WorkVouch connects employers with reliable staff and helps employees showcase their verified career experience.
      </p>

      <CareersGrid />

      {/* Placeholder for ads (invisible for visitors) */}
      <div className="hidden" id="admin-ads-panel">
        <p>Admin Ad System Goes Here</p>
      </div>
    </div>
  );
}
