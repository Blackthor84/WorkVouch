'use client';
import Link from 'next/link';
import Image from 'next/image';
import { careers } from '../data/careers';

// Map career IDs to image paths. Education/Construction use /images/industries/; others use /images/careers/
const getImagePath = (careerId: string, careerImage?: string): string => {
  if (careerImage) return careerImage;
  if (careerId === 'education') return '/images/industries/education.jpg';
  if (careerId === 'construction') return '/images/industries/construction.jpg';
  const careersBase: Record<string, string> = {
    'healthcare': 'healthcare',
    'warehouse-logistics': 'warehouse',
    'security': 'security',
    'retail': 'retail',
    'law-enforcement': 'law',
    'hospitality': 'hospitality',
  };
  const baseName = careersBase[careerId] || careerId;
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
          <div className="w-full h-40 sm:h-48 md:h-56 bg-gray-50 flex items-center justify-center">
            <Image
              src={getImagePath(career.id, career.image)}
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
