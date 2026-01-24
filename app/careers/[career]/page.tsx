import { careers, Career } from '../../../data/careers';
import FixedImage from '../../../components/FixedImage';

interface Props {
  params: { career: string };
}

export function generateStaticParams() {
  return careers.map((career) => ({ career: career.id }));
}

export default function CareerDetailPage({ params }: Props) {
  const career: Career | undefined = careers.find((c) => c.id === params.career);

  if (!career) {
    return (
      <div className="p-6 text-center">
        <h1 className="text-2xl font-bold mb-2">Career Not Found</h1>
        <p className="text-gray-600">The career you are looking for does not exist.</p>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <FixedImage
        src={career.image || '/placeholder.png'}
        alt={career.name}
        width={800}
        height={400}
        className="w-full h-64 object-cover rounded-lg mb-6"
      />
      <h1 className="text-3xl font-bold mb-4">{career.name}</h1>
      <p className="text-gray-700 text-lg mb-8">{career.description}</p>

      {/* Employer Benefits Section */}
      <section className="mb-8">
        <h2 className="text-2xl font-semibold mb-4 text-blue-700">Why Employers Choose WorkVouch</h2>
        <ul className="list-disc list-inside space-y-2 text-gray-700">
          {career.employerBenefits.map((benefit, idx) => (
            <li key={idx}>{benefit}</li>
          ))}
        </ul>
      </section>

      {/* Employee Benefits Section */}
      <section className="mb-8">
        <h2 className="text-2xl font-semibold mb-4 text-green-700">Benefits for Employees</h2>
        <ul className="list-disc list-inside space-y-2 text-gray-700">
          {career.employeeBenefits.map((benefit, idx) => (
            <li key={idx}>{benefit}</li>
          ))}
        </ul>
      </section>
    </div>
  );
}
