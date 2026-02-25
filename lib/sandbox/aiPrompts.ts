export const AI_PROMPT_TEMPLATES = [
  {
    id: "resume_fraud",
    label: "Suspected Resume Fraud",
    prompt:
      "Candidate employment dates overlap and coworkers disagree on role title.",
  },
  {
    id: "high_trust_candidate",
    label: "High-Trust Candidate",
    prompt:
      "Candidate verified by 6 coworkers across 3 companies with consistent roles.",
  },
  {
    id: "risky_employer",
    label: "Risky Employer Pattern",
    prompt:
      "Employer has repeated false claims and unverifiable managers.",
  },
  {
    id: "career_gap",
    label: "Career Gap Explained",
    prompt:
      "Candidate has a 2-year employment gap with verified freelance work.",
  },
];
