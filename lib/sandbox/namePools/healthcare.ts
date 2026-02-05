import type { NamePool } from "./types";

export const healthcare: NamePool = {
  firstNames: [
    "Emily", "Sarah", "Jessica", "Jennifer", "Ashley", "Amanda", "Stephanie", "Nicole", "Elizabeth", "Lauren",
    "Michael", "David", "James", "Christopher", "Matthew", "Daniel", "Andrew", "Joseph", "Ryan", "John",
    "Michelle", "Lisa", "Angela", "Melissa", "Amy", "Heather", "Rachel", "Kimberly", "Laura", "Christina",
  ],
  lastNames: [
    "Smith", "Johnson", "Williams", "Brown", "Jones", "Garcia", "Miller", "Davis", "Rodriguez", "Martinez",
    "Wilson", "Anderson", "Thomas", "Taylor", "Moore", "Jackson", "Martin", "Lee", "Thompson", "White",
    "Harris", "Clark", "Lewis", "Robinson", "Walker", "Young", "Hall", "Allen", "King", "Wright",
  ],
  departments: [
    "Clinical", "Clinical", "Clinical", "Clinical", "Admin", "Admin", "Support", "Support", "Compliance",
  ],
  jobTitles: {
    Clinical: ["Clinical Manager", "RN", "RN", "RN", "LPN", "LPN", "Care Coordinator", "Care Coordinator", "Nurse Practitioner", "Medical Assistant", "Medical Assistant"],
    Admin: ["Admin Manager", "Administrative Coordinator", "Administrative Coordinator", "Scheduler", "Scheduler", "Receptionist"],
    Support: ["Support Manager", "Patient Services Rep", "Patient Services Rep", "Medical Records", "Medical Records"],
    Compliance: ["Compliance Manager", "Compliance Officer", "Compliance Officer", "Quality Analyst"],
  },
  geographicClusters: [
    "Northeast", "Southeast", "Midwest", "Southwest", "West", "Pacific", "Regional HQ", "Metro",
  ],
};
