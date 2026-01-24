import { careers } from '../../../data/careers';
import Image from 'next/image';

interface Params {
  params: { career: string };
}

export default function CareerPage({ params }: Params) {
  const career = careers.find((c) => c.id === params.career);

  if (!career) {
    return <p className="text-center mt-10 text-red-500">Career not found.</p>;
  }

  return (
    <div className="max-w-4xl mx-auto py-10 px-4">
      <h1 className="text-3xl font-bold mb-6">{career.name}</h1>

      {career.image && (
        <Image
          src={career.image}
          alt={career.name}
          width={800}
          height={400}
          className="rounded-lg mb-6 shadow-lg object-cover w-full h-64"
        />
      )}

      <section className="mb-6">
        <h2 className="text-2xl font-semibold mb-2">Why Employees Should Use WorkVouch</h2>
        <ul className="list-disc pl-6">
          {career.whyForEmployees.map((reason, i) => (
            <li key={i}>{reason}</li>
          ))}
        </ul>
      </section>

      <section>
        <h2 className="text-2xl font-semibold mb-2">Why Employers Should Use WorkVouch</h2>
        <ul className="list-disc pl-6">
          {career.whyForEmployers.map((reason, i) => (
            <li key={i}>{reason}</li>
          ))}
        </ul>
      </section>
    </div>
  );
}
