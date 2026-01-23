import Link from "next/link";

// Ensure this page is statically generated and doesn't require env vars
export const dynamic = "force-static";
export const revalidate = false;

/* ---------------------------------------------------------
   HOME PAGE CAREER GRID
--------------------------------------------------------- */
const careers = [
  {
    id: "healthcare",
    title: "Healthcare",
    img: "/images/careers/healthcare.jpg",
  },
  {
    id: "law-enforcement",
    title: "Law Enforcement",
    img: "/images/careers/law.jpg",
  },
  {
    id: "security",
    title: "Security",
    img: "/images/careers/security.jpg",
  },
  {
    id: "warehouse",
    title: "Warehouse & Logistics",
    img: "/images/careers/warehouse.jpg",
  },
  {
    id: "hospitality",
    title: "Hospitality",
    img: "/images/careers/hospitality.jpg",
  },
  {
    id: "retail",
    title: "Retail",
    img: "/images/careers/retail.jpg",
  },
];

export default function Home() {
  return (
    <div className="bg-gray-50 text-gray-900">
      {/* Welcome Section */}
      <div className="text-center py-20 px-4 max-w-4xl mx-auto">
        <h1 className="text-5xl font-bold text-blue-800 mb-6">
          Welcome to WorkVouch
        </h1>
        <p className="text-gray-700 text-lg mb-8">
          WorkVouch is your trusted platform to verify work history, connect with employers, and build a credible reputation online.
        </p>
        <div className="space-x-4">
          <Link href="/auth/signup" className="bg-blue-700 text-white px-6 py-3 rounded hover:bg-blue-800">
            Get Started
          </Link>
          <Link href="/about" className="bg-gray-200 text-gray-800 px-6 py-3 rounded hover:bg-gray-300">
            Learn More
          </Link>
        </div>
      </div>

      {/* Career Grid */}
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
