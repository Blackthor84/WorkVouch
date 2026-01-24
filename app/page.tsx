'use client';
import { useState, useEffect } from 'react';
import CareersGrid from './components/CareersGrid';
import AdminAdPlaceholder from '../components/AdminAdPlaceholder';

interface Ad {
  id: number;
  title: string;
  type: 'banner' | 'text' | 'link';
  content: string;
  link?: string;
  visible: boolean;
}

export default function HomePage() {
  const [ads, setAds] = useState<Ad[]>([]);

  useEffect(() => {
    // Fetch only visible ads
    fetch('/api/ads?visible=true')
      .then(res => res.json())
      .then(data => setAds(data))
      .catch(err => console.error('Error fetching ads:', err));
  }, []);

  return (
    <div className="max-w-6xl mx-auto py-10 px-4">
      <h1 className="text-4xl font-bold text-center mb-8">Welcome to WorkVouch</h1>
      <p className="text-center mb-12">Verified work history for real careers. Build trust and hire with confidence.</p>

      {/* Careers Section */}
      <section>
        <h2 className="text-2xl font-semibold mb-4">Explore Careers</h2>
        <CareersGrid />
      </section>

      {/* Admin-only ad placeholder (invisible to normal visitors) */}
      <section className="mt-16">
        <AdminAdPlaceholder location="homepage" />
      </section>

      {/* Visible Ads Section */}
      {ads.length > 0 && (
        <section className="mt-16">
          <h2 className="text-2xl font-semibold mb-4">Advertisements</h2>
          <div className="space-y-4">
            {ads.map(ad => (
              <div key={ad.id} className="border p-4 rounded bg-yellow-50">
                {ad.type === 'banner' && (
                  <a href={ad.link} target="_blank" rel="noopener noreferrer">
                    <img src={ad.content} alt={ad.title} className="w-full max-h-48 object-cover rounded" />
                  </a>
                )}
                {ad.type === 'text' && (
                  <div>
                    <h3 className="font-semibold mb-2">{ad.title}</h3>
                    <p>{ad.content}</p>
                    {ad.link && (
                      <a
                        href={ad.link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 underline mt-2 inline-block"
                      >
                        Learn more →
                      </a>
                    )}
                  </div>
                )}
                {ad.type === 'link' && ad.link && (
                  <a
                    href={ad.link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 underline font-semibold"
                  >
                    {ad.content || ad.title}
                  </a>
                )}
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
