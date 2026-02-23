/**
 * Company trust heatmap: which companies produce reliable references?
 * Employer-only, aggregated. Never show publicly.
 * Green: ≥80, Yellow: 60–79, Red: <60.
 * Deterministic, in-memory; no DB writes for demo.
 */

export type CompanyReferenceInput = {
  credibility: number;
  [key: string]: unknown;
};

export type CompanyTrustResult = {
  companyTrustScore: number;
  sampleSize: number;
};

export function calculateCompanyTrust(
  companyReferences: CompanyReferenceInput[]
): CompanyTrustResult {
  if (companyReferences.length === 0) {
    return { companyTrustScore: 0, sampleSize: 0 };
  }

  const sum = companyReferences.reduce((a, b) => a + b.credibility, 0);
  const avg = sum / companyReferences.length;

  return {
    companyTrustScore: Math.round(avg),
    sampleSize: companyReferences.length,
  };
}

/** Heatmap band for UI: green ≥80, yellow 60–79, red <60. */
export function getCompanyTrustBand(score: number): "green" | "yellow" | "red" {
  if (score >= 80) return "green";
  if (score >= 60) return "yellow";
  return "red";
}
