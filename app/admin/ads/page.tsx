'use client';

import { useEffect, useState } from 'react';
import { Ad } from '../../../types/ad';
import AdBanner from '../../../components/AdBanner';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

const careersList = [
  { id: 'healthcare', name: 'Healthcare' },
  { id: 'security', name: 'Security' },
  { id: 'law-enforcement', name: 'Law Enforcement' },
  { id: 'retail', name: 'Retail' },
  { id: 'hospitality', name: 'Hospitality' },
  { id: 'warehouse-logistics', name: 'Warehouse & Logistics' },
];

export default function AdsAdminPage() {
  const [ads, setAds] = useState<Ad[]>([]);
  const [editingAd, setEditingAd] = useState<Ad | null>(null);
  const [form, setForm] = useState<any>({ 
    title: '', 
    type: 'banner', 
    content: '', 
    linkUrl: '', 
    imageUrl: '',
    isActive: false,
    careers: []
  });

  useEffect(() => {
    fetch('/api/admin/ads')
      .then((res) => res.json())
      .then(setAds);
  }, []);

  const handleSave = async () => {
    const method = editingAd ? 'PUT' : 'POST';
    const body = editingAd ? { ...editingAd, ...form } : { ...form };
    const res = await fetch('/api/admin/ads', { 
      method, 
      headers: { 'Content-Type': 'application/json' }, 
      body: JSON.stringify(body) 
    });
    const data = await res.json();
    setAds((prev) => {
      if (editingAd) return prev.map((ad) => (ad.id === data.id ? data : ad));
      return [...prev, data];
    });
    setForm({ title: '', type: 'banner', content: '', linkUrl: '', imageUrl: '', isActive: false, careers: [] });
    setEditingAd(null);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this ad?')) return;
    await fetch(`/api/admin/ads?id=${id}`, { method: 'DELETE' });
    setAds((prev) => prev.filter((ad) => ad.id !== id));
  };

  return (
    <div className="max-w-5xl mx-auto py-10 px-4">
      <h1 className="text-3xl font-bold mb-6">Admin Ads Manager</h1>

      {/* Form */}
      <Card className="p-6 mb-8">
        <h2 className="text-xl font-semibold mb-4">
          {editingAd ? 'Edit Ad' : 'Create New Ad'}
        </h2>
        
        <div className="space-y-4">
          <div>
            <Label htmlFor="title">Title</Label>
            <Input
              id="title"
              placeholder="Ad Title"
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
            />
          </div>

          <div>
            <Label htmlFor="type">Type</Label>
            <select
              id="type"
              className="w-full border rounded p-2"
              value={form.type}
              onChange={(e) => setForm({ ...form, type: e.target.value })}
            >
              <option value="banner">Banner</option>
              <option value="native">Native</option>
              <option value="sidebar">Sidebar</option>
            </select>
          </div>

          <div>
            <Label htmlFor="linkUrl">Link URL</Label>
            <Input
              id="linkUrl"
              placeholder="https://example.com"
              value={form.linkUrl}
              onChange={(e) => setForm({ ...form, linkUrl: e.target.value })}
            />
          </div>

          <div>
            <Label htmlFor="imageUrl">Image URL (optional)</Label>
            <Input
              id="imageUrl"
              placeholder="https://example.com/image.jpg"
              value={form.imageUrl}
              onChange={(e) => setForm({ ...form, imageUrl: e.target.value })}
            />
          </div>

          <div>
            <Label htmlFor="content">Content (HTML)</Label>
            <textarea
              id="content"
              className="w-full border rounded p-2 min-h-[100px]"
              placeholder="HTML content for the ad"
              value={form.content}
              onChange={(e) => setForm({ ...form, content: e.target.value })}
            />
          </div>

          <div>
            <Label className="font-semibold mb-2 block">Target Careers (optional)</Label>
            <div className="grid grid-cols-2 gap-2">
              {careersList.map((career) => (
                <label key={career.id} className="flex items-center space-x-2 border p-2 rounded cursor-pointer hover:bg-gray-50">
                  <input
                    type="checkbox"
                    checked={form.careers?.includes(career.id)}
                    onChange={(e) => {
                      const newCareers = e.target.checked
                        ? [...(form.careers || []), career.id]
                        : (form.careers || []).filter((c: string) => c !== career.id);
                      setForm({ ...form, careers: newCareers });
                    }}
                  />
                  <span>{career.name}</span>
                </label>
              ))}
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              id="isActive"
              checked={form.isActive}
              onChange={(e) => setForm({ ...form, isActive: e.target.checked })}
            />
            <Label htmlFor="isActive" className="cursor-pointer">Active</Label>
          </div>

          <div className="flex gap-2">
            <Button onClick={handleSave}>
              {editingAd ? 'Update Ad' : 'Create Ad'}
            </Button>
            {editingAd && (
              <Button variant="secondary" onClick={() => {
                setEditingAd(null);
                setForm({ title: '', type: 'banner', content: '', linkUrl: '', imageUrl: '', isActive: false, careers: [] });
              }}>
                Cancel
              </Button>
            )}
          </div>
        </div>
      </Card>

      {/* Ads List */}
      <div className="space-y-4">
        <h2 className="text-2xl font-semibold mb-4">All Ads ({ads.length})</h2>
        {ads.length === 0 ? (
          <Card className="p-6 text-center text-gray-500">
            No ads created yet. Create your first ad above.
          </Card>
        ) : (
          ads.map((ad) => (
            <Card key={ad.id} className="p-4">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h2 className="font-bold text-lg">{ad.title}</h2>
                  <p className="text-sm text-gray-600">
                    Type: {ad.type} | Active: {ad.isActive ? 'Yes' : 'No'}
                    {ad.careers && ad.careers.length > 0 && (
                      <span className="ml-2">| Careers: {ad.careers.join(', ')}</span>
                    )}
                  </p>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => {
                      setEditingAd(ad);
                      setForm(ad);
                    }}
                  >
                    Edit
                  </Button>
                  <Button
                    variant="danger"
                    size="sm"
                    onClick={() => handleDelete(ad.id)}
                  >
                    Delete
                  </Button>
                </div>
              </div>
              <div className="mt-4 border-t pt-4">
                <strong className="text-sm text-gray-600">Preview (Admins Only)</strong>
                <div className="mt-2">
                  <AdBanner ad={ad} />
                </div>
              </div>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
