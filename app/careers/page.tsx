import Link from "next/link";

const careers = [
  {
    slug: "developer",
    name: "Developer",
    image: "/images/developer.png",
    description: "Build software and applications."
  },
  {
    slug: "designer",
    name: "Designer",
    image: "/images/designer.png",
    description: "Create beautiful user experiences."
  },
  {
    slug: "healthcare",
    name: "Healthcare",
    image: "/images/healthcare.png",
    description: "Provide care and support to patients."
  },
];

export default function CareersList() {
  return (
    <div className="max-w-6xl mx-auto p-6">
      <h1 className="text-4xl font-bold mb-8">Careers</h1>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {careers.map((career) => (
          <Link key={career.slug} href={`/careers/${career.slug}`}>
            <img
              src={career.image || "/images/placeholder.png"}
              alt={career.name}
              className="rounded-lg shadow-lg object-cover w-full h-64 cursor-pointer hover:scale-105 transition-transform"
            />
            <h2 className="text-xl font-semibold mt-2 text-center">{career.name}</h2>
          </Link>
        ))}
      </div>
    </div>
  );
}
