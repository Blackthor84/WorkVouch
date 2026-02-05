import type { NamePool } from "./types";

export const security: NamePool = {
  firstNames: [
    "James", "Marcus", "David", "Carlos", "Michael", "Anthony", "Robert", "Derek", "John", "Terrell",
    "William", "Joseph", "Richard", "Kevin", "Thomas", "Brandon", "Charles", "Marcus", "Daniel", "Tyrone",
    "Maria", "Latoya", "Jennifer", "Shanice", "Linda", "Ebony", "Patricia", "Alicia", "Elizabeth", "Monique",
  ],
  lastNames: [
    "Smith", "Johnson", "Williams", "Brown", "Jones", "Davis", "Wilson", "Taylor", "Moore", "Jackson",
    "Martin", "Lee", "Thompson", "White", "Harris", "Clark", "Lewis", "Robinson", "Walker", "Young",
    "Hall", "Allen", "King", "Wright", "Scott", "Green", "Baker", "Adams", "Nelson", "Carter",
  ],
  departments: [
    "Operations", "Operations", "Operations", "Field", "Field", "Compliance", "Compliance", "HR",
  ],
  jobTitles: {
    Operations: ["Operations Manager", "Shift Supervisor", "Security Officer", "Security Officer", "Security Officer", "Site Lead", "Patrol Officer", "Patrol Officer"],
    Field: ["Field Supervisor", "Security Officer", "Security Officer", "Guard", "Guard", "Guard"],
    Compliance: ["Compliance Manager", "Compliance Officer", "Compliance Officer", "Auditor"],
    HR: ["HR Manager", "HR Coordinator", "Recruiter", "Recruiter"],
  },
  geographicClusters: [
    "Northeast", "Northeast", "Southeast", "Southeast", "Midwest", "Southwest", "West", "Pacific",
  ],
};
