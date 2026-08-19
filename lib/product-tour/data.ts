/** Static fictional data for /product-tour — no backend, no production users. */

export type ProductTourReference = {
  id: string;
  reviewerName: string;
  roleLabel: "Former Coworker" | "Former Supervisor";
  isDirectManager: boolean;
  rating: number;
  feedback: string;
  company: string;
};

export type ProductTourJob = {
  id: string;
  company_name: string;
  job_title: string;
  start_date: string;
  end_date: string | null;
  /** Display only — jobs table uses dates; state shown on profile per location rules */
  state: string;
};

export const DEMO_EMPLOYEE = {
  id: "tour-michael-carter",
  full_name: "Michael Carter",
  email: "michael.carter.demo@product-tour.workvouch",
  username: "michael-carter",
  headline: "Security Supervisor",
  state: "NH",
  country: "US",
  trust_score: 78,
  reference_count: 3,
} as const;

export const DEMO_EMPLOYER = {
  company_name: "Summit Staffing Partners",
  email: "hiring.demo@product-tour.workvouch",
  full_name: "Alex Rivera",
} as const;

export const DEMO_JOB: ProductTourJob = {
  id: "tour-job-granite",
  company_name: "Granite Hospitality Group",
  job_title: "Security Supervisor",
  start_date: "2022-01-01",
  end_date: "2025-01-01",
  state: "NH",
};

export const DEMO_REFERENCES: ProductTourReference[] = [
  {
    id: "ref-sarah",
    reviewerName: "Sarah Mitchell",
    roleLabel: "Former Coworker",
    isDirectManager: false,
    rating: 5,
    company: "Granite Hospitality Group",
    feedback:
      "Michael was dependable on every shift. He handled guest incidents calmly and always backed up the team when things got busy.",
  },
  {
    id: "ref-james",
    reviewerName: "James Parker",
    roleLabel: "Former Supervisor",
    isDirectManager: true,
    rating: 5,
    company: "Granite Hospitality Group",
    feedback:
      "I supervised Michael for two years. He communicated clearly with staff, followed procedures, and was someone I could trust with sensitive situations.",
  },
  {
    id: "ref-daniel",
    reviewerName: "Daniel Brooks",
    roleLabel: "Former Coworker",
    isDirectManager: false,
    rating: 4,
    company: "Granite Hospitality Group",
    feedback:
      "Solid teammate — punctual, professional with guests, and willing to cover shifts when needed.",
  },
];

export const COWORKER_MATCHES = [
  {
    id: "match-sarah",
    name: "Sarah Mitchell",
    company: "Granite Hospitality Group",
    overlap: "2022 – 2025",
  },
  {
    id: "match-james",
    name: "James Parker",
    company: "Granite Hospitality Group",
    overlap: "2022 – 2024",
  },
  {
    id: "match-daniel",
    name: "Daniel Brooks",
    company: "Granite Hospitality Group",
    overlap: "2023 – 2025",
  },
] as const;

export function formatJobDates(start: string, end: string | null): string {
  const fmt = (iso: string) =>
    new Date(iso).toLocaleDateString("en-US", { month: "short", year: "numeric" });
  return `${fmt(start)} – ${end ? fmt(end) : "Present"}`;
}
