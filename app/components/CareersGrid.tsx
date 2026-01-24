'use client';
import Link from 'next/link';
import { careers } from '../data/careers';

export default function CareersGrid() {
  // Ensure Healthcare is first, others shuffled
  const shuffledCareers = [
    careers.find(c => c.id === 'healthcare')!,
    ...careers.filter(c => c.id !== 'healthcare').sort(() => Math.random() - 0.5),
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
      {shuffledCareers.map(career => (
        <Link
          key={career.id}
          href={`/careers/${career.id}`}
          className="border rounded-lg p-6 text-center hover:bg-blue-100 transition"
        >
          <h3 className="text-xl font-semibold">{career.name}</h3>
        </Link>
      ))}
    </div>
  );
}
