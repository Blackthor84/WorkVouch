import type { NamePool } from "./types";

export const tech: NamePool = {
  firstNames: [
    "Alex", "Jordan", "Taylor", "Morgan", "Casey", "Riley", "Avery", "Quinn", "Skyler", "Drew",
    "Ryan", "Chris", "Jamie", "Sam", "Kai", "Devon", "Cameron", "Reese", "Blake", "Parker",
    "Priya", "Wei", "Yuki", "Omar", "Liam", "Noah", "Ethan", "Mason", "Logan", "Lucas",
  ],
  lastNames: [
    "Chen", "Kim", "Patel", "Nguyen", "Singh", "Zhang", "Liu", "Park", "Sharma", "Wu",
    "Johnson", "Smith", "Williams", "Brown", "Lee", "Martinez", "Garcia", "Davis", "Wilson", "Taylor",
    "Thompson", "Anderson", "Thomas", "Jackson", "White", "Harris", "Martin", "Clark", "Lewis", "Robinson",
  ],
  departments: [
    "Engineering", "Engineering", "Engineering", "Product", "Product", "Growth", "Growth", "Ops", "Ops",
  ],
  jobTitles: {
    Engineering: ["Engineering Manager", "Staff Engineer", "Senior Engineer", "Senior Engineer", "Software Engineer", "Software Engineer", "Software Engineer", "DevOps Engineer", "QA Engineer"],
    Product: ["Product Manager", "Product Manager", "Product Designer", "UX Designer", "Analyst", "Analyst"],
    Growth: ["Growth Lead", "Growth Manager", "Marketing Manager", "Marketing Specialist", "Marketing Specialist", "SDR", "SDR", "SDR"],
    Ops: ["Ops Manager", "Operations Lead", "Operations Specialist", "Operations Specialist", "Support Lead", "Support Engineer", "Support Engineer"],
  },
  geographicClusters: [
    "SF Bay", "SF Bay", "NYC", "NYC", "Seattle", "Austin", "Remote", "Remote", "Remote",
  ],
};
