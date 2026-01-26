'use client';
import { useState, useEffect } from 'react';
import { careers } from '../data/careers';

type AdType = 'banner' | 'native' | 'popup';
type AdStatus = 'pending' | 'active' | 'inactive';

interface Ad {
  id: string;
  type: AdType;
  title: string;
  image: string;
  link: string;
  careers: string[]; // Career IDs for targeting
  startDate: string;
  endDate: string;
  price: number; // Ad price in USD
  duration: number; // Duration in days
  status: AdStatus;
  createdBy: string;
  createdAt: string;
}

const STORAGE_KEY = 'workvouch_ads_enhanced';

export default function AdminAdsPanel() {
  const [ads, setAds] = useState<Ad[]>([]);
  const [selectedAd, setSelectedAd] = useState<Ad | null>(null);
  const [previewMode, setPreviewMode] = useState<'employee' | 'employer'>('employee');

  // Load ads from localStorage
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

  // Save ads to localStorage
  useEffect(() => {
    if (ads.length > 0 || localStorage.getItem(STORAGE_KEY)) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(ads));
    }
  }, [ads]);

  const addAd = () => {
    const newAd: Ad = {
      id: Date.now().toString(),
      type: 'banner',
      title: 'New Ad',
      image: '',
      link: '',
      careers: [],
      startDate: new Date().toISOString().split('T')[0],
      endDate: '',
      price: 0,
      duration: 30,
      status: 'pending',
      createdBy: 'admin',
      createdAt: new Date().toISOString(),
    };
    setAds([...ads, newAd]);
    setSelectedAd(newAd);
  };

  const updateAd = (id: string, field: keyof Ad, value: any) => {
    setAds(ads.map(a => a.id === id ? { ...a, [field]: value } : a));
    if (selectedAd && selectedAd.id === id) {
      setSelectedAd({ ...selectedAd, [field]: value });
    }
  };

  const toggleCareer = (adId: string, careerId: string) => {
    const ad = ads.find(a => a.id === adId);
    if (!ad) return;
    
    const newCareers = ad.careers.includes(careerId)
      ? ad.careers.filter(c => c !== careerId)
      : [...ad.careers, careerId];
    
    updateAd(adId, 'careers', newCareers);
  };

  const approveAd = (id: string) => {
    updateAd(id, 'status', 'active');
  };

  const deactivateAd = (id: string) => {
    updateAd(id, 'status', 'inactive');
  };

  const deleteAd = (id: string) => {
    if (confirm('Are you sure you want to delete this ad?')) {
      setAds(ads.filter(a => a.id !== id));
      if (selectedAd?.id === id) {
        setSelectedAd(null);
      }
    }
  };

  const pendingAds = ads.filter(a => a.status === 'pending');
  const activeAds = ads.filter(a => a.status === 'active');
  const inactiveAds = ads.filter(a => a.status === 'inactive');

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Advertising Management</h2>
          <p className="text-gray-600">Manage ads that appear on career pages. Ads are hidden until approved.</p>
        </div>
        <button
          onClick={addAd}
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          + Add New Ad
        </button>
      </div>

      {/* Preview Mode Toggle */}
      <div className="flex gap-4 border-b pb-4">
        <button
          onClick={() => setPreviewMode('employee')}
          className={`px-4 py-2 rounded ${
            previewMode === 'employee'
              ? 'bg-blue-600 text-white'
              : 'bg-gray-200 text-gray-700'
          }`}
        >
          Employee View
        </button>
        <button
          onClick={() => setPreviewMode('employer')}
          className={`px-4 py-2 rounded ${
            previewMode === 'employer'
              ? 'bg-blue-600 text-white'
              : 'bg-gray-200 text-gray-700'
          }`}
        >
          Employer View
        </button>
      </div>

      {/* Ad Lists */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Pending Approval */}
        <div className="border rounded-lg p-4">
          <h3 className="font-semibold text-yellow-600 mb-3">Pending Approval ({pendingAds.length})</h3>
          {pendingAds.length === 0 ? (
            <p className="text-sm text-gray-500">No pending ads</p>
          ) : (
            <div className="space-y-2">
              {pendingAds.map(ad => (
                <div key={ad.id} className="border p-3 rounded bg-yellow-50">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <p className="font-semibold text-sm">{ad.title}</p>
                      <p className="text-xs text-gray-600">{ad.type}</p>
                    </div>
                    <button
                      onClick={() => setSelectedAd(ad)}
                      className="text-xs text-blue-600 hover:underline"
                    >
                      Edit
                    </button>
                  </div>
                  <button
                    onClick={() => approveAd(ad.id)}
                    className="w-full text-xs bg-green-600 text-white px-2 py-1 rounded hover:bg-green-700"
                  >
                    Approve & Activate
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Active Ads */}
        <div className="border rounded-lg p-4">
          <h3 className="font-semibold text-green-600 mb-3">Active ({activeAds.length})</h3>
          {activeAds.length === 0 ? (
            <p className="text-sm text-gray-500">No active ads</p>
          ) : (
            <div className="space-y-2">
              {activeAds.map(ad => (
                <div key={ad.id} className="border p-3 rounded bg-green-50">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <p className="font-semibold text-sm">{ad.title}</p>
                      <p className="text-xs text-gray-600">{ad.type}</p>
                    </div>
                    <button
                      onClick={() => setSelectedAd(ad)}
                      className="text-xs text-blue-600 hover:underline"
                    >
                      Edit
                    </button>
                  </div>
                  <button
                    onClick={() => deactivateAd(ad.id)}
                    className="w-full text-xs bg-gray-600 text-white px-2 py-1 rounded hover:bg-gray-700"
                  >
                    Deactivate
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Inactive Ads */}
        <div className="border rounded-lg p-4">
          <h3 className="font-semibold text-gray-600 mb-3">Inactive ({inactiveAds.length})</h3>
          {inactiveAds.length === 0 ? (
            <p className="text-sm text-gray-500">No inactive ads</p>
          ) : (
            <div className="space-y-2">
              {inactiveAds.map(ad => (
                <div key={ad.id} className="border p-3 rounded bg-gray-50">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <p className="font-semibold text-sm">{ad.title}</p>
                      <p className="text-xs text-gray-600">{ad.type}</p>
                    </div>
                    <button
                      onClick={() => setSelectedAd(ad)}
                      className="text-xs text-blue-600 hover:underline"
                    >
                      Edit
                    </button>
                  </div>
                  <button
                    onClick={() => approveAd(ad.id)}
                    className="w-full text-xs bg-green-600 text-white px-2 py-1 rounded hover:bg-green-700"
                  >
                    Activate
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Ad Editor */}
      {selectedAd && (
        <div className="border rounded-lg p-6 bg-white">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-xl font-bold">Edit Ad: {selectedAd.title}</h3>
            <button
              onClick={() => setSelectedAd(null)}
              className="text-gray-500 hover:text-gray-700"
            >
              ✕ Close
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Basic Info */}
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold mb-1">Ad Type</label>
                <select
                  value={selectedAd.type}
                  onChange={e => updateAd(selectedAd.id, 'type', e.target.value as AdType)}
                  className="border p-2 w-full rounded"
                >
                  <option value="banner">Banner</option>
                  <option value="native">Native</option>
                  <option value="popup">Popup</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold mb-1">Title</label>
                <input
                  type="text"
                  value={selectedAd.title}
                  onChange={e => updateAd(selectedAd.id, 'title', e.target.value)}
                  className="border p-2 w-full rounded"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold mb-1">Image URL</label>
                <input
                  type="text"
                  value={selectedAd.image}
                  onChange={e => updateAd(selectedAd.id, 'image', e.target.value)}
                  className="border p-2 w-full rounded"
                  placeholder="https://example.com/image.jpg"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold mb-1">Destination URL</label>
                <input
                  type="text"
                  value={selectedAd.link}
                  onChange={e => updateAd(selectedAd.id, 'link', e.target.value)}
                  className="border p-2 w-full rounded"
                  placeholder="https://example.com"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold mb-1">Price (USD)</label>
                <input
                  type="number"
                  value={selectedAd.price}
                  onChange={e => updateAd(selectedAd.id, 'price', parseFloat(e.target.value) || 0)}
                  className="border p-2 w-full rounded"
                  placeholder="0.00"
                  min="0"
                  step="0.01"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold mb-1">Duration (days)</label>
                <input
                  type="number"
                  value={selectedAd.duration}
                  onChange={e => updateAd(selectedAd.id, 'duration', parseInt(e.target.value) || 0)}
                  className="border p-2 w-full rounded"
                  placeholder="30"
                  min="1"
                />
              </div>
            </div>

            {/* Dates & Targeting */}
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold mb-1">Start Date</label>
                <input
                  type="date"
                  value={selectedAd.startDate}
                  onChange={e => updateAd(selectedAd.id, 'startDate', e.target.value)}
                  className="border p-2 w-full rounded"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold mb-1">End Date (optional)</label>
                <input
                  type="date"
                  value={selectedAd.endDate}
                  onChange={e => updateAd(selectedAd.id, 'endDate', e.target.value)}
                  className="border p-2 w-full rounded"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold mb-2">Target Careers (leave empty for all)</label>
                <div className="border p-3 rounded max-h-40 overflow-y-auto">
                  {careers.map(career => (
                    <label key={career.id} className="flex items-center gap-2 mb-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={selectedAd.careers.includes(career.id)}
                        onChange={() => toggleCareer(selectedAd.id, career.id)}
                        className="cursor-pointer"
                      />
                      <span className="text-sm">{career.name}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Preview */}
          {selectedAd.image && (
            <div className="mt-6 border-t pt-4">
              <h4 className="font-semibold mb-2">Preview ({previewMode} view):</h4>
              <div className="border rounded p-4 bg-gray-50">
                {selectedAd.type === 'banner' && (
                  <a href={selectedAd.link || '#'} target="_blank" rel="noopener noreferrer">
                    <img
                      src={selectedAd.image}
                      alt={selectedAd.title}
                      className="w-full h-32 object-cover rounded"
                    />
                  </a>
                )}
                {selectedAd.type === 'native' && (
                  <div className="border rounded p-4 bg-white">
                    <img
                      src={selectedAd.image}
                      alt={selectedAd.title}
                      className="w-full h-24 object-cover rounded mb-2"
                    />
                    <h5 className="font-semibold">{selectedAd.title}</h5>
                  </div>
                )}
                {selectedAd.type === 'popup' && (
                  <div className="border rounded p-4 bg-white max-w-sm mx-auto">
                    <button className="float-right text-gray-500">✕</button>
                    <img
                      src={selectedAd.image}
                      alt={selectedAd.title}
                      className="w-full h-32 object-cover rounded mb-2"
                    />
                    <h5 className="font-semibold">{selectedAd.title}</h5>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="mt-6 flex gap-2">
            {selectedAd.status === 'pending' && (
              <button
                onClick={() => {
                  approveAd(selectedAd.id);
                  setSelectedAd(null);
                }}
                className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
              >
                Approve & Activate
              </button>
            )}
            {selectedAd.status === 'active' && (
              <button
                onClick={() => {
                  deactivateAd(selectedAd.id);
                  setSelectedAd(null);
                }}
                className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700"
              >
                Deactivate
              </button>
            )}
            <button
              onClick={() => deleteAd(selectedAd.id)}
              className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
            >
              Delete Ad
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
