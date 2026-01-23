import Link from "next/link";
import { PricingTier } from "@/lib/cursor-bundle";

interface PricingCardProps extends PricingTier {
  onClick?: () => void;
}

export default function PricingCard({ tier, price, benefits, onClick }: PricingCardProps) {
  // Prefill query param: ?plan=Starter
  const prefillQuery = `?plan=${encodeURIComponent(tier)}`;

  return (
    <div className="border rounded-xl p-6 shadow-lg flex flex-col items-start space-y-4 bg-white hover:shadow-xl transition">
      <h3 className="text-xl font-bold">{tier}</h3>
      <p className="text-2xl font-semibold text-blue-700">{price}</p>
      <ul className="list-disc list-inside space-y-1 text-gray-700 flex-grow">
        {benefits.map((b, i) => (
          <li key={i} className="text-sm">{b}</li>
        ))}
      </ul>
      <Link 
        href={`/auth/signup${prefillQuery}`}
        className="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition w-full text-center"
        onClick={onClick}
      >
        Sign Up
      </Link>
    </div>
  );
}
