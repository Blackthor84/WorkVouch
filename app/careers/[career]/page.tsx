import React from 'react';

const careerData: Record<string, any> = {
  "healthcare": {
    title: "Healthcare Careers With WorkVouch",
    image: "/careers/healthcare.jpg",
    summary: "WorkVouch connects healthcare professionals with verified employers and builds trust in your work history.",
    employers: [
      "Verify CNAs, RNs, LPNs, techs, and aides instantly.",
      "Reduce onboarding time with verified work history.",
      "Prevent falsified credentials and unreliable applicants.",
      "Build a more dependable clinical team quickly."
    ],
    employees: [
      "Prove your patient-care experience instantly.",
      "Show verified supervisors from past facilities.",
      "Stand out in competitive healthcare markets.",
      "Unlock faster hiring and shift approvals."
    ]
  },
  "law-enforcement": {
    title: "Law Enforcement Careers With WorkVouch",
    image: "/careers/law.jpg",
    summary: "Create trust in your law enforcement career history and improve hiring transparency.",
    employers: [
      "Quickly verify dispatchers, corrections, and officers.",
      "Reduce background check delays.",
      "Improve department hiring transparency.",
      "Ensure applicants have reliable prior service."
    ],
    employees: [
      "Show verified discipline, training, and agencies worked.",
      "Improve lateral hiring speed.",
      "Build a trustworthy record of service."
    ]
  },
  "security": {
    title: "Security Careers With WorkVouch",
    image: "/careers/security.jpg",
    summary: "Secure your work history or hire trusted security professionals with confidence.",
    employers: [
      "Confirm guard experience and reliability instantly.",
      "Reduce no-show rates with verified past performance.",
      "Build high-trust teams faster."
    ],
    employees: [
      "Prove your past sites, posts, and reliability.",
      "More job opportunities with verified references.",
      "Stand out over unverified applicants."
    ]
  },
  "warehouse-logistics": {
    title: "Warehouse & Logistics Careers With WorkVouch",
    image: "/careers/warehouse.jpg",
    summary: "Build reliable teams in logistics or show verified work experience to get hired faster.",
    employers: [
      "Verify forklift operators, pickers, packers, drivers.",
      "Reduce turnover by screening real work history.",
      "Improve shift reliability and safety."
    ],
    employees: [
      "Show verified experience operating equipment.",
      "Build resume credibility with validated employers.",
      "Get hired faster for higher-paying roles."
    ]
  },
  "hospitality": {
    title: "Hospitality Careers With WorkVouch",
    image: "/careers/hospitality.jpg",
    summary: "From hotels to catering, showcase or hire verified hospitality talent easily.",
    employers: [
      "Verify experience in hotels, food service, catering.",
      "Reduce false experience claims.",
      "Improve customer-facing reliability."
    ],
    employees: [
      "Show your customer service strengths.",
      "Get better roles based on verified history.",
      "Stand out in competitive hospitality markets."
    ]
  },
  "retail": {
    title: "Retail Careers With WorkVouch",
    image: "/careers/retail.jpg",
    summary: "Create verified retail work histories or hire dependable retail staff efficiently.",
    employers: [
      "Confirm past retail and customer service roles.",
      "Reduce turnover by hiring reliable workers.",
      "Streamline manager-to-manager reference checks."
    ],
    employees: [
      "Show verified customer-service experience.",
      "Build a stronger hiring profile.",
      "Gain priority for better-paying positions."
    ]
  }
};

type CareerPageProps = {
  params: { career: string };
};

export default function CareerPage({ params }: CareerPageProps) {
  const career = careerData[params.career];
  if (!career) return <div>Career not found</div>;

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900">
      {/* Hero Section */}
      <div className="relative w-full h-64 md:h-96">
        <img src={career.image} alt={career.title} className="object-cover w-full h-full" />
        <div className="absolute inset-0 bg-blue-700 bg-opacity-50 flex items-center justify-center">
          <h1 className="text-3xl md:text-5xl font-bold text-white text-center px-4">
            {career.title}
          </h1>
        </div>
      </div>

      {/* Summary */}
      <section className="max-w-5xl mx-auto p-6 text-center">
        <p className="text-lg md:text-xl">{career.summary}</p>
      </section>

      {/* Employers Section */}
      <section className="max-w-5xl mx-auto p-6">
        <h2 className="text-2xl font-semibold mb-4 text-blue-700">Why Employers Choose WorkVouch</h2>
        <ul className="list-disc list-inside space-y-2 text-lg">
          {career.employers.map((item, idx) => (
            <li key={idx}>{item}</li>
          ))}
        </ul>
      </section>

      {/* Employees Section */}
      <section className="max-w-5xl mx-auto p-6">
        <h2 className="text-2xl font-semibold mb-4 text-blue-700">Why Employees Choose WorkVouch</h2>
        <ul className="list-disc list-inside space-y-2 text-lg">
          {career.employees.map((item, idx) => (
            <li key={idx}>{item}</li>
          ))}
        </ul>
      </section>
    </div>
  );
}
