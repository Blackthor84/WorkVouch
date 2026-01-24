import Link from "next/link";
import { getCareers } from "@/lib/careers";

export default async function CareersList() {
  const careers = await getCareers();

  return (
    <div className="bg-gray-50 min-h-screen py-16 px-6">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-4xl font-bold text-center text-blue-700 mb-12">
          Explore Careers With WorkVouch
        </h1>
        
        <div className="grid md:grid-cols-3 gap-8">
          {careers.map((career) => (
            <Link key={career.slug} href={`/careers/${career.slug}`}>
              <div className="bg-white rounded-lg shadow-lg overflow-hidden hover:shadow-2xl transition transform hover:scale-105 cursor-pointer">
                <img
                  src={career.image || "/placeholder.png"}
                  alt={career.name}
                  className="rounded-t-lg shadow-lg object-cover w-full h-64"
                />
                <div className="p-6">
                  <h2 className="text-2xl font-bold text-blue-700 mb-2">{career.name}</h2>
                  {career.description && (
                    <p className="text-gray-600">{career.description}</p>
                  )}
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
