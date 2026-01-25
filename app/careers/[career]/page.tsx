import { careers } from '../../../data/careers';

interface Params {
  params: { career: string };
}

export default function CareerPage({ params }: Params) {
  const career = careers.find((c) => c.id === params.career);

  if (!career) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-12">
        <p className="text-center mt-10 text-red-500">Career not found.</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-12">
      <h1 className="text-4xl font-bold mb-6">{career.name}</h1>

      <img
        src={career.image}
        alt={career.name}
        className="w-full h-64 object-contain rounded-lg mb-6 shadow-lg bg-gray-50"
      />

      <section className="mb-8">
        <h2 className="text-2xl font-semibold mt-8 mb-2">Why Employees Should Use WorkVouch</h2>
        <ul className="list-disc pl-6 space-y-2">
          {career.whyForEmployees.map((reason, i) => (
            <li key={i}>{reason}</li>
          ))}
        </ul>
      </section>

      <section>
        <h2 className="text-2xl font-semibold mt-8 mb-2">Why Employers Should Use WorkVouch</h2>
        <ul className="list-disc pl-6 space-y-2">
          {career.whyForEmployers.map((reason, i) => (
            <li key={i}>{reason}</li>
          ))}
        </ul>
      </section>
    </div>
  );
}
