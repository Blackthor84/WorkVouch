'use client';
import { Ad } from '../types/ad';

export default function AdBanner({ ad }: { ad: Ad }) {
  if (!ad || !ad.isActive) return null;

  return (
    <a href={ad.linkUrl || '#'} target="_blank" rel="noopener noreferrer">
      <div className="border p-4 rounded shadow bg-white hover:bg-gray-50 transition">
        {ad.imageUrl && (
          <img src={ad.imageUrl} alt={ad.title} className="mb-3 rounded w-full" />
        )}

        <h3 className="font-bold mb-2">{ad.title}</h3>

        <div
          className="text-sm text-gray-700"
          dangerouslySetInnerHTML={{ __html: ad.content || '' }}
        />
      </div>
    </a>
  );
}
