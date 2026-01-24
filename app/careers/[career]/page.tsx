import { notFound } from "next/navigation";

// Replace this with your actual database or API call
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

export async function generateStaticParams() {
  return careers.map((career) => ({ career: career.slug }));
}

export default function CareerPage({ params }: { params: { career: string } }) {
  const career = careers.find((c) => c.slug === params.career);

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
