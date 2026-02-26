export type EmployeeTrust = { trustScore: number; [k: string]: unknown };

export function complianceRisk(
  employees: { trustScore: number }[],
  threshold: number
) {
  if (employees.length === 0) {
    return { total: 0, atRisk: 0, riskPercent: 0 };
  }
  const atRisk = employees.filter((e) => e.trustScore < threshold).length;
  return {
    total: employees.length,
    atRisk,
    riskPercent: Math.round((atRisk / employees.length) * 100),
  };
}
