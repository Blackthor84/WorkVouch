import { careers } from '../../../data/careers';

interface Props {
  params: { career: string };
}

export default function CareerDetailPage({ params }: Props) {
  const career = careers.find((c) => c.id === params.career);

  if (!career) {
    return (
      <div className="p-6 text-center">
        <h1 className="text-2xl font-bold mb-2">Career Not Found</h1>
        <p className="text-gray-600">
          The career you are looking for does not exist.
        </p>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <img
        src={career.image}
        alt={career.name}
        className="w-full h-64 object-cover rounded-lg mb-6"
      />
      <h1 className="text-3xl font-bold mb-4">{career.name}</h1>
      <p className="text-gray-700 text-lg">{career.description}</p>
    </div>
  );
}
