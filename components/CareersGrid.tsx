'use client';
import Link from 'next/link';
import { careers } from '../data/careers';

export default function CareersGrid() {
  // Keep healthcare first, randomize rest
  const rest = careers.filter(c => c.id !== 'healthcare');
  const shuffledRest = rest.sort(() => Math.random() - 0.5);
  const displayCareers = [careers.find(c => c.id === 'healthcare')!, ...shuffledRest];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 px-4">
      {displayCareers.map(career => (
        <Link
          key={career.id}
          href={`/careers/${career.id}`}
          className="border rounded-lg p-6 text-center hover:bg-blue-100 transition"
        >
          <h2 className="text-xl font-semibold">{career.name}</h2>
        </Link>
      ))}
    </div>
  );
}
