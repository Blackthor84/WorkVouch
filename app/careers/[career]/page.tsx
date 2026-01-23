import React from "react";
import Image from "next/image";

interface CareerData {
  name: string;
  image: string;
  employers: string[];
  employees: string[];
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
      />

      <section className="mb-10">
        <h2 className="text-2xl font-semibold mb-4 text-blue-700">
          Why Employers Choose WorkVouch
        </h2>
        <ul className="list-disc list-inside space-y-2 text-lg mb-6">
          {career.employers.map((item: string, idx: number) => (
            <li key={idx}>{item}</li>
          ))}
        </ul>
      </section>

      <section>
        <h2 className="text-2xl font-semibold mb-4 text-blue-700">
          Why Employees Choose WorkVouch
        </h2>
        <ul className="list-disc list-inside space-y-2 text-lg mb-6">
          {career.employees.map((item: string, idx: number) => (
            <li key={idx}>{item}</li>
          ))}
        </ul>
      </section>
    </div>
  );
}
