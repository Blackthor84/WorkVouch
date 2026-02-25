"use client";

export default function ProductionEquivalent() {
  return (
    <div className="border rounded p-4 bg-slate-50">
      <h3 className="font-semibold">If this happened in production</h3>
      <ul className="list-disc ml-5 text-sm text-gray-700">
        <li>POST /api/resumes/verify</li>
        <li>POST /api/peer-reviews/apply</li>
        <li>PATCH /api/users/trust-score</li>
        <li>POST /api/employers/risk-signal</li>
      </ul>
    </div>
  );
}
