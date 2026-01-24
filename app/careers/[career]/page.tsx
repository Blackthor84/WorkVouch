import { notFound } from "next/navigation";

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

export async function generateStaticParams() {
  return careers.map((career) => ({ career: career.id }));
}

export default function CareerPage({ params }: { params: { career: string } }) {
  const career = careers.find((c) => c.id === params.career);

  if (!career) return notFound();

  return (
    <div className="max-w-5xl mx-auto p-6">
      <h1 className="text-3xl font-bold mb-4">{career.name}</h1>
      <img
        src={career.image || "/images/placeholder.png"}
        alt={career.name}
        className="rounded-lg mb-6 shadow-lg object-cover w-full h-64"
      />
      <p className="text-lg">{career.description}</p>
    </div>
  );
}
