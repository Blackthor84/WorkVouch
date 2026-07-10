/** Static mock data for the public WorkVouch sales demo — no backend required. */

export type DemoRatingCategory =
  | "Reliability"
  | "Teamwork"
  | "Communication"
  | "Professionalism";

export type DemoReview = {
  id: string;
  reviewerName: string;
  reviewerInitials: string;
  company: string;
  quote: string;
  ratings: Record<DemoRatingCategory, number>;
  receivedAt: string;
};

export type CoworkerMatch = {
  id: string;
  name: string;
  company: string;
  department: string;
  overlap: string;
  avatarColor: string;
};

export type DemoCandidate = {
  id: string;
  name: string;
  trustScore: number;
  title: string;
  location: string;
  yearsExperience: number;
  verifiedJobs: number;
  verifiedCoworkers: number;
  skills: { name: string; score: number }[];
  retentionScore: number;
  attendanceScore: number;
  leadershipScore: number;
  conflictResolutionScore: number;
  cultureFitScore: number;
  workHistory: {
    company: string;
    role: string;
    dates: string;
    verified: boolean;
  }[];
  endorsements: string[];
  strengths: string[];
};

export const DEMO_EMPLOYEE = {
  name: "Marcus Johnson",
  title: "Security Officer",
  email: "marcus.j@email.com",
  location: "Charlotte, NC",
  employers: [
    { name: "Hilton Garden Inn", role: "Security Officer", dates: "2021 – 2024" },
    { name: "Fairfield Inn", role: "Night Security Lead", dates: "2019 – 2021" },
    { name: "Allied Universal", role: "Security Officer", dates: "2017 – 2019" },
  ],
  trustScore: 92,
  strengths: ["Reliability", "Teamwork", "Attendance"],
  topEndorsements: ["Leadership", "De-escalation", "Customer Service"],
  skillBreakdown: [
    { subject: "Reliability", value: 96 },
    { subject: "Teamwork", value: 94 },
    { subject: "Communication", value: 88 },
    { subject: "Professionalism", value: 95 },
    { subject: "Leadership", value: 90 },
    { subject: "Attendance", value: 97 },
  ],
};

export const COWORKER_MATCHES: CoworkerMatch[] = [
  {
    id: "sarah",
    name: "Sarah T.",
    company: "Fairfield Inn",
    department: "Front Desk & Security",
    overlap: "Mar 2019 – Aug 2021 · 2 yrs 5 mos",
    avatarColor: "bg-violet-500",
  },
  {
    id: "james",
    name: "James W.",
    company: "Hilton Garden Inn",
    department: "Hotel Operations",
    overlap: "Jan 2021 – Jun 2024 · 3 yrs 5 mos",
    avatarColor: "bg-blue-500",
  },
  {
    id: "robert",
    name: "Robert K.",
    company: "Allied Universal",
    department: "Corporate Security",
    overlap: "Jun 2017 – Dec 2019 · 2 yrs 6 mos",
    avatarColor: "bg-emerald-500",
  },
];

export const INCOMING_REVIEWS: DemoReview[] = [
  {
    id: "r1",
    reviewerName: "Sarah T.",
    reviewerInitials: "ST",
    company: "Fairfield Inn",
    quote:
      "Marcus was reliable, professional, and always helped teammates during busy shifts.",
    ratings: {
      Reliability: 5,
      Teamwork: 5,
      Communication: 4,
      Professionalism: 5,
    },
    receivedAt: "Just now",
  },
  {
    id: "r2",
    reviewerName: "James W.",
    reviewerInitials: "JW",
    company: "Hilton Garden Inn",
    quote:
      "One of the most dependable officers I've worked with. Guests and staff both trusted him.",
    ratings: {
      Reliability: 5,
      Teamwork: 5,
      Communication: 5,
      Professionalism: 5,
    },
    receivedAt: "2 min ago",
  },
  {
    id: "r3",
    reviewerName: "Robert K.",
    reviewerInitials: "RK",
    company: "Allied Universal",
    quote:
      "Handled high-pressure situations calmly. Strong de-escalation skills on every shift.",
    ratings: {
      Reliability: 5,
      Teamwork: 4,
      Communication: 4,
      Professionalism: 5,
    },
    receivedAt: "5 min ago",
  },
  {
    id: "r4",
    reviewerName: "Lisa M.",
    reviewerInitials: "LM",
    company: "Hilton Garden Inn",
    quote:
      "Never missed a shift without notice. Managers could always count on Marcus for coverage.",
    ratings: {
      Reliability: 5,
      Teamwork: 5,
      Communication: 4,
      Professionalism: 5,
    },
    receivedAt: "8 min ago",
  },
  {
    id: "r5",
    reviewerName: "David P.",
    reviewerInitials: "DP",
    company: "Fairfield Inn",
    quote:
      "Great communicator during incidents. Kept front desk and security aligned under pressure.",
    ratings: {
      Reliability: 5,
      Teamwork: 5,
      Communication: 5,
      Professionalism: 4,
    },
    receivedAt: "12 min ago",
  },
  {
    id: "r6",
    reviewerName: "Angela R.",
    reviewerInitials: "AR",
    company: "Allied Universal",
    quote:
      "Professional with vendors and guests alike. Would gladly work with him again.",
    ratings: {
      Reliability: 4,
      Teamwork: 5,
      Communication: 4,
      Professionalism: 5,
    },
    receivedAt: "15 min ago",
  },
];

export const REVIEW_TARGETS = [
  {
    id: "t1",
    name: "Sarah T.",
    company: "Fairfield Inn",
    role: "Front Desk Supervisor",
  },
  {
    id: "t2",
    name: "James W.",
    company: "Hilton Garden Inn",
    role: "Operations Manager",
  },
];

export const DEMO_EMPLOYER = {
  company: "Granite Hospitality Group",
  hiringRole: "Security Supervisor",
  contactName: "Jennifer Hayes",
  contactTitle: "Regional HR Director",
};

export const DEMO_CANDIDATES: DemoCandidate[] = [
  {
    id: "marcus",
    name: "Marcus Johnson",
    trustScore: 92,
    title: "Security Officer",
    location: "Charlotte, NC",
    yearsExperience: 8,
    verifiedJobs: 3,
    verifiedCoworkers: 14,
    skills: [
      { name: "Reliability", score: 96 },
      { name: "Teamwork", score: 94 },
      { name: "De-escalation", score: 91 },
      { name: "Leadership", score: 90 },
      { name: "Customer Service", score: 88 },
      { name: "Attendance", score: 97 },
    ],
    retentionScore: 94,
    attendanceScore: 97,
    leadershipScore: 90,
    conflictResolutionScore: 91,
    cultureFitScore: 89,
    workHistory: [
      {
        company: "Hilton Garden Inn",
        role: "Security Officer",
        dates: "2021 – 2024",
        verified: true,
      },
      {
        company: "Fairfield Inn",
        role: "Night Security Lead",
        dates: "2019 – 2021",
        verified: true,
      },
      {
        company: "Allied Universal",
        role: "Security Officer",
        dates: "2017 – 2019",
        verified: true,
      },
    ],
    endorsements: [
      "Leadership",
      "De-escalation",
      "Customer Service",
      "Reliability",
      "Team Player",
    ],
    strengths: ["Reliability", "Teamwork", "Attendance"],
  },
  {
    id: "david",
    name: "David Smith",
    trustScore: 78,
    title: "Security Officer",
    location: "Raleigh, NC",
    yearsExperience: 5,
    verifiedJobs: 2,
    verifiedCoworkers: 6,
    skills: [
      { name: "Reliability", score: 80 },
      { name: "Teamwork", score: 76 },
      { name: "De-escalation", score: 72 },
      { name: "Leadership", score: 68 },
      { name: "Customer Service", score: 74 },
      { name: "Attendance", score: 79 },
    ],
    retentionScore: 72,
    attendanceScore: 79,
    leadershipScore: 68,
    conflictResolutionScore: 70,
    cultureFitScore: 75,
    workHistory: [
      {
        company: "Marriott Courtyard",
        role: "Security Officer",
        dates: "2020 – 2024",
        verified: true,
      },
      {
        company: "Securitas",
        role: "Guard",
        dates: "2018 – 2020",
        verified: false,
      },
    ],
    endorsements: ["Punctuality", "Customer Service"],
    strengths: ["Customer Service"],
  },
  {
    id: "john",
    name: "John Brown",
    trustScore: 70,
    title: "Security Guard",
    location: "Greensboro, NC",
    yearsExperience: 4,
    verifiedJobs: 1,
    verifiedCoworkers: 3,
    skills: [
      { name: "Reliability", score: 68 },
      { name: "Teamwork", score: 72 },
      { name: "De-escalation", score: 65 },
      { name: "Leadership", score: 60 },
      { name: "Customer Service", score: 70 },
      { name: "Attendance", score: 66 },
    ],
    retentionScore: 58,
    attendanceScore: 66,
    leadershipScore: 60,
    conflictResolutionScore: 62,
    cultureFitScore: 68,
    workHistory: [
      {
        company: "Local Mall Security",
        role: "Security Guard",
        dates: "2021 – 2024",
        verified: true,
      },
    ],
    endorsements: ["Teamwork"],
    strengths: [],
  },
];

export const LANDING_STATS = [
  { value: 92, suffix: "%", label: "of hiring managers want verified references" },
  { value: 47, suffix: "%", label: "reduction in early turnover with trust signals" },
  { value: 3.2, suffix: "×", label: "faster shortlisting with peer verification", decimals: 1 },
  { value: 14, suffix: " days", label: "average time saved per hire" },
];

export const LANDING_TESTIMONIALS = [
  {
    quote:
      "WorkVouch showed us who actually shows up, who teammates trust, and who we'd rehire — before the interview.",
    author: "Jennifer Hayes",
    role: "Regional HR Director, Granite Hospitality Group",
  },
  {
    quote:
      "For the first time my years of security work are verified by people who were there. Employers finally see the real me.",
    author: "Marcus Johnson",
    role: "Security Officer",
  },
  {
    quote:
      "We cut bad hires by focusing on trust scores and coworker endorsements instead of resume keywords alone.",
    author: "David Chen",
    role: "VP Operations, Coastal Hotels",
  },
];

export const TOOLTIPS = {
  trustScore: {
    title: "Trust Score",
    body: "A composite score (0–100) built from verified coworker reviews, job history consistency, and reference quality — not self-reported claims.",
  },
  peerVerification: {
    title: "Peer Verification",
    body: "Reviews come from people who actually worked with the candidate, matched by employer, role overlap, and dates.",
  },
  referenceQuality: {
    title: "Reference Quality",
    body: "Weighted by reviewer credibility, specificity of feedback, and consistency across multiple references.",
  },
  consistencyMetrics: {
    title: "Consistency Metrics",
    body: "Tracks whether ratings and themes align across employers and time periods — a strong signal of reliability.",
  },
  retentionIndicators: {
    title: "Retention Indicators",
    body: "Signals derived from tenure patterns, rehire likelihood mentions, and attendance themes in peer reviews.",
  },
} as const;

export type TooltipKey = keyof typeof TOOLTIPS;

export const EMPLOYEE_VALUE_BLOCKS = [
  {
    title: "Portable reputation",
    body: "Your verified trust travels with you across employers — no starting from zero at every job search.",
    roi: "Workers with verified profiles receive 2.4× more employer views.",
  },
  {
    title: "Proof beyond the resume",
    body: "Coworker endorsements validate skills resumes can't capture — reliability, teamwork, and professionalism.",
    roi: "89% of demo users report feeling more confident applying.",
  },
];

export const EMPLOYER_VALUE_BLOCKS = [
  {
    title: "Reduce hiring risk",
    body: "See trust signals before investing in interviews, background checks, and onboarding.",
    roi: "Employers report up to 47% fewer early-term exits when using trust data.",
  },
  {
    title: "Faster, smarter decisions",
    body: "Compare candidates on verified peer data instead of guessing from resumes alone.",
    roi: "Average time-to-shortlist drops by 3.2× in pilot programs.",
  },
];

export const EMPLOYEE_BENEFITS = [
  "Get recognized for your work",
  "Stand out against other applicants",
  "Build a portable professional reputation",
  "Show employers proof beyond a resume",
  "Collect endorsements from real coworkers",
  "Turn years of experience into verified trust",
];

export const EMPLOYER_BENEFITS = [
  "Reduce hiring risk",
  "Go beyond resumes",
  "Identify reliable employees",
  "Find strong team players",
  "Verify workplace reputation",
  "Hire with greater confidence",
  "Reduce turnover",
  "Make faster hiring decisions",
];

export const EMPLOYER_ANALYTICS = {
  avgTrustScore: 81,
  topSkills: [
    { skill: "Reliability", count: 847 },
    { skill: "Teamwork", count: 792 },
    { skill: "Communication", count: 654 },
    { skill: "De-escalation", count: 521 },
    { skill: "Leadership", count: 488 },
  ],
  retentionRate: 88,
  referenceResponseRate: 76,
  hiringRiskAlerts: 3,
  applicantsThisMonth: 42,
};
