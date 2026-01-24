'use client';

import Link from 'next/link';
import { careers } from '../data/careers';

function shuffleArray(array: any[]) {
  return array.sort(() => Math.random() - 0.5);
}

export default function CareersGrid() {
  // Keep Healthcare first, shuffle the rest
  const [first, ...rest] = careers;
  const shuffled = shuffleArray(rest);

  const displayCareers = [first, ...shuffled];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 px-4">
      {displayCareers.map((career) => (
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
