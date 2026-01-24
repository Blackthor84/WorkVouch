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
          className="rounded-lg shadow-lg overflow-hidden hover:shadow-xl transition"
        >
          <img
            src={career.image}
            alt={career.name}
            className="w-full h-48 object-cover"
          />
          <div className="p-4 text-center font-semibold">{career.name}</div>
        </Link>
      ))}
    </div>
  );
}
