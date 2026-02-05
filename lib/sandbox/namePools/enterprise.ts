import type { NamePool } from "./types";

export const enterprise: NamePool = {
  firstNames: [
    "James", "Robert", "John", "Michael", "David", "William", "Richard", "Joseph", "Thomas", "Charles",
    "Margaret", "Elizabeth", "Susan", "Jennifer", "Linda", "Patricia", "Barbara", "Nancy", "Karen", "Lisa",
    "Christopher", "Daniel", "Matthew", "Anthony", "Mark", "Donald", "Steven", "Paul", "Andrew", "Joshua",
  ],
  lastNames: [
    "Smith", "Johnson", "Williams", "Brown", "Jones", "Garcia", "Miller", "Davis", "Rodriguez", "Martinez",
    "Wilson", "Anderson", "Thomas", "Taylor", "Moore", "Jackson", "Martin", "Lee", "Thompson", "White",
    "Harris", "Clark", "Lewis", "Robinson", "Walker", "Young", "Hall", "Allen", "King", "Wright",
  ],
  departments: [
    "Finance", "Finance", "Legal", "Engineering", "Engineering", "Engineering", "Sales", "Sales", "HR", "Operations", "Operations",
  ],
  jobTitles: {
    Finance: ["VP Finance", "Finance Director", "Finance Manager", "Senior Analyst", "Senior Analyst", "Financial Analyst", "Financial Analyst", "Accountant", "Accountant"],
    Legal: ["General Counsel", "Legal Director", "Senior Counsel", "Counsel", "Counsel", "Paralegal", "Paralegal"],
    Engineering: ["VP Engineering", "Engineering Director", "Engineering Manager", "Staff Engineer", "Senior Engineer", "Senior Engineer", "Software Engineer", "Software Engineer", "Software Engineer"],
    Sales: ["VP Sales", "Sales Director", "Sales Manager", "Account Executive", "Account Executive", "Account Executive", "SDR", "SDR", "SDR"],
    HR: ["CHRO", "HR Director", "HR Manager", "HR Business Partner", "HR Business Partner", "Recruiter", "Recruiter", "Coordinator"],
    Operations: ["COO", "Operations Director", "Operations Manager", "Operations Lead", "Operations Specialist", "Operations Specialist", "Analyst", "Analyst"],
  },
  geographicClusters: [
    "HQ", "HQ", "Northeast", "Southeast", "Midwest", "Southwest", "West", "EMEA", "APAC", "LATAM",
  ],
};
