/** WorkVouch employer account reference in ATS events. */
export interface AtsEmployer {
  employerAccountId: string;
  companyName?: string;
  metadata?: Record<string, unknown>;
}
