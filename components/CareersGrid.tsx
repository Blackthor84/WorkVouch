'use client';
import Link from 'next/link';
import Image from 'next/image';
import { careers } from '../data/careers';

export default function CareersGrid() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 px-4">
      {careers.map((career) => (
        <Link
          key={career.id}
          href={`/careers/${career.id}`}
          className="border rounded-lg overflow-hidden shadow hover:shadow-lg transition"
        >
          {career.image ? (
            <Image
              src={career.image}
              alt={career.name}
              width={400}
              height={250}
              className="object-cover w-full h-56"
              placeholder="blur"
              blurDataURL="/placeholder.png"
            />
          ) : (
            <div className="h-56 bg-gray-200 flex items-center justify-center">
              <span className="text-xl font-semibold">{career.name}</span>
            </div>
          )}
          <h2 className="text-xl font-semibold text-center p-4">{career.name}</h2>
        </Link>
      ))}
    </div>
  );
}
