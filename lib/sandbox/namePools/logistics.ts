import type { NamePool } from "./types";

export const logistics: NamePool = {
  firstNames: [
    "James", "Marcus", "David", "Carlos", "Michael", "Robert", "John", "William", "Richard", "Joseph",
    "Maria", "Jennifer", "Linda", "Patricia", "Elizabeth", "Susan", "Jessica", "Sarah", "Ashley", "Amanda",
    "Anthony", "Daniel", "Christopher", "Matthew", "Kevin", "Brandon", "Jason", "Brian", "Eric", "Steven",
  ],
  lastNames: [
    "Smith", "Johnson", "Williams", "Brown", "Jones", "Garcia", "Miller", "Davis", "Rodriguez", "Martinez",
    "Wilson", "Anderson", "Thomas", "Taylor", "Moore", "Jackson", "Martin", "Lee", "Thompson", "White",
    "Harris", "Clark", "Lewis", "Robinson", "Walker", "Young", "Hall", "Allen", "King", "Wright",
  ],
  departments: [
    "Fleet", "Fleet", "Fleet", "Warehouse", "Warehouse", "Warehouse", "Regional", "Regional", "Admin",
  ],
  jobTitles: {
    Fleet: ["Fleet Manager", "Dispatch Supervisor", "Driver Lead", "Driver", "Driver", "Driver", "Driver", "Logistics Coordinator", "Logistics Coordinator"],
    Warehouse: ["Warehouse Manager", "Shift Supervisor", "Supervisor", "Warehouse Associate", "Warehouse Associate", "Warehouse Associate", "Picker", "Picker", "Forklift Operator"],
    Regional: ["Regional Manager", "Site Manager", "Operations Lead", "Operations Coordinator", "Operations Coordinator", "Coordinator"],
    Admin: ["Admin Manager", "Administrative Coordinator", "Clerk", "Clerk", "Data Entry", "Data Entry"],
  },
  geographicClusters: [
    "Northeast", "Southeast", "Midwest", "Southwest", "West", "Pacific", "Regional Hub A", "Regional Hub B",
  ],
};
