import CareersGrid from "@/components/CareersGrid";

export default function CareersPage() {
  return (
    <div className="max-w-6xl mx-auto py-10">
      <h1 className="text-3xl font-bold text-center mb-6">
        Explore Careers on WorkVouch
      </h1>
      <p className="text-center mb-10">
        WorkVouch helps employees prove experience and employers hire trusted staff.
        Click on a career below to learn why WorkVouch is essential in your industry.
      </p>
      <CareersGrid />
    </div>
  );
}
