'use client';
import CareersGrid from './components/CareersGrid';
import AdminAdPlaceholder from '../components/AdminAdPlaceholder';

export default function HomePage() {
  return (
    <div className="max-w-6xl mx-auto py-10 px-4">
      <h1 className="text-4xl font-bold text-center mb-8">Welcome to WorkVouch</h1>
      <p className="text-center mb-12">Verified work history for real careers. Build trust and hire with confidence.</p>

      {/* Careers Section */}
      <section>
        <h2 className="text-2xl font-semibold mb-4">Explore Careers</h2>
        <CareersGrid />
      </section>

      {/* Admin-only ad placeholder (invisible to normal visitors) */}
      <section className="mt-16">
        <AdminAdPlaceholder location="homepage" />
      </section>
    </div>
  );
}
