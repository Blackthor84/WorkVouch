import { careers } from '../../../data/careers';

interface Params {
  params: { career: string };
}

export default function CareerPage({ params }: Params) {
  const career = careers.find((c) => c.id === params.career);

  if (!career) {
    return <p className="text-center mt-10">Career not found.</p>;
  }

  return (
    <div className="max-w-4xl mx-auto py-10 px-4">
      <h1 className="text-3xl font-bold mb-6">{career.name}</h1>
      <img
        src={career.image}
        alt={career.name}
        className="w-full h-64 object-cover rounded-lg mb-6 shadow-md"
      />
      <p className="mb-6 text-lg">{career.heroText}</p>

      <section className="mb-6">
        <h2 className="text-2xl font-semibold mb-2">Why Employees Should Use WorkVouch</h2>
        <ul className="list-disc pl-6">
          {career.whyForEmployees.map((reason, i) => (
            <li key={i} className="mb-1">{reason}</li>
          ))}
        </ul>
      </section>

      <section>
        <h2 className="text-2xl font-semibold mb-2">Why Employers Should Use WorkVouch</h2>
        <ul className="list-disc pl-6">
          {career.whyForEmployers.map((reason, i) => (
            <li key={i} className="mb-1">{reason}</li>
          ))}
        </ul>
      </section>
    </div>
  );
}
