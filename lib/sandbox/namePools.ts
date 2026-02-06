/**
 * Enterprise sandbox name pools. 100 first, 100 last, 50 company, 40 job titles, 15 industries, 20 departments.
 * All random selection utilities. No hardcoded "Sandbox Company".
 */

export const FIRST_NAMES = [
  "James", "Robert", "John", "Michael", "David", "William", "Richard", "Joseph", "Thomas", "Charles",
  "Margaret", "Elizabeth", "Susan", "Jennifer", "Linda", "Patricia", "Barbara", "Nancy", "Karen", "Lisa",
  "Christopher", "Daniel", "Matthew", "Anthony", "Mark", "Donald", "Steven", "Paul", "Andrew", "Joshua",
  "Sarah", "Jessica", "Emily", "Ashley", "Amanda", "Stephanie", "Nicole", "Heather", "Melissa", "Rebecca",
  "Ryan", "Jacob", "Gary", "Nicholas", "Eric", "Jonathan", "Stephen", "Larry", "Justin", "Scott",
  "Rachel", "Laura", "Michelle", "Kimberly", "Angela", "Amy", "Christina", "Kelly", "Sandra", "Deborah",
  "Brandon", "Benjamin", "Samuel", "Raymond", "Gregory", "Frank", "Alexander", "Patrick", "Jack", "Dennis",
  "Mary", "Dorothy", "Helen", "Debra", "Carol", "Ruth", "Sharon", "Cynthia", "Kathleen", "Anna",
  "Henry", "Carl", "Arthur", "Ryan", "Dylan", "Nathan", "Ethan", "Zachary", "Aaron", "Tyler",
  "Emma", "Olivia", "Ava", "Isabella", "Sophia", "Mia", "Charlotte", "Amelia", "Harper", "Evelyn",
];

export const LAST_NAMES = [
  "Smith", "Johnson", "Williams", "Brown", "Jones", "Garcia", "Miller", "Davis", "Rodriguez", "Martinez",
  "Wilson", "Anderson", "Thomas", "Taylor", "Moore", "Jackson", "Martin", "Lee", "Thompson", "White",
  "Harris", "Clark", "Lewis", "Robinson", "Walker", "Young", "Hall", "Allen", "King", "Wright",
  "Scott", "Torres", "Nguyen", "Hill", "Flores", "Green", "Adams", "Nelson", "Baker", "Hall",
  "Rivera", "Campbell", "Mitchell", "Carter", "Roberts", "Gomez", "Phillips", "Evans", "Turner", "Diaz",
  "Parker", "Cruz", "Edwards", "Collins", "Reyes", "Stewart", "Morris", "Morales", "Murphy", "Cook",
  "Rogers", "Gutierrez", "Ortiz", "Morgan", "Cooper", "Peterson", "Bailey", "Reed", "Kelly", "Howard",
  "Ramos", "Kim", "Cox", "Ward", "Richardson", "Watson", "Brooks", "Chavez", "Wood", "James",
  "Bennett", "Gray", "Mendoza", "Ruiz", "Hughes", "Price", "Alvarez", "Castillo", "Sanders", "Patel",
  "Myers", "Long", "Ross", "Foster", "Jimenez", "Powell", "Jenkins", "Perry", "Russell", "Sullivan",
];

export const COMPANY_NAMES = [
  "Acme Corp", "Beta Industries", "Gamma Labs", "Delta Solutions", "Epsilon Tech",
  "Zenith Partners", "Apex Consulting", "Nova Systems", "Prime Holdings", "Summit Group",
  "Vertex Analytics", "Nexus Ventures", "Pinnacle Capital", "Catalyst Labs", "Meridian Group",
  "Atlas Industries", "Horizon Media", "Stellar Dynamics", "Quantum Logic", "Fusion Works",
  "Cascade Partners", "Titan Enterprises", "Aurora Networks", "Crimson Consulting", "Onyx Solutions",
  "Vanguard Systems", "Pulse Technologies", "Ember Industries", "Forge Capital", "Beacon Group",
  "Strata Holdings", "Lumina Partners", "Cipher Tech", "Apex Dynamics", "Nimbus Labs",
  "Ridge Capital", "Flux Industries", "Prism Analytics", "Echo Ventures", "Helix Group",
  "Crest Partners", "Vector Solutions", "Nova Capital", "Pinnacle Tech", "Summit Ventures",
  "Meridian Labs", "Catalyst Group", "Vertex Holdings", "Zenith Capital", "Apex Group",
];

export const JOB_TITLES = [
  "Software Engineer", "Senior Software Engineer", "Staff Engineer", "Engineering Manager", "VP Engineering",
  "Product Manager", "Senior Product Manager", "Director of Product", "VP Product",
  "Data Analyst", "Senior Data Analyst", "Data Scientist", "Analytics Manager",
  "Sales Representative", "Account Executive", "Sales Manager", "VP Sales",
  "Marketing Manager", "Content Strategist", "Growth Lead", "VP Marketing",
  "HR Coordinator", "HR Business Partner", "HR Manager", "Recruiter", "CHRO",
  "Finance Analyst", "Senior Financial Analyst", "Finance Manager", "VP Finance",
  "Operations Specialist", "Operations Manager", "COO",
  "Legal Counsel", "Senior Counsel", "General Counsel",
  "Security Officer", "Security Analyst", "CISO",
  "Customer Success Manager", "Support Lead", "VP Customer Success",
];

export const INDUSTRIES = [
  "Technology", "Healthcare", "Finance", "Retail", "Manufacturing",
  "Education", "Energy", "Media", "Consulting", "Insurance",
  "Real Estate", "Transportation", "Hospitality", "Security", "Legal",
];

export const DEPARTMENTS = [
  "Engineering", "Product", "Sales", "Marketing", "HR",
  "Finance", "Operations", "Legal", "Customer Success", "Support",
  "Data", "Design", "Security", "Compliance", "Strategy",
  "R&D", "Supply Chain", "Procurement", "Facilities", "IT",
];

function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

export function pickFirst(): string {
  return FIRST_NAMES[randomInt(0, FIRST_NAMES.length - 1)];
}

export function pickLast(): string {
  return LAST_NAMES[randomInt(0, LAST_NAMES.length - 1)];
}

export function pickFullName(): string {
  return `${pickFirst()} ${pickLast()}`;
}

export function pickCompany(): string {
  const companies = [
    "Atlas Security Group",
    "Sentinel Protective Services",
    "IronGate Patrol",
    "Vanguard Risk Solutions",
    "BlackShield Security",
    "Fortress Operations",
    "Cobalt Enforcement",
    "Titan Field Services",
    "Aegis Workforce",
    "Pinnacle Security Systems",
  ];
  return companies[Math.floor(Math.random() * companies.length)]!;
}

export function pickJobTitle(): string {
  return JOB_TITLES[randomInt(0, JOB_TITLES.length - 1)];
}

export function pickIndustry(): string {
  const industries = [
    "Security",
    "Healthcare",
    "Logistics",
    "Construction",
    "Retail",
    "Technology",
    "Manufacturing",
  ];
  return industries[Math.floor(Math.random() * industries.length)]!;
}

export function pickDepartment(): string {
  return DEPARTMENTS[randomInt(0, DEPARTMENTS.length - 1)];
}

export function pickFrom<T>(arr: readonly T[]): T {
  return arr[randomInt(0, arr.length - 1)];
}

const POOL_MAP: Record<string, readonly string[]> = {
  firstNames: FIRST_NAMES,
  lastNames: LAST_NAMES,
  companyNames: COMPANY_NAMES,
  jobTitles: JOB_TITLES,
  industries: INDUSTRIES,
  departments: DEPARTMENTS,
  geographicClusters: ["HQ", "Northeast", "Southeast", "Midwest", "Default"],
};

/**
 * Get a name pool array by pool name. Returns empty array for unknown names.
 */
export function getPool(poolName: string): string[] {
  const key = poolName?.trim() || "";
  const arr = POOL_MAP[key];
  return arr ? [...arr] : [];
}
