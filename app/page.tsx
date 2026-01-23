import Image from "next/image";
import Link from "next/link";

const careers = [
  { name: "Healthcare", slug: "healthcare", image: "/careers/healthcare.jpg" },
  { name: "Law Enforcement", slug: "law-enforcement", image: "/careers/law.jpg" },
  { name: "Security", slug: "security", image: "/careers/security.jpg" },
  { name: "Warehouse & Logistics", slug: "warehouse-logistics", image: "/careers/warehouse.jpg" },
  { name: "Hospitality", slug: "hospitality", image: "/careers/hospitality.jpg" },
  { name: "Retail", slug: "retail", image: "/careers/retail.jpg" },
];

export default function Home() {
  return (
    <div className="bg-gray-50 min-h-screen">
      {/* Hero Section */}
      <section className="text-center py-24 bg-gradient-to-b from-blue-700 to-blue-500 text-white">
        <div className="max-w-4xl mx-auto px-6">
          <h1 className="text-5xl font-extrabold mb-6">WorkVouch</h1>
          <p className="text-xl max-w-2xl mx-auto opacity-90 mb-8">
            Verified Work History for Real Careers. Build trust, verify experience, and hire with confidence.
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
        </div>
      </section>

      {/* Career Grid Section */}
      <section className="max-w-6xl mx-auto py-20 px-6">
        <h2 className="text-3xl font-bold text-center text-blue-700 mb-8">Explore Careers</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-8">
          {careers.map((career) => (
            <Link 
              key={career.slug} 
              href={`/careers/${career.slug}`} 
              className="group shadow-md rounded-xl overflow-hidden bg-white hover:shadow-xl transition"
            >
              <div className="relative w-full h-48 overflow-hidden">
                <Image 
                  src={career.image} 
                  alt={career.name} 
                  fill
                  className="object-cover group-hover:scale-105 transition-transform duration-300"
                  unoptimized
                />
              </div>
              <div className="p-4 text-center font-semibold text-lg text-blue-800">
                {career.name}
              </div>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
