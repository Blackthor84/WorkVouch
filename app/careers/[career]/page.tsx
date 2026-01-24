// app/careers/[career]/page.tsx
import { careers } from '../../../data/careers';

interface Props {
  params: { career: string };
}

export default function CareerDetailPage({ params }: Props) {
  const career = careers.find((c) => c.id === params.career);

  if (!career) return <div className="p-6">Career not found.</div>;

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <img
        src={career.image}
        alt={career.name}
        className="w-full h-64 object-cover rounded-lg mb-4"
      />
      <h1 className="text-2xl font-bold mb-2">{career.name}</h1>
      <p className="text-gray-700">{career.description}</p>
    </div>
  );
}
