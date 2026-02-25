export default function EnterprisePage() {
  return (
    <div className="max-w-5xl mx-auto px-8 py-20 space-y-10">
      <section className="space-y-4">
        <h1 className="text-4xl font-bold">
          Hiring Simulation Engine for Enterprises
        </h1>
        <p className="text-gray-600 text-lg">
          Predict trust, risk, and verification outcomes before interviews begin.
        </p>
      </section>

      <section className="grid md:grid-cols-3 gap-6">
        <Feature title="Simulate Risk" />
        <Feature title="Explain Outcomes" />
        <Feature title="Stress-Test Hiring Policy" />
      </section>

      <section className="pt-10">
        <a
          href="/enterprise/playground"
          className="inline-block bg-blue-600 text-white px-6 py-3 rounded text-lg"
        >
          Open Live Playground
        </a>
      </section>

      <p className="text-sm text-gray-500 pt-6">
        Simulation-only environment. No production data.
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
