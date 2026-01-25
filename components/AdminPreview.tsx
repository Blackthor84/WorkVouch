'use client';
import { useState } from 'react';
import { careers } from '../data/careers';
import Image from 'next/image';

type ViewMode = 'employee' | 'employer' | 'onboarding';
type CareerId = typeof careers[number]['id'];

export default function AdminPreview() {
  const [selectedCareer, setSelectedCareer] = useState<CareerId>(careers[0].id);
  const [viewMode, setViewMode] = useState<ViewMode>('employee');

  const currentCareer = careers.find(c => c.id === selectedCareer);

  // Map career IDs to image filenames
  const getImagePath = (careerId: string): string => {
    const imageMap: Record<string, string> = {
      'healthcare': 'healthcare',
      'warehouse-logistics': 'warehouse',
      'security': 'security',
      'retail': 'retail',
      'law-enforcement': 'law',
      'hospitality': 'hospitality',
    };
    const baseName = imageMap[careerId] || careerId;
    return `/images/careers/${baseName}.jpg`;
  };

  return (
    <div className="space-y-6">
      {/* View Mode Selector */}
      <div className="flex gap-4 border-b pb-4">
        <button
          onClick={() => setViewMode('employee')}
          className={`px-4 py-2 rounded ${
            viewMode === 'employee'
              ? 'bg-blue-600 text-white'
              : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
          }`}
        >
          Employee View
        </button>
        <button
          onClick={() => setViewMode('employer')}
          className={`px-4 py-2 rounded ${
            viewMode === 'employer'
              ? 'bg-blue-600 text-white'
              : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
          }`}
        >
          Employer View
        </button>
        <button
          onClick={() => setViewMode('onboarding')}
          className={`px-4 py-2 rounded ${
            viewMode === 'onboarding'
              ? 'bg-blue-600 text-white'
              : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
          }`}
        >
          Onboarding Preview
        </button>
      </div>

      {/* Career Selector */}
      {viewMode !== 'onboarding' && (
        <div className="flex gap-2 flex-wrap">
          {careers.map((career) => (
            <button
              key={career.id}
              onClick={() => setSelectedCareer(career.id)}
              className={`px-3 py-1 rounded ${
                selectedCareer === career.id
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              {career.name}
            </button>
          ))}
        </div>
      )}

      {/* Preview Content */}
      <div className="border rounded-lg p-6 bg-white">
        {viewMode === 'employee' && currentCareer && (
          <div>
            <h2 className="text-2xl font-bold mb-4">Employee Career Preview: {currentCareer.name}</h2>
            <Image
              src={getImagePath(currentCareer.id)}
              alt={currentCareer.name}
              width={800}
              height={400}
              className="w-full h-64 object-contain rounded-lg mb-6 bg-gray-50"
              unoptimized
            />
            <p className="text-lg mb-6">{currentCareer.heroText}</p>
            <div>
              <h3 className="text-xl font-semibold mb-3">Why Employees Should Use WorkVouch</h3>
              <ul className="list-disc pl-6 space-y-2">
                {currentCareer.whyForEmployees.map((reason, i) => (
                  <li key={i}>{reason}</li>
                ))}
              </ul>
            </div>
          </div>
        )}

        {viewMode === 'employer' && currentCareer && (
          <div>
            <h2 className="text-2xl font-bold mb-4">Employer Career Preview: {currentCareer.name}</h2>
            <Image
              src={getImagePath(currentCareer.id)}
              alt={currentCareer.name}
              width={800}
              height={400}
              className="w-full h-64 object-contain rounded-lg mb-6 bg-gray-50"
              unoptimized
            />
            <p className="text-lg mb-6">{currentCareer.heroText}</p>
            <div>
              <h3 className="text-xl font-semibold mb-3">Why Employers Should Use WorkVouch</h3>
              <ul className="list-disc pl-6 space-y-2">
                {currentCareer.whyForEmployers.map((reason, i) => (
                  <li key={i}>{reason}</li>
                ))}
              </ul>
            </div>
          </div>
        )}

        {viewMode === 'onboarding' && (
          <div>
            <h2 className="text-2xl font-bold mb-6">Employer Onboarding Preview</h2>
            <div className="space-y-8">
              {/* Step 1 */}
              <div className="border-l-4 border-blue-600 pl-4">
                <h3 className="text-xl font-semibold mb-2">Step 1: Create Company Profile</h3>
                <p className="text-gray-700">
                  Employers enter their company name, industry, and location. This creates their employer account
                  and sets up their profile for job posting.
                </p>
                <div className="mt-3 p-4 bg-gray-50 rounded">
                  <p className="text-sm text-gray-600">Example:</p>
                  <ul className="list-disc pl-5 mt-2 text-sm">
                    <li>Company: General Hospital</li>
                    <li>Industry: Healthcare</li>
                    <li>Location: New York, NY</li>
                  </ul>
                </div>
              </div>

              {/* Step 2 */}
              <div className="border-l-4 border-blue-600 pl-4">
                <h3 className="text-xl font-semibold mb-2">Step 2: Verify Business</h3>
                <p className="text-gray-700">
                  Employers can verify their business by uploading documents or connecting their business account.
                  Verification increases trust and unlocks premium features.
                </p>
                <div className="mt-3 p-4 bg-gray-50 rounded">
                  <p className="text-sm text-gray-600">Verification Options:</p>
                  <ul className="list-disc pl-5 mt-2 text-sm">
                    <li>Upload business license</li>
                    <li>Connect business email domain</li>
                    <li>Verify phone number</li>
                  </ul>
                </div>
              </div>

              {/* Step 3 */}
              <div className="border-l-4 border-blue-600 pl-4">
                <h3 className="text-xl font-semibold mb-2">Step 3: Post First Job</h3>
                <p className="text-gray-700">
                  Employers create their first job posting with details like job title, requirements, location,
                  and compensation. Jobs are visible to verified employees in the matching industry.
                </p>
                <div className="mt-3 p-4 bg-gray-50 rounded">
                  <p className="text-sm text-gray-600">Job Post Fields:</p>
                  <ul className="list-disc pl-5 mt-2 text-sm">
                    <li>Job Title: Registered Nurse</li>
                    <li>Requirements: RN License, 2+ years experience</li>
                    <li>Location: Hospital, New York</li>
                    <li>Employment Type: Full-time</li>
                  </ul>
                </div>
              </div>

              {/* Step 4 */}
              <div className="border-l-4 border-blue-600 pl-4">
                <h3 className="text-xl font-semibold mb-2">Step 4: Review Applicants</h3>
                <p className="text-gray-700">
                  Employers can view applicant profiles with verified work history, trust scores, and peer references.
                  They can filter by experience, certifications, and trust score.
                </p>
                <div className="mt-3 p-4 bg-gray-50 rounded">
                  <p className="text-sm text-gray-600">Applicant Information:</p>
                  <ul className="list-disc pl-5 mt-2 text-sm">
                    <li>Verified work history</li>
                    <li>Trust score and peer references</li>
                    <li>Certifications and skills</li>
                    <li>Contact information</li>
                  </ul>
                </div>
              </div>

              {/* Step 5 */}
              <div className="border-l-4 border-blue-600 pl-4">
                <h3 className="text-xl font-semibold mb-2">Step 5: Hire with Confidence</h3>
                <p className="text-gray-700">
                  Employers make hiring decisions based on verified credentials and peer references. They can
                  request additional verification if needed and track their hiring success.
                </p>
                <div className="mt-3 p-4 bg-gray-50 rounded">
                  <p className="text-sm text-gray-600">Hiring Tools:</p>
                  <ul className="list-disc pl-5 mt-2 text-sm">
                    <li>Request verification from previous employers</li>
                    <li>View detailed work history reports</li>
                    <li>Contact references directly</li>
                    <li>Track hiring metrics</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
