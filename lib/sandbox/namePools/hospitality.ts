import type { NamePool } from "./types";

export const hospitality: NamePool = {
  firstNames: [
    "Emily", "Sarah", "Jessica", "Ashley", "Amanda", "Stephanie", "Nicole", "Elizabeth", "Lauren", "Rachel",
    "Michael", "David", "James", "Christopher", "Matthew", "Daniel", "Andrew", "Joseph", "Ryan", "Brandon",
    "Maria", "Jennifer", "Lisa", "Angela", "Melissa", "Amy", "Heather", "Michelle", "Kimberly", "Laura",
  ],
  lastNames: [
    "Smith", "Johnson", "Williams", "Brown", "Jones", "Garcia", "Miller", "Davis", "Rodriguez", "Martinez",
    "Wilson", "Anderson", "Thomas", "Taylor", "Moore", "Jackson", "Martin", "Lee", "Thompson", "White",
    "Harris", "Clark", "Lewis", "Robinson", "Walker", "Young", "Hall", "Allen", "King", "Wright",
  ],
  departments: [
    "Front Desk", "Front Desk", "Front Desk", "Housekeeping", "Housekeeping", "Housekeeping", "F&B", "F&B", "Management",
  ],
  jobTitles: {
    "Front Desk": ["Front Desk Manager", "Front Office Supervisor", "Guest Services Agent", "Guest Services Agent", "Guest Services Agent", "Receptionist", "Receptionist"],
    Housekeeping: ["Housekeeping Manager", "Supervisor", "Room Attendant", "Room Attendant", "Room Attendant", "Room Attendant", "Laundry", "Laundry"],
    "F&B": ["F&B Manager", "Restaurant Supervisor", "Server", "Server", "Server", "Bartender", "Bartender", "Host", "Host"],
    Management: ["General Manager", "Assistant GM", "Operations Manager", "Guest Experience Manager", "Sales Manager"],
  },
  geographicClusters: [
    "Northeast", "Southeast", "Midwest", "Southwest", "West", "Pacific", "Resort", "Urban", "Airport",
  ],
};
