import Link from 'next/link';
import { careers } from '../../data/careers';

export default function CareersPage() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 p-6">
      {careers.map((career) => (
        <Link key={career.id} href={`/careers/${career.id}`}>
          <div className="cursor-pointer border rounded-lg shadow hover:shadow-lg p-4">
            <img
              src={career.image}
              alt={career.name}
              className="rounded-lg object-cover w-full h-48"
            />
            <h2 className="mt-2 font-bold text-lg">{career.name}</h2>
          </div>
        </Link>
      ))}
    </div>
  );
}
