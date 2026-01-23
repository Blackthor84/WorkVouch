import Link from "next/link";

const careers = [
  "healthcare",
  "law",
  "security",
  "warehouse",
  "hospitality",
  "retail",
];

export default function CareersIndex() {
  return (
    <div className="max-w-4xl mx-auto py-20 px-6">
      <h1 className="text-4xl font-bold text-blue-700 mb-8">Careers</h1>
      <ul className="space-y-4 text-xl">
        {careers.map((c) => (
          <li key={c}>
            <Link href={`/careers/${c}`} className="text-blue-600 underline">
              {c.charAt(0).toUpperCase() + c.slice(1)}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
