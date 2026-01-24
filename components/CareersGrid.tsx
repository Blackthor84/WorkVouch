'use client';
import Link from 'next/link';
import { careers } from '../data/careers';

export default function CareersGrid() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 px-4">
      {careers.map((career, index) => (
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
