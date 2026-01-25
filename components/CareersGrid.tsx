'use client';
import Link from 'next/link';
import Image from 'next/image';
import { careers } from '../data/careers';

// Map career IDs to actual image filenames
// Handles naming differences (e.g., 'law-enforcement' -> 'law', 'warehouse-logistics' -> 'warehouse')
// Note: Files are currently .jpg, but can be renamed to .png if desired
const getImagePath = (careerId: string): string => {
  const imageMap: Record<string, string> = {
    'healthcare': 'healthcare',
    'warehouse-logistics': 'warehouse',
    'security': 'security',
    'retail': 'retail',
    'law-enforcement': 'law',
    'hospitality': 'hospitality',
  };
  
  const baseName = imageMap[careerId] || careerId;
  // Using .jpg for now (actual files), change to .png if files are renamed
  return `/images/careers/${baseName}.jpg`;
};

export default function CareersGrid() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 px-4">
      {careers.map((career) => (
        <Link
          key={career.id}
          href={`/careers/${career.id}`}
          className="border rounded-lg overflow-hidden hover:shadow-lg transition"
        >
          <div className="w-full h-48 sm:h-56 md:h-64 bg-gray-50 flex items-center justify-center">
            <Image
              src={getImagePath(career.id)}
              alt={career.name}
              width={400}
              height={300}
              className="w-full h-full object-contain p-2"
              unoptimized
            />
          </div>
          <h2 className="text-xl font-semibold text-center mt-2 mb-4 px-2">{career.name}</h2>
        </Link>
      ))}
    </div>
  );
}
