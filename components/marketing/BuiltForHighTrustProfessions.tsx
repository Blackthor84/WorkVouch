export default function BuiltForHighTrustProfessions() {
  return (
    <section className="bg-slate-950 text-white py-20">
      <div className="max-w-6xl mx-auto px-6">
        <h2 className="text-3xl md:text-4xl font-bold mb-6">
          Built for High-Trust Professions
        </h2>

        <p className="text-slate-300 mb-12 max-w-3xl">
          WorkVouch is designed for industries where reliability,
          accountability, and reputation matter most.
        </p>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[
            "Healthcare",
            "Law Enforcement",
            "Security",
            "Retail",
            "Hospitality",
            "Warehouse & Logistics",
            "Education",
            "Construction",
          ].map((industry) => (
            <div
              key={industry}
              className="bg-slate-900 border border-slate-700 rounded-xl p-6"
            >
              <h3 className="text-lg font-semibold text-white">
                {industry}
              </h3>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
