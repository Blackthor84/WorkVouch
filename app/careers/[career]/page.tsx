// app/careers/[career]/page.tsx
import Image from "next/image";
import { careers } from "@/data/careers";

interface CareerPageProps {
  params: { career: string };
}

export default function CareerPage({ params }: CareerPageProps) {
  const career = careers.find((c) => c.id === params.career);

  if (!career) {
    return (
      <div className="max-w-4xl mx-auto py-20 px-6">
        <h1 className="text-3xl font-bold">Career Not Found</h1>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto py-20 px-6">
      <h1 className="text-4xl font-bold mb-6">{career.name}</h1>

      <Image
        src={career.image}
        alt={career.name}
        width={800}
        height={500}
        className="rounded-xl mb-8 object-cover"
      />

      <p className="text-lg mb-10">{career.description}</p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-10 mt-10">
        
        <div>
          <h2 className="text-2xl font-semibold mb-3 text-blue-600">
            Why Employers Choose WorkVouch
          </h2>
          <ul className="list-disc ml-6 space-y-2 text-gray-700">
            {career.employerBenefits.map((benefit, i) => (
              <li key={i}>{benefit}</li>
            ))}
          </ul>
        </div>

        <div>
          <h2 className="text-2xl font-semibold mb-3 text-green-600">
            Why Employees Choose WorkVouch
          </h2>
          <ul className="list-disc ml-6 space-y-2 text-gray-700">
            {career.employeeBenefits.map((benefit, i) => (
              <li key={i}>{benefit}</li>
            ))}
          </ul>
        </div>

      </div>
    </div>
  );
}
