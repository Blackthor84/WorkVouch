'use client';
import Link from 'next/link';
import { careers } from '../data/careers';

export default function CareersGrid() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 px-4">
      {careers.map((career) => (
        <Link
          key={career.id}
          href={`/careers/${career.id}`}
          className="border rounded-lg overflow-hidden shadow hover:shadow-lg hover:-translate-y-1 transition"
        >
          <img
            src={career.image}
            alt={career.name}
            className="w-full h-40 object-cover"
          />
          <div className="p-4 text-center">
            <h2 className="text-xl font-semibold">{career.name}</h2>
          </div>
        </Link>
      ))}
    </div>
  );
}
