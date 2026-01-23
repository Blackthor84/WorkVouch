import React from 'react';
import Link from 'next/link';

const careers = [
  {
    slug: 'healthcare',
    name: 'Healthcare',
    image: '/careers/healthcare.jpg',
  },
  {
    slug: 'law-enforcement',
    name: 'Law Enforcement',
    image: '/careers/law.jpg',
  },
  {
    slug: 'security',
    name: 'Security',
    image: '/careers/security.jpg',
  },
  {
    slug: 'warehouse-logistics',
    name: 'Warehouse & Logistics',
    image: '/careers/warehouse.jpg',
  },
  {
    slug: 'hospitality',
    name: 'Hospitality',
    image: '/careers/hospitality.jpg',
  },
  {
    slug: 'retail',
    name: 'Retail',
    image: '/careers/retail.jpg',
  },
];

export default function HomePage() {
  return (
    <div className="bg-gray-50 text-gray-900 min-h-screen">
      {/* Hero Section */}
      <header className="relative w-full h-96 bg-blue-700 flex items-center justify-center text-white">
        <h1 className="text-4xl md:text-6xl font-bold text-center px-4">
          Welcome to WorkVouch
        </h1>
      </header>

      {/* Main Info Section */}
      <section className="max-w-5xl mx-auto p-6 text-center">
        <p className="text-lg md:text-xl mb-4">
          WorkVouch helps employees prove their work experience and helps employers verify candidates quickly and reliably.
        </p>
        <div className="flex flex-wrap justify-center gap-4 mt-4">
          <Link href="/auth/signup" className="px-6 py-3 bg-blue-700 text-white font-semibold rounded-lg hover:bg-blue-800 transition">
            Sign Up
          </Link>
          <Link href="/auth/signin" className="px-6 py-3 border border-blue-700 text-blue-700 font-semibold rounded-lg hover:bg-blue-100 transition">
            Sign In
          </Link>
        </div>
      </section>

      {/* Careers Section */}
      <section className="max-w-6xl mx-auto p-6">
        <h2 className="text-3xl font-bold text-blue-700 mb-6 text-center">Explore Careers</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
          {careers.map((career) => (
            <Link
              key={career.slug}
              href={`/careers/${career.slug}`}
              className="relative group overflow-hidden rounded-xl shadow-lg hover:shadow-xl transition"
            >
              <img
                src={career.image}
                alt={career.name}
                className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-300"
              />
              <div className="absolute inset-0 bg-blue-700 bg-opacity-40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                <span className="text-white font-bold text-lg">{career.name}</span>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* Footer Section */}
      <footer className="bg-gray-200 text-gray-700 py-6 mt-12 text-center">
        <p>© {new Date().getFullYear()} WorkVouch. All rights reserved.</p>
      </footer>
    </div>
  );
}
