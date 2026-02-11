import { TestingLabClient } from "./TestingLabClient";

export const dynamic = "force-dynamic";

export default function AdminTestingLabPage() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-100">Simulation Lab</h1>
        <p className="mt-1 text-sm text-slate-300">
          Hybrid simulation: real scoring engines, real intelligence data. Never affects production. Auto-purge on expiry.
        </p>
      </div>
      <TestingLabClient />
    </div>
  );
}
