'use client';

import { useEffect, useState } from 'react';

interface AdminAdPlaceholderProps {
  location: 'homepage' | 'career-page';
}

export default function AdminAdPlaceholder({ location }: AdminAdPlaceholderProps) {
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check if user is admin by fetching user roles
    fetch('/api/user/me')
      .then((res) => {
        if (!res.ok) {
          setLoading(false);
          return null;
        }
        return res.json();
      })
      .then((data) => {
        if (data?.roles) {
          const roles = Array.isArray(data.roles) ? data.roles : [data.roles];
          if (roles.includes('admin') || roles.includes('superadmin')) {
            setIsAdmin(true);
          }
        }
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  // Invisible to non-admins and while loading
  if (loading || !isAdmin) {
    return null;
  }

  return (
    <div className="border-2 border-dashed border-gray-300 bg-gray-50 p-4 rounded-lg my-4">
      <p className="text-sm text-gray-500 text-center">
        📢 Ad Placeholder ({location === 'homepage' ? 'Banner/Native Ads' : 'Career-Specific Ads'})
      </p>
      <p className="text-xs text-gray-400 text-center mt-1">
        Visible to admins only
      </p>
    </div>
  );
}
