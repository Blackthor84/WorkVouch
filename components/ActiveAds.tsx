'use client';
import { useState, useEffect } from 'react';

interface Ad {
  id: string;
  title: string;
  image: string;
  link: string;
  active: boolean;
}

const STORAGE_KEY = 'workvouch_ads';

export default function ActiveAds() {
  const [ads, setAds] = useState<Ad[]>([]);

  useEffect(() => {
    // Load ads from localStorage
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        const allAds: Ad[] = JSON.parse(stored);
        // Only show active ads
        const activeAds = allAds.filter(ad => ad.active && ad.title && (ad.image || ad.link));
        setAds(activeAds);
      } catch (e) {
        console.error('Error loading ads:', e);
      }
    }
  }, []);

  // Listen for storage changes (when admin updates ads in another tab)
  useEffect(() => {
    const handleStorageChange = () => {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        try {
          const allAds: Ad[] = JSON.parse(stored);
          const activeAds = allAds.filter(ad => ad.active && ad.title && (ad.image || ad.link));
          setAds(activeAds);
        } catch (e) {
          console.error('Error loading ads:', e);
        }
      } else {
        setAds([]);
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  // Don't render anything if no active ads
  if (ads.length === 0) return null;

  return (
    <div className="max-w-6xl mx-auto py-6 px-4">
      {ads.map(ad => (
        <a
          key={ad.id}
          href={ad.link || '#'}
          target={ad.link ? "_blank" : undefined}
          rel={ad.link ? "noopener noreferrer" : undefined}
          className="block mb-4 border rounded-lg overflow-hidden shadow-md hover:shadow-lg transition"
        >
          {ad.image && (
            <img
              src={ad.image}
              alt={ad.title}
              className="w-full h-48 object-cover"
            />
          )}
          <div className="p-4">
            <h3 className="text-xl font-semibold">{ad.title}</h3>
          </div>
        </a>
      ))}
    </div>
  );
}
