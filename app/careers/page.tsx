import Link from 'next/link';
import { careers } from '../../data/careers';
import FixedImage from '../../components/FixedImage';

export default function CareersPage() {
  return (
    <div className="max-w-6xl mx-auto p-6">
      <h1 className="text-4xl font-bold mb-8 text-center">Careers</h1>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
        {careers.map((career) => (
          <Link key={career.id} href={`/careers/${career.id}`}>
            <div className="cursor-pointer rounded-lg shadow-lg overflow-hidden hover:scale-105 transition-transform">
              <FixedImage
                src={career.image || '/placeholder.png'}
                alt={career.name}
                width={800}
                height={400}
                className="w-full h-48 object-cover"
              />
              <div className="p-4 bg-white">
                <h2 className="text-xl font-semibold">{career.name}</h2>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
