import { careers } from "@/data/careers";

interface CareerPageProps {
  params: { career: string };
}

export default function CareerPage({ params }: CareerPageProps) {
  const career = careers.find((c) => c.id === params.career);

  if (!career) {
    return (
      <div className="p-6 text-center">
        <h1 className="text-2xl font-bold">Career Not Found</h1>
        <p>The career page you are looking for does not exist.</p>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <h1 className="text-3xl font-bold mb-4">{career.name}</h1>

      {/* Employees */}
      <section className="mb-8">
        <h2 className="text-2xl font-semibold mb-2">Why Employees Should Use WorkVouch</h2>
        <ul className="list-disc pl-6 space-y-1">
          {career.reasons.employees.map((reason, i) => (
            <li key={i}>{reason}</li>
          ))}
        </ul>
      </section>

      {/* Employers */}
      <section>
        <h2 className="text-2xl font-semibold mb-2">Why Employers Should Use WorkVouch</h2>
        <ul className="list-disc pl-6 space-y-1">
          {career.reasons.employers.map((reason, i) => (
            <li key={i}>{reason}</li>
          ))}
        </ul>
      </section>
    </div>
  );
}
