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

export default function AdsManager() {
  const [ads, setAds] = useState<Ad[]>([]);

  // Load ads from localStorage on mount
  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        setAds(JSON.parse(stored));
      } catch (e) {
        console.error('Error loading ads:', e);
      }
    }
  }, []);

  // Save ads to localStorage whenever they change
  useEffect(() => {
    if (ads.length > 0 || localStorage.getItem(STORAGE_KEY)) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(ads));
    }
  }, [ads]);

  const addAd = () => {
    const newAd: Ad = {
      id: Date.now().toString(),
      title: 'New Ad',
      image: '',
      link: '',
      active: false,
    };
    setAds([...ads, newAd]);
  };

  const toggleActive = (id: string) => {
    setAds(ads.map(ad => ad.id === id ? { ...ad, active: !ad.active } : ad));
  };

  const updateAd = (id: string, field: keyof Ad, value: string | boolean) => {
    setAds(ads.map(a => a.id === id ? { ...a, [field]: value } : a));
  };

  const deleteAd = (id: string) => {
    if (confirm('Are you sure you want to delete this ad?')) {
      setAds(ads.filter(a => a.id !== id));
    }
  };

  return (
    <div className="p-4 border rounded shadow-md">
      <h2 className="text-xl font-bold mb-4">Ads Manager (Admin Only)</h2>
      <button 
        onClick={addAd} 
        className="mb-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
      >
        Add Ad
      </button>
      {ads.length === 0 && (
        <p className="text-gray-500 text-center py-4">No ads yet. Click "Add Ad" to create one.</p>
      )}
      {ads.map(ad => (
        <div key={ad.id} className="mb-4 border p-4 rounded bg-gray-50">
          <div className="flex justify-between items-start mb-2">
            <h3 className="font-semibold">Ad #{ad.id.slice(-6)}</h3>
            <button
              onClick={() => deleteAd(ad.id)}
              className="px-3 py-1 bg-red-500 text-white rounded text-sm hover:bg-red-600"
            >
              Delete
            </button>
          </div>
          <input 
            type="text" 
            placeholder="Title" 
            value={ad.title} 
            onChange={e => updateAd(ad.id, 'title', e.target.value)} 
            className="border p-2 w-full mb-2 rounded"
          />
          <input 
            type="text" 
            placeholder="Image URL" 
            value={ad.image} 
            onChange={e => updateAd(ad.id, 'image', e.target.value)} 
            className="border p-2 w-full mb-2 rounded"
          />
          <input 
            type="text" 
            placeholder="Link URL" 
            value={ad.link} 
            onChange={e => updateAd(ad.id, 'link', e.target.value)} 
            className="border p-2 w-full mb-2 rounded"
          />
          <label className="flex items-center gap-2 cursor-pointer">
            <input 
              type="checkbox" 
              checked={ad.active} 
              onChange={() => toggleActive(ad.id)}
              className="cursor-pointer"
            />
            <span className={ad.active ? 'text-green-600 font-semibold' : 'text-gray-600'}>
              {ad.active ? 'Active (visible on homepage)' : 'Inactive (hidden)'}
            </span>
          </label>
          {ad.image && (
            <div className="mt-2">
              <p className="text-sm text-gray-600 mb-1">Preview:</p>
              <img src={ad.image} alt={ad.title} className="max-w-xs max-h-32 object-cover rounded border" />
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
