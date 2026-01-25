'use client';
import { useState, useEffect } from 'react';

interface Ad {
  id: string;
  type?: 'banner' | 'native' | 'popup';
  title: string;
  image: string;
  link: string;
  active?: boolean;
  status?: 'pending' | 'active' | 'inactive';
  careers?: string[];
  startDate?: string;
  endDate?: string;
}

const STORAGE_KEY_OLD = 'workvouch_ads';
const STORAGE_KEY_NEW = 'workvouch_ads_enhanced';

export default function ActiveAds({ currentCareerId }: { currentCareerId?: string }) {
  const [ads, setAds] = useState<Ad[]>([]);

  useEffect(() => {
    // Try new enhanced ads first, fallback to old format
    const storedNew = localStorage.getItem(STORAGE_KEY_NEW);
    const storedOld = localStorage.getItem(STORAGE_KEY_OLD);
    
    let allAds: Ad[] = [];
    
    if (storedNew) {
      try {
        allAds = JSON.parse(storedNew);
      } catch (e) {
        console.error('Error loading enhanced ads:', e);
      }
    } else if (storedOld) {
      try {
        allAds = JSON.parse(storedOld);
      } catch (e) {
        console.error('Error loading old ads:', e);
      }
    }

    // Filter active ads
    const now = new Date().toISOString().split('T')[0];
    const activeAds = allAds.filter(ad => {
      // Check status (new format) or active flag (old format)
      const isActive = ad.status === 'active' || (ad.active === true && !ad.status);
      
      // Check dates if provided
      const startValid = !ad.startDate || ad.startDate <= now;
      const endValid = !ad.endDate || ad.endDate >= now;
      
      // Check career targeting
      const careerMatch = !ad.careers || ad.careers.length === 0 || (currentCareerId && ad.careers.includes(currentCareerId));
      
      return isActive && startValid && endValid && careerMatch && ad.title && ad.image;
    });

    setAds(activeAds);
  }, [currentCareerId]);

  // Listen for storage changes
  useEffect(() => {
    const handleStorageChange = () => {
      const storedNew = localStorage.getItem(STORAGE_KEY_NEW);
      const storedOld = localStorage.getItem(STORAGE_KEY_OLD);
      
      let allAds: Ad[] = [];
      
      if (storedNew) {
        try {
          allAds = JSON.parse(storedNew);
        } catch (e) {
          console.error('Error loading enhanced ads:', e);
        }
      } else if (storedOld) {
        try {
          allAds = JSON.parse(storedOld);
        } catch (e) {
          console.error('Error loading old ads:', e);
        }
      }

      const now = new Date().toISOString().split('T')[0];
      const activeAds = allAds.filter(ad => {
        const isActive = ad.status === 'active' || (ad.active === true && !ad.status);
        const startValid = !ad.startDate || ad.startDate <= now;
        const endValid = !ad.endDate || ad.endDate >= now;
        const careerMatch = !ad.careers || ad.careers.length === 0 || (currentCareerId && ad.careers.includes(currentCareerId));
        return isActive && startValid && endValid && careerMatch && ad.title && ad.image;
      });

      setAds(activeAds);
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, [currentCareerId]);

  if (ads.length === 0) return null;

  return (
    <div className="max-w-6xl mx-auto py-6 px-4">
      {ads.map(ad => {
        if (ad.type === 'popup') {
          // Popup ads - could be implemented as modal later
          return null;
        }

        return (
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
                className={`w-full ${ad.type === 'native' ? 'h-32' : 'h-48'} object-cover`}
              />
            )}
            <div className="p-4">
              <h3 className="text-xl font-semibold">{ad.title}</h3>
            </div>
          </a>
        );
      })}
    </div>
  );
}
