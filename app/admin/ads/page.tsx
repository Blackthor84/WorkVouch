'use client';
import { useState, useEffect } from 'react';

interface Ad {
  id: number;
  title: string;
  type: 'banner' | 'text' | 'link';
  content: string; // image URL or text
  link?: string; // optional link for banner or text
  visible: boolean; // show/hide to users
}

export default function AdminAdsPage() {
  const [ads, setAds] = useState<Ad[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAds();
  }, []);

  const fetchAds = async () => {
    try {
      const res = await fetch('/api/ads');
      const data = await res.json();
      setAds(data);
    } catch (error) {
      console.error('Error fetching ads:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleVisibility = async (id: number) => {
    try {
      const res = await fetch('/api/ads', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, action: 'toggle' }),
      });
      if (res.ok) {
        fetchAds(); // Refresh list
      }
    } catch (error) {
      console.error('Error toggling visibility:', error);
    }
  };

  const addAd = async () => {
    try {
      const res = await fetch('/api/ads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: 'New Ad',
          type: 'text',
          content: 'New Ad Text',
          visible: false,
        }),
      });
      if (res.ok) {
        fetchAds(); // Refresh list
      }
    } catch (error) {
      console.error('Error adding ad:', error);
    }
  };

  const removeAd = async (id: number) => {
    if (!confirm('Are you sure you want to remove this ad?')) return;
    try {
      const res = await fetch(`/api/ads?id=${id}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        fetchAds(); // Refresh list
      }
    } catch (error) {
      console.error('Error removing ad:', error);
    }
  };

  const updateAd = async (id: number, updates: Partial<Ad>) => {
    try {
      const res = await fetch('/api/ads', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, ...updates }),
      });
      if (res.ok) {
        fetchAds(); // Refresh list
      }
    } catch (error) {
      console.error('Error updating ad:', error);
    }
  };

  if (loading) {
    return <div className="max-w-4xl mx-auto py-10 px-4">Loading...</div>;
  }

  return (
    <div className="max-w-4xl mx-auto py-10 px-4">
      <h1 className="text-3xl font-bold mb-6">Admin Ad Panel</h1>
      <button
        onClick={addAd}
        className="mb-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
      >
        Add Ad
      </button>
      <div className="space-y-4">
        {ads.map(ad => (
          <div key={ad.id} className="border p-4 rounded flex justify-between items-center">
            <div className="flex-1">
              <h2 className="font-semibold">{ad.title} ({ad.type})</h2>
              {ad.type === 'banner' && (
                <img src={ad.content} alt={ad.title} className="mt-2 max-h-24" />
              )}
              {ad.type === 'text' && <p className="mt-2">{ad.content}</p>}
              {ad.link && (
                <p className="text-blue-600 underline mt-1 text-sm">{ad.link}</p>
              )}
            </div>
            <div className="space-y-2 ml-4">
              <button
                onClick={() => toggleVisibility(ad.id)}
                className={`px-4 py-1 rounded text-sm ${
                  ad.visible ? 'bg-green-500 text-white' : 'bg-gray-300'
                }`}
              >
                {ad.visible ? 'Visible' : 'Hidden'}
              </button>
              <button
                onClick={() => removeAd(ad.id)}
                className="px-4 py-1 rounded bg-red-500 text-white hover:bg-red-600 text-sm block w-full"
              >
                Remove
              </button>
            </div>
          </div>
        ))}
        {ads.length === 0 && (
          <p className="text-gray-500 text-center py-8">No ads yet. Click "Add Ad" to create one.</p>
        )}
      </div>
    </div>
  );
}
