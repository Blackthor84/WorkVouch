/**
 * Enterprise contract shape: custom limits, manual overrides, contract dates.
 * Sales-ready; no Stripe changes. Admin toggles: increase seat count, API access, extended usage.
 */

export type EnterpriseContract = {
  accountId: string;
  startDate: string;
  endDate: string;
  overrides: {
    apiAccess?: boolean;
    seatsIncluded?: number;
    candidateViewsPerMonth?: number;
  };
};
