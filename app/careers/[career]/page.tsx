import React from "react";
import Image from "next/image";
import { PricingModal } from "@/components/PricingModal";

interface CareerData {
  name: string;
  image: string;
  employers?: string[];
  employees?: string[];
}

const careers: Record<string, CareerData> = {
  healthcare: {
    name: "Healthcare",
    image: "/careers/healthcare.jpg",
    employers: [
      "Verify skilled staff quickly and efficiently.",
      "Reduce hiring risk with peer-reviewed references.",
      "Streamline onboarding with trusted employee history.",
    ],
    employees: [
      "Showcase your verified experience to top employers.",
      "Gain recognition for your healthcare skills.",
      "Increase opportunities with credible references.",
    ],
  },
  law_enforcement: {
    name: "Law Enforcement",
    image: "/careers/law.jpg",
    employers: [
      "Ensure officers meet verified credentials and background checks.",
      "Save time on reference verification.",
      "Hire candidates with trustworthy peer recommendations.",
    ],
    employees: [
      "Demonstrate your law enforcement experience instantly.",
      "Build trust with potential departments.",
      "Stand out with verified endorsements from past colleagues.",
    ],
  },
  security: {
    name: "Security",
    image: "/careers/security.jpg",
    employers: [
      "Quickly verify guards and staff for contracts.",
      "Minimize hiring risks with verified work history.",
      "Hire trusted employees with peer-validated references.",
    ],
    employees: [
      "Prove your reliability with verified work records.",
      "Highlight skills to multiple security firms.",
      "Increase employability with trusted peer reviews.",
    ],
  },
  warehouse: {
    name: "Warehouse & Logistics",
    image: "/careers/warehouse.jpg",
    employers: [
      "Hire reliable warehouse staff fast.",
      "Check previous work history and reliability instantly.",
      "Reduce turnover with verified employees.",
    ],
    employees: [
      "Showcase experience in logistics and warehouse operations.",
      "Gain credibility with verified employer endorsements.",
      "Open opportunities at top logistics companies.",
    ],
  },
  hospitality: {
    name: "Hospitality",
    image: "/careers/hospitality.jpg",
    employers: [
      "Hire staff with verified customer service experience.",
      "Ensure quality with peer-reviewed references.",
      "Reduce turnover and onboarding time.",
    ],
    employees: [
      "Highlight your hospitality and service experience.",
      "Get recognized by top hotels and restaurants.",
      "Prove your reliability with verified references.",
    ],
  },
  retail: {
    name: "Retail",
    image: "/careers/retail.jpg",
    employers: [
      "Quickly hire trusted retail staff.",
      "Verify sales experience and reliability.",
      "Minimize hiring risk with peer-verified references.",
    ],
    employees: [
      "Showcase your retail and customer service experience.",
      "Build credibility with previous employers.",
      "Stand out in a competitive retail job market.",
    ],
  },
};

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
    priceId: "price_1ABC123Basic", // Replace with actual Stripe Price ID
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
    priceId: "price_1ABC123Pro", // Replace with actual Stripe Price ID
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
    priceId: "price_1ABC123Enterprise", // Replace with actual Stripe Price ID
  },
];

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
    priceId: "", // Free tier - no Stripe checkout
  },
  {
    tier: "Standard",
    price: "$9.99/mo",
    color: "bg-orange-100 text-orange-900",
    benefits: [
      "Access to verified reviews",
      "Apply to jobs directly",
    ],
    priceId: "price_1ABC123EmpStd", // Replace with actual Stripe Price ID
  },
  {
    tier: "Premium",
    price: "$19.99/mo",
    color: "bg-orange-200 text-orange-900",
    benefits: [
      "All Standard benefits",
      "Priority notifications",
      "Advanced profile insights",
    ],
    priceId: "price_1ABC123EmpPremium", // Replace with actual Stripe Price ID
  },
];

type CareerPageProps = {
  params: { career: string };
};

export default function CareerPage({ params }: CareerPageProps) {
  const careerKey = params.career as keyof typeof careers;
  const career = careers[careerKey];

  if (!career) {
    return (
      <div className="max-w-5xl mx-auto p-6">
        <p className="text-red-600">Career not found.</p>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto p-6">
      <h1 className="text-4xl font-bold mb-6 text-blue-700">{career.name}</h1>
      
      <Image
        src={career.image}
        alt={career.name}
        width={800}
        height={400}
        className="rounded-lg mb-6 shadow-lg object-cover w-full"
        unoptimized
        loading="eager"
      />

      <section className="mb-10">
        <h2 className="text-2xl font-semibold mb-4 text-blue-700">
          Why Employers Choose WorkVouch
        </h2>
        <ul className="list-disc list-inside space-y-2 text-lg mb-6">
          {career.employers?.length ? (
            career.employers.map((item, idx) => <li key={idx}>{item}</li>)
          ) : (
            <li>No employer benefits listed yet.</li>
          )}
        </ul>
      </section>

      <section className="mb-10">
        <h2 className="text-2xl font-semibold mb-4 text-green-700">
          Benefits for Employees
        </h2>
        <ul className="list-disc list-inside space-y-2 text-lg mb-6">
          {career.employees?.length ? (
            career.employees.map((item, idx) => <li key={idx}>{item}</li>)
          ) : (
            <li>No employee benefits listed yet.</li>
          )}
        </ul>
      </section>

      {/* Employer Pricing */}
      <section className="mb-10">
        <h2 className="text-2xl font-semibold mt-8 mb-4 text-purple-700">
          Employer Pricing
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {employerPricing.map((tier, idx) => (
            <div
              key={idx}
              className={`p-6 rounded-xl shadow-lg transform transition-transform hover:scale-105 hover:shadow-2xl ${tier.color}`}
            >
              <h3 className="text-xl font-bold mb-2">{tier.tier}</h3>
              <p className="text-lg font-semibold mb-4">{tier.price}</p>
              <ul className="list-disc list-inside space-y-1">
                {tier.benefits.map((b, i) => (
                  <li key={i}>{b}</li>
                ))}
              </ul>
              <PricingModal
                tier={tier.tier}
                price={tier.price}
                benefits={tier.benefits}
                priceId={tier.priceId}
              />
            </div>
          ))}
        </div>
      </section>

      {/* Employee Pricing */}
      <section className="mb-10">
        <h2 className="text-2xl font-semibold mt-8 mb-4 text-orange-700">
          Employee Pricing
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {employeePricing.map((tier, idx) => (
            <div
              key={idx}
              className={`p-6 rounded-xl shadow-lg transform transition-transform hover:scale-105 hover:shadow-2xl ${tier.color}`}
            >
              <h3 className="text-xl font-bold mb-2">{tier.tier}</h3>
              <p className="text-lg font-semibold mb-4">{tier.price}</p>
              <ul className="list-disc list-inside space-y-1">
                {tier.benefits.map((b, i) => (
                  <li key={i}>{b}</li>
                ))}
              </ul>
              <PricingModal
                tier={tier.tier}
                price={tier.price}
                benefits={tier.benefits}
                priceId={tier.priceId}
              />
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
