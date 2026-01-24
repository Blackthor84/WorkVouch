// =======================
// WorkVouch Career Pages
// =======================

export interface Career {
  id: string;
  name: string;
  reasons: {
    employees: string[];
    employers: string[];
  };
}

export const careers: Career[] = [
  {
    id: "healthcare",
    name: "Healthcare",
    reasons: {
      employees: [
        "Show verified experience in hospitals, clinics, and nursing facilities.",
        "Build trust with potential employers in a sensitive, high-stakes industry.",
        "Highlight certifications, licenses, and continuous training."
      ],
      employers: [
        "Quickly verify the work history of applicants for critical roles.",
        "Ensure compliance and reduce hiring risk in patient care.",
        "Access a pool of pre-verified candidates for urgent staffing needs."
      ]
    }
  },
  {
    id: "security",
    name: "Security",
    reasons: {
      employees: [
        "Verify experience in security, loss prevention, and protective services.",
        "Stand out to potential employers by showing reliability and past assignments.",
        "Easily showcase certifications and clearance levels."
      ],
      employers: [
        "Hire verified guards, patrol officers, and security staff with confidence.",
        "Reduce the time spent on background checks.",
        "Ensure candidates meet industry standards for safety and compliance."
      ]
    }
  },
  {
    id: "warehouse-logistics",
    name: "Warehouse & Logistics",
    reasons: {
      employees: [
        "Highlight forklift, shipping, and inventory experience.",
        "Showcase efficiency and reliability in fast-paced logistics roles.",
        "Demonstrate familiarity with warehouse management systems."
      ],
      employers: [
        "Quickly verify prior logistics and warehouse experience.",
        "Identify skilled candidates for high-demand roles.",
        "Streamline hiring for seasonal and high-turnover positions."
      ]
    }
  },
  {
    id: "retail",
    name: "Retail",
    reasons: {
      employees: [
        "Prove experience in sales, customer service, and merchandising.",
        "Highlight achievements in store performance or sales quotas.",
        "Show reliability in high-turnover environments."
      ],
      employers: [
        "Verify prior retail experience and tenure.",
        "Hire employees with proven customer service skills.",
        "Reduce the risk of hiring underqualified candidates."
      ]
    }
  },
  {
    id: "law-enforcement",
    name: "Law Enforcement",
    reasons: {
      employees: [
        "Show verified assignments in policing, investigations, or community safety.",
        "Highlight certifications, training, and specializations.",
        "Build credibility for career advancement or transfers."
      ],
      employers: [
        "Quickly validate prior law enforcement experience.",
        "Ensure candidates meet legal and procedural standards.",
        "Reduce risk and liability in hiring for sensitive roles."
      ]
    }
  },
  {
    id: "hospitality",
    name: "Hospitality",
    reasons: {
      employees: [
        "Demonstrate experience in hotels, restaurants, or event management.",
        "Highlight customer service, teamwork, and problem-solving skills.",
        "Showcase versatility in high-pressure environments."
      ],
      employers: [
        "Verify prior hospitality experience and quality service history.",
        "Identify staff skilled in guest services, events, or management.",
        "Reduce turnover by hiring proven, reliable employees."
      ]
    }
  }
];
