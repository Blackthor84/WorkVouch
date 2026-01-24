// app/careers/page.tsx
import Link from "next/link";
import Image from "next/image";
import { careers } from "@/data/careers";

export default function CareersPage() {
  return (
    <div className="max-w-6xl mx-auto py-20 px-6">
      <h1 className="text-4xl font-bold mb-10 text-center">
        Explore Careers on WorkVouch
      </h1>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-10">
        {careers.map((career) => (
          <Link key={career.id} href={`/careers/${career.id}`}>
            <div className="border rounded-xl shadow-md hover:shadow-xl transition p-4 cursor-pointer">
              <Image
                src={career.image}
                alt={career.name}
                width={600}
                height={400}
                className="rounded-lg object-cover w-full h-48"
              />
              <h2 className="text-xl font-semibold mt-4">{career.name}</h2>
              <p className="text-gray-600 mt-2 line-clamp-3">{career.description}</p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
