export type ProductTourStepId =
  | "landing"
  | "employee-signup"
  | "career-passport"
  | "add-employment"
  | "coworker-vouches"
  | "employee-profile"
  | "employer-transition"
  | "employer-signup"
  | "employer-dashboard"
  | "employer-search"
  | "employer-passport"
  | "employer-vouches"
  | "final-profile"
  | "closing";

export type ProductTourStep = {
  id: ProductTourStepId;
  /** Small on-screen label (top-left) */
  label?: string;
  /** Section banner e.g. EMPLOYEE EXPERIENCE */
  section?: "employee" | "employer";
};

export const PRODUCT_TOUR_STEPS: ProductTourStep[] = [
  { id: "landing" },
  {
    id: "employee-signup",
    section: "employee",
    label: "Create your profile",
  },
  {
    id: "career-passport",
    section: "employee",
    label: "Build your Career Passport",
  },
  {
    id: "add-employment",
    section: "employee",
    label: "Add employment history",
  },
  {
    id: "coworker-vouches",
    section: "employee",
    label: "Connect with coworkers",
  },
  {
    id: "employee-profile",
    section: "employee",
    label: "View your Vouches",
  },
  { id: "employer-transition" },
  {
    id: "employer-signup",
    section: "employer",
    label: "Employer sign in",
  },
  {
    id: "employer-dashboard",
    section: "employer",
  },
  {
    id: "employer-search",
    section: "employer",
    label: "Search Career Passports",
  },
  {
    id: "employer-passport",
    section: "employer",
    label: "Review employment history",
  },
  {
    id: "employer-vouches",
    section: "employer",
    label: "See coworker Vouches",
  },
  {
    id: "final-profile",
    section: "employee",
  },
  { id: "closing" },
];

export function stepIndex(id: ProductTourStepId): number {
  return PRODUCT_TOUR_STEPS.findIndex((s) => s.id === id);
}
