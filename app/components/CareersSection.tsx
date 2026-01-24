// app/components/CareersSection.tsx
"use client";

import { useState } from "react";
import FixedImage from "@/components/FixedImage";
import CareerModal, { CareerData } from "@/components/CareerModal";

// Define your WorkVouch careers with realistic benefits
const careers: CareerData[] = [
  {
    name: "Healthcare",
    image: "/healthcare.jpg",
    employerBenefits: [
      "Quickly verify past employee performance",
      "Reduce hiring risks and turnover",
      "Access a pool of pre-vetted candidates"
    ],
    employeeBenefits: [
      "Showcase verified experience",
      "Gain credibility in competitive healthcare roles",
      "Faster job opportunities with trusted employers"
    ]
  },
  {
    name: "Law Enforcement",
    image: "/law.jpg",
    employerBenefits: [
      "Hire officers with verified records",
      "Streamline background checks",
      "Ensure accountability and reliability"
    ],
    employeeBenefits: [
      "Highlight your verified service history",
      "Stand out in promotions and transfers",
      "Build trust with new agencies"
    ]
  },
  {
    name: "Security",
    image: "/security.jpg",
    employerBenefits: [
      "Hire guards with confirmed credentials",
      "Reduce incidents of unverified hires",
      "Access a reliable talent pool quickly"
    ],
    employeeBenefits: [
      "Showcase your experience and certifications",
      "Increase chances for higher-paying assignments",
      "Build a verified professional reputation"
    ]
  },
  {
    name: "Warehouse & Logistics",
    image: "/warehouse.jpg",
    employerBenefits: [
      "Find workers with proven reliability",
      "Minimize costly turnover",
      "Track verified work history easily"
    ],
    employeeBenefits: [
      "Highlight verified experience in logistics",
      "Get noticed for promotions and key roles",
      "Stand out to top employers quickly"
    ]
  },
  {
    name: "Hospitality",
    image: "/hospitality.jpg",
    employerBenefits: [
      "Hire staff with confirmed hospitality experience",
      "Ensure smooth customer service operations",
      "Save time on verification processes"
    ],
    employeeBenefits: [
      "Showcase your verified hospitality skills",
      "Gain credibility with hotels, restaurants, and resorts",
      "Access more premium job opportunities"
    ]
  },
  {
    name: "Retail",
    image: "/retail.jpg",
    employerBenefits: [
      "Hire dependable retail staff",
      "Reduce training costs",
      "Hire employees with proven sales experience"
    ],
    employeeBenefits: [
      "Showcase verified retail experience",
      "Stand out for promotions or transfers",
      "Access better retail positions quickly"
    ]
  }
];

export default function CareersSection() {
  const [selectedCareer, setSelectedCareer] = useState<CareerData | null>(null);
  const [isOpen, setIsOpen] = useState(false);

  const handleClick = (career: CareerData) => {
    setSelectedCareer(career);
    setIsOpen(true);
  };

  const handleClose = () => setIsOpen(false);

  return (
    <section className="py-12 bg-gray-50">
      <h2 className="text-3xl font-bold text-center mb-8 text-blue-800">
        Careers on WorkVouch
      </h2>
      <div className="grid grid-cols-2 md:grid-cols-3 gap-6 max-w-6xl mx-auto">
        {careers.map((career) => (
          <div
            key={career.name}
            className="cursor-pointer hover:scale-105 transform transition duration-300"
            onClick={() => handleClick(career)}
          >
            <FixedImage
              src={career.image}
              alt={career.name}
              width={400}
              height={250}
              className="rounded-lg shadow-lg object-cover w-full h-[250px]"
              fallbackSrc="/placeholder.png"
            />
            <h3 className="text-center mt-2 font-semibold text-lg text-gray-800">
              {career.name}
            </h3>
          </div>
        ))}
      </div>

      <CareerModal isOpen={isOpen} onClose={handleClose} career={selectedCareer} />
    </section>
  );
}
