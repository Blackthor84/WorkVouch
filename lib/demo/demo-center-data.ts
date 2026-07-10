/** Static mock data for /demo — fully self-contained, no backend. */

export type RatingCategory =
  | "Reliability"
  | "Teamwork"
  | "Communication"
  | "Professionalism";

export type DemoReview = {
  id: string;
  reviewerName: string;
  initials: string;
  company: string;
  quote: string;
  ratings: Record<RatingCategory, number>;
  receivedAt: string;
};

export type CoworkerMatch = {
  id: string;
  name: string;
  company: string;
  department: string;
  overlap: string;
  color: string;
};

export type SkillPoint = { subject: string; value: number };

export type TimelineEvent = {
  id: string;
  year: string;
  title: string;
  subtitle: string;
  type: "job" | "review" | "skill" | "badge";
  detail?: string;
};

export type JobMatch = {
  id: string;
  company: string;
  role: string;
  industry: string;
  trustMatch: number;
  location: string;
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
  skills: SkillPoint[];
  metrics: {
    leadership: number;
    communication: number;
    reliability: number;
    retention: number;
    teamwork: number;
    professionalism: number;
    attendance: number;
    cultureFit: number;
    conflictResolution: number;
  };
  workHistory: { company: string; role: string; dates: string; verified: boolean }[];
  endorsements: string[];
  strengths: string[];
  growthAreas: string[];
  praiseWords: { word: string; count: number }[];
  concernWords: { word: string; count: number }[];
  aiSummary: string;
  riskFlags: { label: string; status: "green" | "yellow" | "red"; detail: string }[];
};

export const EMPLOYEE = {
  name: "Marcus Johnson",
  title: "Security Officer",
  email: "marcus.j@email.com",
  location: "Charlotte, NC",
  trustScore: 92,
  employers: [
    { name: "Hilton Garden Inn", role: "Security Officer", dates: "2021 – 2024" },
    { name: "Fairfield Inn", role: "Night Security Lead", dates: "2019 – 2021" },
    { name: "Allied Universal", role: "Security Officer", dates: "2017 – 2019" },
  ],
  strengths: ["Reliability", "Teamwork", "Leadership", "De-escalation"],
  growthAreas: ["Management experience", "Report writing"],
  skillRadar: [
    { subject: "Leadership", value: 90 },
    { subject: "Communication", value: 88 },
    { subject: "Attendance", value: 97 },
    { subject: "Professionalism", value: 95 },
    { subject: "Reliability", value: 96 },
    { subject: "Teamwork", value: 94 },
  ] as SkillPoint[],
  trustScoreSteps: [0, 10, 32, 58, 71, 84, 92],
  benefits: [
    "Stand out against other applicants",
    "Build a portable professional reputation",
    "Carry verified reviews between jobs",
    "Get hired faster with trust signals",
    "Be recognized for your real work",
  ],
};

export const COWORKERS: CoworkerMatch[] = [
  {
    id: "sarah",
    name: "Sarah T.",
    company: "Fairfield Inn",
    department: "Front Desk & Security",
    overlap: "Mar 2019 – Aug 2021",
    color: "from-violet-500 to-purple-600",
  },
  {
    id: "james",
    name: "James W.",
    company: "Hilton Garden Inn",
    department: "Hotel Operations",
    overlap: "Jan 2021 – Jun 2024",
    color: "from-blue-500 to-cyan-600",
  },
  {
    id: "robert",
    name: "Robert K.",
    company: "Allied Universal",
    department: "Corporate Security",
    overlap: "Jun 2017 – Dec 2019",
    color: "from-emerald-500 to-teal-600",
  },
];

export const REVIEWS: DemoReview[] = [
  {
    id: "r1",
    reviewerName: "Sarah T.",
    initials: "ST",
    company: "Fairfield Inn",
    quote:
      "Marcus was dependable, professional, and someone everyone could count on during busy shifts.",
    ratings: { Reliability: 5, Teamwork: 5, Communication: 4, Professionalism: 5 },
    receivedAt: "Just now",
  },
  {
    id: "r2",
    reviewerName: "James W.",
    initials: "JW",
    company: "Hilton Garden Inn",
    quote:
      "One of the most reliable officers I've worked with. Guests and staff both trusted him completely.",
    ratings: { Reliability: 5, Teamwork: 5, Communication: 5, Professionalism: 5 },
    receivedAt: "2 min ago",
  },
  {
    id: "r3",
    reviewerName: "Robert K.",
    initials: "RK",
    company: "Allied Universal",
    quote:
      "Handled high-pressure situations calmly. Strong de-escalation skills on every single shift.",
    ratings: { Reliability: 5, Teamwork: 4, Communication: 4, Professionalism: 5 },
    receivedAt: "5 min ago",
  },
  {
    id: "r4",
    reviewerName: "Lisa M.",
    initials: "LM",
    company: "Hilton Garden Inn",
    quote:
      "Never missed a shift without notice. Managers could always count on Marcus for coverage.",
    ratings: { Reliability: 5, Teamwork: 5, Communication: 4, Professionalism: 5 },
    receivedAt: "8 min ago",
  },
  {
    id: "r5",
    reviewerName: "David P.",
    initials: "DP",
    company: "Fairfield Inn",
    quote:
      "Great communicator during incidents. Kept front desk and security aligned under pressure.",
    ratings: { Reliability: 5, Teamwork: 5, Communication: 5, Professionalism: 4 },
    receivedAt: "12 min ago",
  },
  {
    id: "r6",
    reviewerName: "Angela R.",
    initials: "AR",
    company: "Allied Universal",
    quote:
      "Professional with vendors and guests alike. Would gladly work with him again.",
    ratings: { Reliability: 4, Teamwork: 5, Communication: 4, Professionalism: 5 },
    receivedAt: "15 min ago",
  },
];

export const REVIEW_TARGETS = [
  { id: "t1", name: "Sarah T.", company: "Fairfield Inn", role: "Front Desk Supervisor" },
  { id: "t2", name: "James W.", company: "Hilton Garden Inn", role: "Operations Manager" },
];

export const CAREER_TIMELINE: TimelineEvent[] = [
  {
    id: "e1",
    year: "2017",
    title: "Allied Universal",
    subtitle: "Security Officer",
    type: "job",
    detail: "Started verified work history",
  },
  {
    id: "e2",
    year: "2018",
    title: "De-escalation Endorsement",
    subtitle: "3 coworker endorsements",
    type: "skill",
  },
  {
    id: "e3",
    year: "2019",
    title: "Fairfield Inn",
    subtitle: "Night Security Lead",
    type: "job",
  },
  {
    id: "e4",
    year: "2020",
    title: "Team Player Badge",
    subtitle: "5-star teamwork from 4 reviewers",
    type: "badge",
  },
  {
    id: "e5",
    year: "2021",
    title: "Hilton Garden Inn",
    subtitle: "Security Officer",
    type: "job",
  },
  {
    id: "e6",
    year: "2023",
    title: "14 Verified Reviews",
    subtitle: "Trust Score reaches 92",
    type: "review",
  },
  {
    id: "e7",
    year: "2024",
    title: "Leadership Endorsement",
    subtitle: "Promoted to shift lead responsibilities",
    type: "skill",
  },
];

export const JOB_MATCHES: JobMatch[] = [
  {
    id: "j1",
    company: "Granite Hospitality Group",
    role: "Security Supervisor",
    industry: "Hotels",
    trustMatch: 96,
    location: "Charlotte, NC",
  },
  {
    id: "j2",
    company: "Atrium Health",
    role: "Security Specialist",
    industry: "Hospitals",
    trustMatch: 91,
    location: "Charlotte, NC",
  },
  {
    id: "j3",
    company: "Securitas Corporate",
    role: "Account Supervisor",
    industry: "Corporate Security",
    trustMatch: 88,
    location: "Raleigh, NC",
  },
  {
    id: "j4",
    company: "Target Regional",
    role: "Asset Protection Lead",
    industry: "Retail",
    trustMatch: 85,
    location: "Greensboro, NC",
  },
];

export const EMPLOYER = {
  company: "Granite Hospitality Group",
  hiringRole: "Security Supervisor",
  contactName: "Jennifer Hayes",
  contactTitle: "Regional HR Director",
};

export const DASHBOARD_STATS = {
  applicationsToday: 12,
  avgTrustScore: 84,
  openPositions: 4,
  pipeline: [
    { stage: "Applied", count: 42 },
    { stage: "Reviewed", count: 28 },
    { stage: "Interview", count: 11 },
    { stage: "Offer", count: 3 },
  ],
};

export const CANDIDATES: DemoCandidate[] = [
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
      { subject: "Reliability", value: 96 },
      { subject: "Teamwork", value: 94 },
      { subject: "Leadership", value: 90 },
      { subject: "Communication", value: 88 },
      { subject: "De-escalation", value: 91 },
      { subject: "Attendance", value: 97 },
    ],
    metrics: {
      leadership: 90,
      communication: 88,
      reliability: 96,
      retention: 94,
      teamwork: 94,
      professionalism: 95,
      attendance: 97,
      cultureFit: 89,
      conflictResolution: 91,
    },
    workHistory: [
      { company: "Hilton Garden Inn", role: "Security Officer", dates: "2021 – 2024", verified: true },
      { company: "Fairfield Inn", role: "Night Security Lead", dates: "2019 – 2021", verified: true },
      { company: "Allied Universal", role: "Security Officer", dates: "2017 – 2019", verified: true },
    ],
    endorsements: ["Leadership", "De-escalation", "Customer Service", "Reliability", "Team Player"],
    strengths: ["Reliability", "Teamwork", "Leadership", "De-escalation"],
    growthAreas: ["Limited management experience"],
    praiseWords: [
      { word: "reliable", count: 12 },
      { word: "professional", count: 10 },
      { word: "dependable", count: 9 },
      { word: "team player", count: 8 },
      { word: "calm", count: 7 },
      { word: "leadership", count: 6 },
    ],
    concernWords: [{ word: "management experience", count: 2 }],
    aiSummary:
      "Marcus consistently receives excellent feedback from coworkers across multiple employers. Leadership and reliability are recurring strengths. Multiple reviewers mention de-escalation skills and shift coverage reliability. Recommended for supervisor roles with mentorship support.",
    riskFlags: [
      { label: "Attendance concerns", status: "green", detail: "No attendance concerns detected" },
      { label: "Professionalism concerns", status: "green", detail: "No professionalism concerns detected" },
      { label: "Management experience", status: "yellow", detail: "Limited formal management experience noted by 2 reviewers" },
    ],
  },
  {
    id: "ashley",
    name: "Ashley Rivera",
    trustScore: 89,
    title: "Security Supervisor",
    location: "Charlotte, NC",
    yearsExperience: 7,
    verifiedJobs: 3,
    verifiedCoworkers: 11,
    skills: [
      { subject: "Reliability", value: 90 },
      { subject: "Teamwork", value: 92 },
      { subject: "Leadership", value: 88 },
      { subject: "Communication", value: 91 },
      { subject: "De-escalation", value: 86 },
      { subject: "Attendance", value: 93 },
    ],
    metrics: {
      leadership: 88,
      communication: 91,
      reliability: 90,
      retention: 88,
      teamwork: 92,
      professionalism: 90,
      attendance: 93,
      cultureFit: 91,
      conflictResolution: 85,
    },
    workHistory: [
      { company: "Marriott Downtown", role: "Security Supervisor", dates: "2020 – 2024", verified: true },
      { company: "Hyatt Place", role: "Security Officer", dates: "2018 – 2020", verified: true },
      { company: "G4S", role: "Security Guard", dates: "2016 – 2018", verified: true },
    ],
    endorsements: ["Communication", "Leadership", "Customer Service"],
    strengths: ["Communication", "Leadership"],
    growthAreas: ["De-escalation under extreme pressure"],
    praiseWords: [
      { word: "communicator", count: 9 },
      { word: "organized", count: 7 },
      { word: "leadership", count: 6 },
    ],
    concernWords: [{ word: "high-stress incidents", count: 3 }],
    aiSummary:
      "Ashley shows strong communication and leadership signals across verified employers. Well-suited for guest-facing security leadership roles.",
    riskFlags: [
      { label: "Attendance concerns", status: "green", detail: "No attendance concerns" },
      { label: "Professionalism concerns", status: "green", detail: "No professionalism concerns" },
      { label: "High-stress handling", status: "yellow", detail: "Mixed feedback on extreme incident handling" },
    ],
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
      { subject: "Reliability", value: 80 },
      { subject: "Teamwork", value: 76 },
      { subject: "Leadership", value: 68 },
      { subject: "Communication", value: 74 },
      { subject: "De-escalation", value: 72 },
      { subject: "Attendance", value: 79 },
    ],
    metrics: {
      leadership: 68,
      communication: 74,
      reliability: 80,
      retention: 72,
      teamwork: 76,
      professionalism: 78,
      attendance: 79,
      cultureFit: 75,
      conflictResolution: 70,
    },
    workHistory: [
      { company: "Marriott Courtyard", role: "Security Officer", dates: "2020 – 2024", verified: true },
      { company: "Securitas", role: "Guard", dates: "2018 – 2020", verified: false },
    ],
    endorsements: ["Punctuality", "Customer Service"],
    strengths: ["Customer Service"],
    growthAreas: ["Leadership", "Peer verification depth"],
    praiseWords: [
      { word: "friendly", count: 5 },
      { word: "punctual", count: 4 },
    ],
    concernWords: [
      { word: "leadership", count: 4 },
      { word: "consistency", count: 3 },
    ],
    aiSummary:
      "David has adequate customer service signals but limited peer verification depth. Leadership scores below role threshold for supervisor positions.",
    riskFlags: [
      { label: "Attendance concerns", status: "green", detail: "Minor attendance notes" },
      { label: "Leadership gap", status: "yellow", detail: "Leadership below supervisor threshold" },
      { label: "Verification depth", status: "yellow", detail: "Only 6 verified coworkers" },
    ],
  },
];

export const COMPARE_METRICS = [
  "Trust Score",
  "Leadership",
  "Communication",
  "Reliability",
  "Retention",
  "Teamwork",
  "Professionalism",
] as const;

export const ROI_STATS = {
  turnoverReduction: 47,
  badHireReduction: 38,
  timeSavedHours: 14,
};

export const LANDING_STATS = [
  { value: 94, suffix: "%", label: "Employers say references rarely tell the full story" },
  { value: 82, suffix: "%", label: "Hiring managers wish they had more reliable candidate insights" },
];

export const FAIRNESS_GUIDELINES = [
  "Be honest, specific, and constructive",
  "Focus on workplace behavior you directly observed",
  "Avoid personal attacks or protected-class references",
  "Reviews are tied to verified work overlap",
];

/** Per-screen onboarding copy — explains why each feature matters. */
export type StepInsight = {
  eyebrow?: string;
  title: string;
  subtitle: string;
  whyItMatters: string;
  featureLabel?: string;
  featureTooltip?: string;
};

export const EMPLOYEE_STEP_INSIGHTS: StepInsight[] = [
  {
    eyebrow: "Step 1 · Profile",
    title: "Welcome to WorkVouch",
    subtitle: "Create your verified professional profile in seconds.",
    whyItMatters:
      "Verified work history is the foundation of trust. Employers stop guessing when your roles are confirmed—not just listed on a resume.",
    featureLabel: "Verified profile",
    featureTooltip:
      "WorkVouch validates employment through coworker overlap and employer records, creating proof that travels with you.",
  },
  {
    eyebrow: "Step 2 · Matching",
    title: "Matching coworkers",
    subtitle: "We find people who actually worked beside you.",
    whyItMatters:
      "Peer verification beats generic references. Reviews from verified coworkers carry far more weight than a manager who barely knew you.",
    featureLabel: "Peer verification",
    featureTooltip:
      "Matches are based on employer, department, and date overlap—so every review comes from someone who was really there.",
  },
  {
    eyebrow: "Step 3 · Reviews",
    title: "Reviews are arriving",
    subtitle: "Real feedback from verified coworkers builds your reputation.",
    whyItMatters:
      "Structured, categorized reviews reveal reliability and teamwork in ways a resume never could. This is what employers actually want to see.",
    featureLabel: "Reference quality",
    featureTooltip:
      "Ratings are weighted by reviewer credibility, specificity, and consistency across multiple references.",
  },
  {
    eyebrow: "Step 4 · Trust Score",
    title: "Your Trust Score",
    subtitle: "A single number that captures years of verified reputation.",
    whyItMatters:
      "One glance tells employers what dozens of reference calls used to. High trust scores correlate with 2× more interview requests.",
    featureLabel: "Trust Score",
    featureTooltip:
      "Composite score (0–100) from verified reviews, job consistency, attendance themes, and reference quality.",
  },
  {
    eyebrow: "Step 5 · Analytics",
    title: "Your reputation analytics",
    subtitle: "Visual breakdown of strengths, skills, and growth areas.",
    whyItMatters:
      "Patterns across employers reveal true strengths—not interview performance. Consistency is one of the strongest hiring signals.",
    featureLabel: "Consistency metrics",
    featureTooltip:
      "Tracks whether ratings align across employers and time periods—a strong signal of genuine reliability.",
  },
  {
    eyebrow: "Step 6 · Give back",
    title: "Leave reviews for coworkers",
    subtitle: "Help others build verified reputations too.",
    whyItMatters:
      "Two-way trust creates a fair reputation economy. Workers who give thoughtful reviews build stronger networks and credibility.",
    featureLabel: "Fair review system",
    featureTooltip:
      "Reviews require verified work overlap and follow fairness guidelines to protect both reviewers and recipients.",
  },
  {
    eyebrow: "Step 7 · Timeline",
    title: "Career timeline",
    subtitle: "Jobs, reviews, skills, and badges—your verified journey.",
    whyItMatters:
      "Your reputation is portable. Years of verified work follow you between jobs so you never start from zero again.",
    featureLabel: "Portable reputation",
    featureTooltip:
      "Endorsements, badges, and verified tenure accumulate over time and stay with your WorkVouch profile forever.",
  },
  {
    eyebrow: "Step 8 · Matches",
    title: "Employers want your reputation",
    subtitle: "Matched by verified trust signals in your industry.",
    whyItMatters:
      "Get discovered by employers searching for proven reliability—not keyword matches. Trust-based matching cuts job search time dramatically.",
    featureLabel: "Trust-based matching",
    featureTooltip:
      "Employers filter candidates by trust score, skills, and retention signals before ever reading a resume.",
  },
  {
    eyebrow: "Step 9 · Benefits",
    title: "Your WorkVouch benefits",
    subtitle: "Turn years of hard work into verified trust employers recognize.",
    whyItMatters:
      "Workers with verified profiles receive 2.4× more employer views and report significantly higher confidence when applying.",
    featureLabel: "Worker ROI",
    featureTooltip:
      "Portable trust reduces time-to-hire for workers and increases callback rates across hospitality, security, and retail.",
  },
  {
    eyebrow: "Complete",
    title: "Congratulations!",
    subtitle: "Your WorkVouch profile is ready for employers to discover.",
    whyItMatters:
      "You've built what resumes can't show: verified trust from real coworkers. Now see how employers use this to hire with confidence.",
    featureLabel: "Full circle",
    featureTooltip:
      "The employee and employer experiences connect through shared trust data—one platform, both sides of hiring.",
  },
];

export const EMPLOYER_STEP_INSIGHTS: StepInsight[] = [
  {
    eyebrow: "Step 1 · Setup",
    title: "Company onboarding",
    subtitle: "Set up your organization to hire with verified trust data.",
    whyItMatters:
      "One-time setup unlocks trust-based hiring across every role. No more reference tag—you see peer-verified signals instantly.",
    featureLabel: "Employer workspace",
    featureTooltip:
      "Your hiring team gets a shared dashboard for trust scores, pipelines, and candidate comparison.",
  },
  {
    eyebrow: "Step 2 · Dashboard",
    title: "Hiring dashboard",
    subtitle: "Real-time view of applications, trust scores, and pipeline health.",
    whyItMatters:
      "Spot quality candidates faster. Average trust score and pipeline metrics help you prioritize who deserves an interview today.",
    featureLabel: "Hiring pipeline",
    featureTooltip:
      "Track candidates from application through offer with trust signals visible at every stage.",
  },
  {
    eyebrow: "Step 3 · Search",
    title: "Candidate search",
    subtitle: "Ranked by verified trust score—not resume keywords.",
    whyItMatters:
      "Stop sorting through unverified resumes. Trust scores surface reliable candidates before you invest in interviews.",
    featureLabel: "Trust-ranked search",
    featureTooltip:
      "Candidates are ranked by composite trust score, verified employment depth, and peer endorsement count.",
  },
  {
    eyebrow: "Step 4 · Profile",
    title: "Candidate profile",
    subtitle: "Everything you need to evaluate fit—beyond the resume.",
    whyItMatters:
      "See attendance, leadership, retention likelihood, and culture fit from real coworkers—not self-reported claims.",
    featureLabel: "Retention indicators",
    featureTooltip:
      "Derived from tenure patterns, rehire mentions, and attendance themes in peer reviews.",
  },
  {
    eyebrow: "Step 5 · Reviews",
    title: "Review breakdown",
    subtitle: "Strength trends, praise patterns, and honest concerns.",
    whyItMatters:
      "Word clouds and trend analysis surface what references actually say—saving hours of phone tag and guesswork.",
    featureLabel: "Review intelligence",
    featureTooltip:
      "Aggregates themes across all verified reviews to show praise patterns and recurring concerns.",
  },
  {
    eyebrow: "Step 6 · Compare",
    title: "Candidate comparison",
    subtitle: "Side-by-side metrics on the dimensions that predict success.",
    whyItMatters:
      "Compare apples to apples on trust, leadership, and retention—not just years of experience or education.",
    featureLabel: "Comparison tools",
    featureTooltip:
      "Standardized metrics let hiring managers compare finalists objectively across seven key dimensions.",
  },
  {
    eyebrow: "Step 7 · AI Insights",
    title: "AI hiring summary",
    subtitle: "Instant synthesis of peer feedback across employers.",
    whyItMatters:
      "Get a hiring manager-ready summary in seconds—what used to take three reference calls and a gut feeling.",
    featureLabel: "WorkVouch Insights",
    featureTooltip:
      "AI summarizes verified peer themes, flags gaps, and recommends fit based on role requirements.",
  },
  {
    eyebrow: "Step 8 · Risk",
    title: "Risk detection",
    subtitle: "Automated flags for attendance, professionalism, and experience gaps.",
    whyItMatters:
      "Catch hiring risks before the offer—not after 90 days. Yellow flags prompt deeper conversation; green flags build confidence.",
    featureLabel: "Risk alerts",
    featureTooltip:
      "Signals derived from review themes, verification depth, and consistency across employers.",
  },
  {
    eyebrow: "Step 9 · ROI",
    title: "Your ROI with WorkVouch",
    subtitle: "Quantified impact on turnover, bad hires, and reference time.",
    whyItMatters:
      "Employers in pilot programs report up to 47% fewer early-term exits and 14 hours saved per hire on reference checks.",
    featureLabel: "Hiring ROI",
    featureTooltip:
      "Based on industry benchmarks from hospitality and security hiring pilots using trust-based screening.",
  },
  {
    eyebrow: "Success",
    title: "Hire with confidence",
    subtitle: "Make the offer based on reputation—not guesswork.",
    whyItMatters:
      "You just made a data-informed hire using verified peer trust. That's the WorkVouch difference.",
    featureLabel: "Confident hiring",
    featureTooltip:
      "Every hire backed by verified coworker data reduces turnover risk and speeds time-to-productivity.",
  },
];
