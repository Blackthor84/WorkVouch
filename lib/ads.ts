// Central ads data store (replace with DB later)
export interface Ad {
  id: number;
  title: string;
  type: 'banner' | 'text' | 'link';
  content: string; // image URL or text
  link?: string; // optional link for banner or text
  visible: boolean; // show/hide to users
}

// In-memory store (replace with Supabase/DB)
let ads: Ad[] = [
  { id: 1, title: 'Banner Ad', type: 'banner', content: '/placeholder.png', link: 'https://example.com', visible: false },
  { id: 2, title: 'Text Ad', type: 'text', content: 'Your Ad Here', visible: false },
];

export function getAds(): Ad[] {
  return ads;
}

export function getVisibleAds(): Ad[] {
  return ads.filter(ad => ad.visible);
}

export function addAd(ad: Omit<Ad, 'id'>): Ad {
  const newAd: Ad = { ...ad, id: Date.now() };
  ads.push(newAd);
  return newAd;
}

export function updateAd(id: number, updates: Partial<Ad>): Ad | null {
  const index = ads.findIndex(ad => ad.id === id);
  if (index === -1) return null;
  ads[index] = { ...ads[index], ...updates };
  return ads[index];
}

export function removeAd(id: number): boolean {
  const index = ads.findIndex(ad => ad.id === id);
  if (index === -1) return false;
  ads.splice(index, 1);
  return true;
}

export function toggleAdVisibility(id: number): Ad | null {
  const ad = ads.find(a => a.id === id);
  if (!ad) return null;
  ad.visible = !ad.visible;
  return ad;
}
