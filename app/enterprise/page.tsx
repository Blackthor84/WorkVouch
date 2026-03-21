import Link from "next/link";

export default function EnterprisePage() {
  return (
    <div className="max-w-5xl mx-auto px-8 py-20 space-y-10">
      <section className="space-y-4">
        <h1 className="text-4xl font-bold text-slate-900">Trust & hiring intelligence for enterprises</h1>
        <p className="text-gray-600 text-lg">
          Make confident hiring decisions with verified data, clear risk signals, and measurable trust.
        </p>
      </section>

      <section className="grid md:grid-cols-3 gap-6">
        <Feature title="Hiring insights" />
        <Feature title="Transparent outcomes" />
        <Feature title="Policy-aligned scenarios" />
      </section>

      <section className="flex flex-wrap gap-4 pt-6">
        <Link
          href="/enterprise/dashboard"
          className="inline-block bg-indigo-600 text-white px-6 py-3 rounded-lg text-lg font-medium shadow-sm hover:bg-indigo-700"
        >
          Open Hiring Intelligence Dashboard
        </Link>
        <a
          href="/enterprise/playground"
          className="inline-block border border-slate-300 text-slate-800 px-6 py-3 rounded-lg text-lg font-medium hover:bg-slate-50"
        >
          Hiring insights lab
        </a>
      </section>

      <p className="text-sm text-gray-500 pt-6">
        Sandbox hiring insights environment available for demos. Production hiring data stays in your secure dashboard.
      </p>
    </div>
  );
}

function Feature({ title }: { title: string }) {
  return (
    <div className="border rounded p-4 font-medium text-center">
      {title}
    </div>
  );
}
