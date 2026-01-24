// data/careers.ts
export interface Career {
  id: string;
  name: string;
  image: string;
  description: string;
  employerBenefits: string[];
  employeeBenefits: string[];
}

export const careers: Career[] = [
  // -----------------------------
  // LAW ENFORCEMENT
  // -----------------------------
  {
    id: "police_officer",
    name: "Police Officer",
    image: "/careers/police.jpg",
    description:
      "Law enforcement professionals responsible for maintaining public safety and enforcing the law.",
    employerBenefits: [
      "Verify real agency experience instantly",
      "Reduce hiring risks for high-authority roles",
      "Confirm training, certifications, and field experience",
      "See peer-validated professionalism and conduct"
    ],
    employeeBenefits: [
      "Showcase verified service history",
      "Strengthen credibility for promotions",
      "Stand out in competitive agency applications",
      "Portable proof of experience across jurisdictions"
    ]
  },
  {
    id: "corrections_officer",
    name: "Corrections Officer",
    image: "/careers/corrections.jpg",
    description: "Maintains safety and control inside correctional facilities.",
    employerBenefits: [
      "Hire officers with verified facility experience",
      "Reduce turnover with reliable history checks",
      "Identify proven de-escalation skills",
      "Improve candidate trustworthiness"
    ],
    employeeBenefits: [
      "Highlight verified correctional experience",
      "Show proven reliability in high-risk environments",
      "Stronger applications for better facilities",
      "Portable experience validation"
    ]
  },

  // -----------------------------
  // SECURITY
  // -----------------------------
  {
    id: "security_guard",
    name: "Security Guard",
    image: "/careers/security.jpg",
    description:
      "Security professionals maintaining safety, access control, and loss prevention.",
    employerBenefits: [
      "Verify previous posts and duties instantly",
      "Improve contract trust & staffing reliability",
      "Reduce no-show and turnover risks",
      "Confirm experience with similar environments"
    ],
    employeeBenefits: [
      "Prove your past posts and hours worked",
      "Stand out for premium contracts",
      "Easily share experience with new companies",
      "Gain trust with high-profile clients"
    ]
  },
  {
    id: "armed_security",
    name: "Armed Security",
    image: "/careers/armed.jpg",
    description: "Armed security professionals trained to protect high-risk sites.",
    employerBenefits: [
      "Verify firearm certifications and past armed roles",
      "Reduce liability with validated experience",
      "Hire candidates with proven judgment",
      "Instant trust for sensitive locations"
    ],
    employeeBenefits: [
      "Show verified armed credentials",
      "Increase your pay rate opportunities",
      "Stand out for federal and corporate contracts",
      "Portable proof of training and experience"
    ]
  },

  // -----------------------------
  // HOSPITALITY
  // -----------------------------
  {
    id: "hotel_front_desk",
    name: "Hotel Front Desk Agent",
    image: "/careers/frontdesk.jpg",
    description: "Handles hotel check-ins, guest services, and customer care.",
    employerBenefits: [
      "Verify real hospitality customer-service experience",
      "Lower turnover in customer-facing roles",
      "Find candidates with proven communication skills",
      "Confirm reliability during peak seasons"
    ],
    employeeBenefits: [
      "Showcase verified hospitality experience",
      "Stand out for higher-paying front-desk roles",
      "Prove customer service skills instantly",
      "Build a trusted hospitality résumé"
    ]
  },
  {
    id: "housekeeping",
    name: "Housekeeping",
    image: "/careers/housekeeping.jpg",
    description: "Responsible for room cleaning, sanitation, and guest comfort.",
    employerBenefits: [
      "Verify cleaning and housekeeping history",
      "Improve guest experience with trusted staff",
      "Reduce late hiring issues during events/seasons",
      "Hire workers with proven consistency"
    ],
    employeeBenefits: [
      "Prove reliability and quality of work",
      "Increase your chances of steady hotel roles",
      "Highlight attention to detail",
      "Track verified experience across properties"
    ]
  },

  // -----------------------------
  // RETAIL
  // -----------------------------
  {
    id: "retail_associate",
    name: "Retail Associate",
    image: "/careers/retail.jpg",
    description: "Handles customer service, stocking, and retail store operations.",
    employerBenefits: [
      "Verify past retail experience quickly",
      "Hire staff with proven customer-service skills",
      "Reduce shrinkage with trusted workers",
      "Increase reliability during retail rush seasons"
    ],
    employeeBenefits: [
      "Show verified retail experience",
      "Stand out for higher-paying store roles",
      "Prove reliability for manager recommendations",
      "Port your experience anywhere"
    ]
  },
  {
    id: "cashier",
    name: "Cashier",
    image: "/careers/cashier.jpg",
    description: "Manages register operations, payments, and customer interaction.",
    employerBenefits: [
      "Quickly verify cashier experience",
      "Reduce risk of hiring inexperienced hires",
      "Identify trustworthy candidates for money handling",
      "Improve staffing accuracy"
    ],
    employeeBenefits: [
      "Prove trusted money-handling experience",
      "Get hired faster for retail positions",
      "Build a verified work history",
      "Increase promotion opportunities"
    ]
  },

  // -----------------------------
  // HEALTHCARE
  // -----------------------------
  {
    id: "cna",
    name: "Certified Nursing Assistant (CNA)",
    image: "/careers/cna.jpg",
    description:
      "Provides patient care support in hospitals, long-term care, and home health.",
    employerBenefits: [
      "Verify real patient-care experience instantly",
      "Reduce hiring risks in critical environments",
      "Identify CNAs with proven reliability",
      "Improve staffing quality with verified records"
    ],
    employeeBenefits: [
      "Prove verified patient-care experience",
      "Stand out for hospital and LTC positions",
      "Strengthen credibility for higher roles",
      "Portable healthcare résumé"
    ]
  },
  {
    id: "medical_assistant",
    name: "Medical Assistant",
    image: "/careers/ma.jpg",
    description:
      "Supports clinicians with patient prep, vitals, documentation, and office duties.",
    employerBenefits: [
      "Verify clinic and medical office experience",
      "Reduce training time with proven staff",
      "Hire MAs with reliable patient-interaction records",
      "Improve team readiness"
    ],
    employeeBenefits: [
      "Show verified medical office experience",
      "Gain trust quickly when applying",
      "Stand out in competitive clinic environments",
      "Track your healthcare career growth"
    ]
  },

  // -----------------------------
  // WAREHOUSE & LOGISTICS
  // -----------------------------
  {
    id: "warehouse_worker",
    name: "Warehouse Worker",
    image: "/careers/warehouse.jpg",
    description:
      "Handles picking, packing, inventory, and warehouse operations.",
    employerBenefits: [
      "Verify experience in fast-paced warehouse environments",
      "Hire workers with proven reliability",
      "Lower turnover during high-volume seasons",
      "Improve staffing with experience-backed profiles"
    ],
    employeeBenefits: [
      "Show verified warehouse experience",
      "Get better warehouse or lead positions",
      "Prove reliability for shift-based work",
      "Create a portable work history"
    ]
  },
  {
    id: "forklift_operator",
    name: "Forklift Operator",
    image: "/careers/forklift.jpg",
    description:
      "Certified operators handling pallet movement and warehouse logistics.",
    employerBenefits: [
      "Verify forklift certification and real operating hours",
      "Reduce safety risks",
      "Hire experienced operators faster",
      "Improve logistics flow with proven staff"
    ],
    employeeBenefits: [
      "Highlight verified forklift hours",
      "Increase pay opportunities",
      "Stand out for skilled roles",
      "Portable proof of certifications"
    ]
  }
];
