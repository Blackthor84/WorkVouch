import CareersGrid from '../../components/CareersGrid';

export default function CareersPage() {
  return (
    <div className="max-w-6xl mx-auto py-10">
      <h1 className="text-3xl font-bold text-center mb-4">
        Explore Careers on WorkVouch
      </h1>
      <p className="text-center mb-8 max-w-2xl mx-auto">
        Build trust, verify experience, and hire with confidence. WorkVouch connects employers with reliable staff and helps employees showcase their verified career experience.
      </p>
      <CareersGrid />
    </div>
  );
}
