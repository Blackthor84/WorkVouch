import React from "react";
import Link from "next/link";
import CareersSection from "./components/CareersSection";

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <section className="bg-blue-700 text-white py-20">
        <div className="max-w-5xl mx-auto text-center px-4">
          <h1 className="text-5xl font-bold mb-6">Welcome to WorkVouch</h1>
          <p className="text-xl mb-8">
            Verified employment history, trusted references, and smarter hiring – all in one place.
          </p>
          <div className="flex justify-center gap-4">
            <Link
              href="/auth/signup"
              className="bg-white text-blue-700 font-semibold px-6 py-3 rounded shadow hover:bg-gray-100 transition"
            >
              Sign Up
            </Link>
            <Link
              href="/auth/signin"
              className="bg-gray-100 text-blue-700 font-semibold px-6 py-3 rounded shadow hover:bg-white transition"
            >
              Log In
            </Link>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 max-w-5xl mx-auto px-4">
        <h2 className="text-3xl font-bold text-blue-700 mb-10 text-center">
          Why WorkVouch Works
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
          <div className="bg-white p-6 rounded-lg shadow hover:shadow-lg transition">
            <h3 className="text-xl font-semibold mb-2">For Employers</h3>
            <p>
              Quickly verify skills, reduce hiring risk, and find trusted employees.
            </p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow hover:shadow-lg transition">
            <h3 className="text-xl font-semibold mb-2">For Employees</h3>
            <p>
              Showcase verified experience, gain credibility, and boost job opportunities.
            </p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow hover:shadow-lg transition">
            <h3 className="text-xl font-semibold mb-2">Fast & Reliable</h3>
            <p>
              Our platform ensures quick, trustworthy references so everyone benefits.
            </p>
          </div>
        </div>
      </section>

      {/* Careers Section with Modal */}
      <CareersSection />
    </div>
  );
}
