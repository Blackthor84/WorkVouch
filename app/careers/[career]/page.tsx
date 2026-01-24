import { notFound } from "next/navigation";
import { getCareerBySlug, getCareers } from "@/lib/careers";
import { PricingModal } from "@/components/PricingModal";

// Employer Pricing
const employerPricing = [
  {
    tier: "Basic",
    price: "$49/mo",
    color: "bg-purple-100 text-purple-900",
    benefits: [
      "Post up to 10 jobs/month",
      "Access to verified employee reviews",
      "Basic support",
    ],
    priceId: "price_1ABC123Basic",
  },
  {
    tier: "Pro",
    price: "$99/mo",
    color: "bg-purple-200 text-purple-900",
    benefits: [
      "Unlimited job postings",
      "Advanced analytics dashboard",
      "Priority support",
    ],
    priceId: "price_1ABC123Pro",
  },
  {
    tier: "Enterprise",
    price: "$199/mo",
    color: "bg-purple-300 text-purple-900",
    benefits: [
      "Dedicated account manager",
      "Custom integrations",
      "Full support & SLA",
    ],
    priceId: "price_1ABC123Enterprise",
  },
];

// Employee Pricing
const employeePricing = [
  {
    tier: "Free",
    price: "$0",
    color: "bg-yellow-100 text-yellow-900",
    benefits: [
      "Create basic WorkVouch profile",
      "Receive and display peer references",
      "Access to limited job listings",
    ],
    priceId: "",
  },
  {
    tier: "Standard",
    price: "$9.99/mo",
    color: "bg-orange-100 text-orange-900",
    benefits: ["Access to verified reviews", "Apply to jobs directly"],
    priceId: "price_1ABC123EmpStd",
  },
  {
    tier: "Premium",
    price: "$19.99/mo",
    color: "bg-orange-200 text-orange-900",
    benefits: ["All Standard benefits", "Priority notifications", "Advanced profile insights"],
    priceId: "price_1ABC123EmpPremium",
  },
];

export async function generateStaticParams() {
  const careers = await getCareers();
  return careers.map((c) => ({ career: c.slug }));
}

export default async function CareerPage({ params }: { params: { career: string } }) {
  const career = await getCareerBySlug(params.career);
  if (!career) return notFound();

  return (
    <div className="max-w-5xl mx-auto p-6">
      <h1 className="text-4xl font-bold mb-6 text-blue-700">{career.name}</h1>

      <img
        src={career.image || "/placeholder.png"} // fallback image
        alt={career.name || "Career image"}     // always provide alt
        width={800}
        height={400}
        className="rounded-lg mb-6 shadow-lg object-cover w-full"
      />

      {career.description && (
        <p className="text-lg text-gray-700 mb-6">{career.description}</p>
      )}

      <section className="mb-10">
        <h2 className="text-2xl font-semibold mb-4 text-blue-700">Why Employers Choose WorkVouch</h2>
        <ul className="list-disc list-inside space-y-2 text-lg mb-6">
          {career.employers?.length
            ? career.employers.map((item, idx) => <li key={idx}>{item}</li>)
            : <li>No employer benefits listed yet.</li>}
        </ul>
      </section>

      <section className="mb-10">
        <h2 className="text-2xl font-semibold mb-4 text-green-700">Benefits for Employees</h2>
        <ul className="list-disc list-inside space-y-2 text-lg mb-6">
          {career.employees?.length
            ? career.employees.map((item, idx) => <li key={idx}>{item}</li>)
            : <li>No employee benefits listed yet.</li>}
        </ul>
      </section>

      {/* Employer Pricing */}
      <section className="mb-10">
        <h2 className="text-2xl font-semibold mt-8 mb-4 text-purple-700">Employer Pricing</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {employerPricing.map((tier, idx) => (
            <div key={idx} className={`p-6 rounded-xl shadow-lg transform transition-transform hover:scale-105 hover:shadow-2xl ${tier.color}`}>
              <h3 className="text-xl font-bold mb-2">{tier.tier}</h3>
              <p className="text-lg font-semibold mb-4">{tier.price}</p>
              <ul className="list-disc list-inside space-y-1">
                {tier.benefits.map((b, i) => <li key={i}>{b}</li>)}
              </ul>
              <PricingModal tier={tier.tier} price={tier.price} benefits={tier.benefits} priceId={tier.priceId} />
            </div>
          ))}
        </div>
      </section>

      {/* Employee Pricing */}
      <section className="mb-10">
        <h2 className="text-2xl font-semibold mt-8 mb-4 text-orange-700">Employee Pricing</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {employeePricing.map((tier, idx) => (
            <div key={idx} className={`p-6 rounded-xl shadow-lg transform transition-transform hover:scale-105 hover:shadow-2xl ${tier.color}`}>
              <h3 className="text-xl font-bold mb-2">{tier.tier}</h3>
              <p className="text-lg font-semibold mb-4">{tier.price}</p>
              <ul className="list-disc list-inside space-y-1">
                {tier.benefits.map((b, i) => <li key={i}>{b}</li>)}
              </ul>
              <PricingModal tier={tier.tier} price={tier.price} benefits={tier.benefits} priceId={tier.priceId} />
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
