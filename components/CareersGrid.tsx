import Link from "next/link";
import { careers } from "@/data/careers";

export default function CareersGrid() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 p-6">
      {careers.map((career) => (
        <Link key={career.id} href={`/careers/${career.id}`}>
          <div className="flex items-center justify-center h-40 bg-blue-100 hover:bg-blue-200 rounded-lg shadow-lg text-lg font-bold text-center transition-all cursor-pointer">
            {career.name}
          </div>
        </Link>
      ))}
    </div>
  );
}
