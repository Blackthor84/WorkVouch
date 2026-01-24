import Link from "next/link";

export const careers = [
  {
    id: 'developer',
    name: 'Software Developer',
    image: '/images/developer.png',
    description: 'Build software, write clean code, and solve problems.'
  },
  {
    id: 'designer',
    name: 'Designer',
    image: '/images/designer.png',
    description: 'Create beautiful interfaces and amazing user experiences.'
  },
  {
    id: 'healthcare',
    name: 'Healthcare Professional',
    image: '/images/healthcare.png',
    description: 'Care for patients and improve their lives.'
  },
];

export default function CareersList() {
  return (
    <div className="max-w-6xl mx-auto p-6">
      <h1 className="text-4xl font-bold mb-8">Careers</h1>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {careers.map((career) => (
          <Link key={career.id} href={`/careers/${career.id}`}>
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
