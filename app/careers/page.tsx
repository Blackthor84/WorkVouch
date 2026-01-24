import Link from 'next/link';
import { careers } from '../../data/careers';

export default function CareersPage() {
  return (
    <div className="p-6 max-w-7xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">Explore Careers</h1>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
        {careers.map((career) => (
          <Link key={career.id} href={`/careers/${career.id}`}>
            <div className="cursor-pointer border rounded-lg shadow hover:shadow-lg transition duration-200 p-4 flex flex-col items-center">
              <img
                src={career.image}
                alt={career.name}
                className="rounded-lg object-cover w-full h-48 mb-4"
              />
              <h2 className="text-xl font-semibold">{career.name}</h2>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
