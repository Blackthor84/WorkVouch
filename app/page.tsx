import Link from "next/link";

// Ensure this page is statically generated and doesn't require env vars
export const dynamic = "force-static";
export const revalidate = false;

const careers = [
  { id: "healthcare", title: "Healthcare", img: "/images/careers/healthcare.jpg" },
  { id: "law-enforcement", title: "Law Enforcement", img: "/images/careers/law.jpg" },
  { id: "security", title: "Security", img: "/images/careers/security.jpg" },
  { id: "warehouse", title: "Warehouse & Logistics", img: "/images/careers/warehouse.jpg" },
  { id: "hospitality", title: "Hospitality", img: "/images/careers/hospitality.jpg" },
  { id: "retail", title: "Retail", img: "/images/careers/retail.jpg" },
];

export default function Home() {
  return (
    <div className="bg-gray-50 text-gray-900">
      {/* HERO SECTION */}
      <section className="text-center py-24 bg-gradient-to-b from-blue-700 to-blue-500 text-white">
        <h1 className="text-5xl font-extrabold mb-6">
          WorkVouch — Verified Work History for Real Careers
        </h1>
        <p className="text-xl max-w-2xl mx-auto opacity-90 mb-8">
          Build trust. Get hired faster. Protect your reputation.  
          WorkVouch brings accountability and transparency to the workforce.
        </p>

        <div className="flex justify-center gap-4">
          <Link
            href="/auth/signup"
            className="px-8 py-3 bg-white text-blue-700 font-semibold rounded-lg shadow hover:scale-105 transition"
          >
            Get Started
          </Link>

          <Link
            href="/pricing"
            className="px-8 py-3 border border-white font-semibold rounded-lg hover:bg-white hover:text-blue-700 transition"
          >
            View Pricing
          </Link>
        </div>
      </section>

      {/* CAREER GRID */}
      <section className="max-w-6xl mx-auto py-20 px-6">
        <h2 className="text-3xl font-bold text-center text-blue-700 mb-8">
          Explore Careers With WorkVouch
        </h2>

        <div className="grid md:grid-cols-3 gap-8">
          {careers.map((c) => (
            <Link
              key={c.id}
              href={`/careers/${c.id}`}
              className="group shadow-md rounded-xl overflow-hidden bg-white hover:shadow-xl transition"
            >
              <img
                src={c.img}
                alt={c.title}
                className="w-full h-48 object-cover group-hover:scale-105 transition"
              />
              <div className="p-4 text-center font-semibold text-lg text-blue-800">
                {c.title}
              </div>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
