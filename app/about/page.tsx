import Link from "next/link";

export default function About() {
  return (
    <div className="bg-gray-50 min-h-screen py-16 px-6">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl font-bold text-blue-700 mb-8">About WorkVouch</h1>
        
        <div className="bg-white shadow-md rounded-xl p-8 mb-8">
          <h2 className="text-2xl font-semibold text-blue-700 mb-4">Our Mission</h2>
          <p className="text-gray-700 mb-4">
            WorkVouch brings accountability and transparency to the workforce. We help employers make better hiring decisions and employees build credible, verified work histories.
          </p>
          <p className="text-gray-700">
            Our platform ensures that work history is verified, portable, and trusted by all parties.
          </p>
        </div>

        <div className="bg-white shadow-md rounded-xl p-8 mb-8">
          <h2 className="text-2xl font-semibold text-blue-700 mb-4">How It Works</h2>
          <ul className="space-y-3 text-gray-700">
            <li>✔ Employees create verified work history profiles</li>
            <li>✔ Employers verify past employment and performance</li>
            <li>✔ All records are permanent and portable</li>
            <li>✔ Trust scores help both sides make informed decisions</li>
          </ul>
        </div>

        <div className="text-center">
          <Link href="/auth/signup" className="bg-blue-700 text-white px-6 py-3 rounded-lg hover:bg-blue-800 transition">
            Get Started
          </Link>
        </div>
      </div>
    </div>
  );
}
