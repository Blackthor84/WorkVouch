"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";

/**
 * Security Bundle Feature: License Management
 * 
 * Allows security agencies to upload and verify guard licenses
 */
export default function LicenseManagement() {
  const session = useSession();
  const user = session?.data?.user || null;
  const [licenses, setLicenses] = useState<any[]>([]);
  const [uploading, setUploading] = useState(false);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      // TODO: Implement file upload to Supabase storage
      const formData = new FormData();
      formData.append("file", file);
      formData.append("type", "license");

      const response = await fetch("/api/security/upload-license", {
        method: "POST",
        body: formData,
      });

      const data = await response.json();
      if (data.success) {
        setLicenses([...licenses, data.license]);
      }
    } catch (error) {
      console.error("Upload error:", error);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">
          License Management
        </h1>

        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Upload Guard License</h2>
          <input
            type="file"
            accept=".pdf,.jpg,.jpeg,.png"
            onChange={handleUpload}
            disabled={uploading}
            className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
          />
          {uploading && <p className="text-sm text-gray-500 mt-2">Uploading...</p>}
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4">Uploaded Licenses</h2>
          {licenses.length === 0 ? (
            <p className="text-gray-500">No licenses uploaded yet</p>
          ) : (
            <div className="space-y-4">
              {licenses.map((license) => (
                <div key={license.id} className="border rounded-lg p-4">
                  <h3 className="font-semibold">{license.name}</h3>
                  <p className="text-sm text-gray-500">
                    Expires: {license.expirationDate}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
