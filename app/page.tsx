import Image from "next/image";
import Link from "next/link";

const careers = [
  { name: "Healthcare", image: "/careers/healthcare.jpg", link: "/careers/healthcare" },
  { name: "Law Enforcement", image: "/careers/law.jpg", link: "/careers/law" },
  { name: "Security", image: "/careers/security.jpg", link: "/careers/security" },
  { name: "Warehouse & Logistics", image: "/careers/warehouse.jpg", link: "/careers/warehouse" },
  { name: "Hospitality", image: "/careers/hospitality.jpg", link: "/careers/hospitality" },
  { name: "Retail", image: "/careers/retail.jpg", link: "/careers/retail" },
];

export default function Home() {
  return (
    <div className="bg-gray-50 min-h-screen">
      <header className="bg-blue-600 p-4 text-white flex justify-between items-center">
        <div className="text-xl font-bold">WorkVouch</div>
        <nav className="space-x-4">
          <Link href="/" className="hover:underline">Home</Link>
          <Link href="/about" className="hover:underline">About</Link>
          <Link href="/pricing" className="hover:underline">Pricing</Link>
          <Link href="/careers" className="hover:underline">Careers</Link>
        </nav>
      </header>
      <main className="p-8">
        <section className="text-center mb-12">
          <h1 className="text-4xl font-bold mb-4">Welcome to WorkVouch</h1>
          <p className="text-lg mb-6">WorkVouch helps employers and employees verify work history and build trust in any industry.</p>
          <div className="space-x-4">
            <Link href="/auth/signup" className="bg-blue-600 text-white px-6 py-3 rounded hover:bg-blue-700">Sign Up</Link>
            <Link href="/auth/signin" className="bg-gray-300 px-6 py-3 rounded hover:bg-gray-400">Sign In</Link>
          </div>
        </section>
        <section className="grid grid-cols-2 md:grid-cols-3 gap-6">
          {careers.map((career) => (
            <Link key={career.name} href={career.link} className="block bg-white p-4 rounded shadow hover:shadow-lg transition">
              <Image src={career.image} alt={career.name} width={400} height={250} className="rounded w-full h-48 object-cover" unoptimized/>
              <h2 className="text-center mt-2 font-semibold">{career.name}</h2>
            </Link>
          ))}
        </section>
      </main>
    </div>
  );
}
