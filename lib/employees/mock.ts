import type { TrustSnapshot } from "@/lib/trust/types";

export const mockEmployees = [
  {
    id: "1",
    name: "Jane RN",
    trust: {
      trustScore: 54,
      confidenceScore: 39,
      networkStrength: 4,
      reviews: [
        {
          id: "r1",
          source: "peer" as const,
          weight: 1,
          timestamp: Date.now() - 100000,
        },
      ],
    } as TrustSnapshot,
  },
];
