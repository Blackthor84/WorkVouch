import CareersGrid from '../components/CareersGrid';

export default function HomePage() {
  return (
    <div className="max-w-6xl mx-auto py-10">
      <h1 className="text-4xl font-bold text-center mb-8">
        Verified Work History for Real Careers
      </h1>
      
      {/* Career Boxes */}
      <CareersGrid />

      {/* Placeholder for ads (invisible for visitors) */}
      <div className="hidden" id="admin-ads-panel">
        <p>Admin Ad System Goes Here</p>
      </div>
    </div>
  );
}
