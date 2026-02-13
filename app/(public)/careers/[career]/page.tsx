import Image from "next/image";
import { careers } from "@/data/careers";
import { notFound } from "next/navigation";

export default async function CareerPage(props: { params: Promise<{ career: string }> }) {
  const { career: careerSlug } = await props.params;

  const career = careers.find(
    (c) => c.id === careerSlug || c.id.replace(/-/g, "_") === careerSlug.replace(/-/g, "_")
  );

  if (!career) {
    notFound();
  }

  return (
    <div className="max-w-3xl mx-auto py-10">
      <div className="w-full h-40 sm:h-48 md:h-56 bg-gray-50 dark:bg-slate-800 rounded-lg overflow-hidden flex items-center justify-center mb-8">
        <Image
          src={career.image}
          alt={career.name}
          width={400}
          height={300}
          className="w-full h-full object-contain p-2"
          unoptimized
        />
      </div>
      <h1 className="text-3xl font-bold mb-6">{career.name}</h1>

      <p className="mb-4">{career.heroText}</p>

      <h2 className="text-xl font-semibold mt-6 mb-2">Why EMPLOYERS Use WorkVouch</h2>
      <ul className="list-disc ml-6 space-y-2">
        {career.whyForEmployers.map((item, i) => (
          <li key={i}>{item}</li>
        ))}
      </ul>

      <h2 className="text-xl font-semibold mt-6 mb-2">Why EMPLOYEES Use WorkVouch</h2>
      <ul className="list-disc ml-6 space-y-2">
        {career.whyForEmployees.map((item, i) => (
          <li key={i}>{item}</li>
        ))}
      </ul>
    </div>
  );
}
