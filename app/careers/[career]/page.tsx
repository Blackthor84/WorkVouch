import Image from "next/image";
import { notFound } from "next/navigation";

const careerData: Record<string, {
  name: string;
  image: string;
  employerBenefits: string[];
  employeeBenefits: string[];
}> = {
  healthcare: {
    name: "Healthcare",
    image: "/careers/healthcare.jpg",
    employerBenefits: [
      "Verify CNAs, RNs, LPNs, techs, and aides instantly",
      "Reduce onboarding time with verified work history",
      "Prevent falsified credentials and unreliable applicants",
      "Build a more dependable clinical team quickly"
    ],
    employeeBenefits: [
      "Prove your patient-care experience instantly",
      "Show verified supervisors from past facilities",
      "Stand out in competitive healthcare markets",
      "Unlock faster hiring and shift approvals"
    ]
  },
  "law-enforcement": {
    name: "Law Enforcement",
    image: "/careers/law.jpg",
    employerBenefits: [
      "Quickly verify dispatchers, corrections, and officers",
      "Reduce background check delays",
      "Improve department hiring transparency",
      "Ensure applicants have reliable prior service"
    ],
    employeeBenefits: [
      "Show verified discipline, training, and agencies worked",
      "Improve lateral hiring speed",
      "Build a trustworthy record of service",
      "Stand out with verified law enforcement experience"
    ]
  },
  security: {
    name: "Security",
    image: "/careers/security.jpg",
    employerBenefits: [
      "Confirm guard experience and reliability instantly",
      "Reduce no-show rates with verified past performance",
      "Build high-trust teams faster",
      "Verify guard licenses, certificates & training"
    ],
    employeeBenefits: [
      "Prove your past sites, posts, and reliability",
      "More job opportunities with verified references",
      "Stand out over unverified applicants",
      "Show verified security experience to employers"
    ]
  },
  "warehouse-logistics": {
    name: "Warehouse & Logistics",
    image: "/careers/warehouse.jpg",
    employerBenefits: [
      "Verify forklift operators, pickers, packers, drivers",
      "Reduce turnover by screening real work history",
      "Improve shift reliability and safety",
      "Confirm equipment operation experience"
    ],
    employeeBenefits: [
      "Show verified experience operating equipment",
      "Build resume credibility with validated employers",
      "Get hired faster for higher-paying roles",
      "Prove your warehouse and logistics expertise"
    ]
  },
  hospitality: {
    name: "Hospitality",
    image: "/careers/hospitality.jpg",
    employerBenefits: [
      "Verify experience in hotels, food service, catering",
      "Reduce false experience claims",
      "Improve customer-facing reliability",
      "Build trustworthy hospitality teams"
    ],
    employeeBenefits: [
      "Show your customer service strengths",
      "Get better roles based on verified history",
      "Stand out in competitive hospitality markets",
      "Prove your hospitality experience to employers"
    ]
  },
  retail: {
    name: "Retail",
    image: "/careers/retail.jpg",
    employerBenefits: [
      "Confirm past retail and customer service roles",
      "Reduce turnover by hiring reliable workers",
      "Streamline manager-to-manager reference checks",
      "Verify retail experience and customer service skills"
    ],
    employeeBenefits: [
      "Show verified customer-service experience",
      "Build a stronger hiring profile",
      "Gain priority for better-paying positions",
      "Prove your retail expertise to employers"
    ]
  }
};

export default function CareerPage({ params }: { params: { career: string } }) {
  const career = params.career;
  const data = careerData[career];

  if (!data) {
    notFound();
  }

  return (
    <div className="bg-gray-50 min-h-screen">
      {/* Hero Section with Image */}
      <section className="relative h-64 md:h-96 overflow-hidden">
        <Image
          src={data.image}
          alt={data.name}
          fill
          className="object-cover"
          priority
          unoptimized
        />
        <div className="absolute inset-0 bg-gradient-to-t from-blue-900/80 to-transparent flex items-end">
          <div className="max-w-5xl mx-auto w-full px-6 pb-8">
            <h1 className="text-4xl md:text-5xl font-extrabold text-white mb-2">
              {data.name} Careers With WorkVouch
            </h1>
          </div>
        </div>
      </section>

      {/* Content Sections */}
      <section className="max-w-5xl mx-auto py-14 px-6">
        <div className="grid md:grid-cols-2 gap-10">
          {/* Why Employers Choose WorkVouch */}
          <div className="bg-white shadow-md rounded-xl p-8">
            <h2 className="text-2xl font-semibold text-blue-700 mb-6">
              Why Employers Choose WorkVouch
            </h2>
            <ul className="space-y-4 text-gray-700">
              {data.employerBenefits.map((benefit, index) => (
                <li key={index} className="flex items-start">
                  <span className="text-green-500 mr-3 text-xl">✔</span>
                  <span>{benefit}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Why Employees Choose WorkVouch */}
          <div className="bg-white shadow-md rounded-xl p-8">
            <h2 className="text-2xl font-semibold text-blue-700 mb-6">
              Why Employees Choose WorkVouch
            </h2>
            <ul className="space-y-4 text-gray-700">
              {data.employeeBenefits.map((benefit, index) => (
                <li key={index} className="flex items-start">
                  <span className="text-green-500 mr-3 text-xl">✔</span>
                  <span>{benefit}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* CTA Section */}
        <div className="mt-12 text-center bg-blue-50 rounded-xl p-8">
          <h3 className="text-2xl font-bold text-blue-700 mb-4">
            Ready to Get Started?
          </h3>
          <p className="text-gray-700 mb-6">
            Join thousands of {data.name.toLowerCase()} professionals using WorkVouch to verify work history and build trust.
          </p>
          <div className="flex justify-center gap-4">
            <a
              href="/auth/signup"
              className="px-6 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition"
            >
              Sign Up Free
            </a>
            <a
              href="/pricing"
              className="px-6 py-3 border border-blue-600 text-blue-600 font-semibold rounded-lg hover:bg-blue-50 transition"
            >
              View Pricing
            </a>
          </div>
        </div>
      </section>
    </div>
  );
}
