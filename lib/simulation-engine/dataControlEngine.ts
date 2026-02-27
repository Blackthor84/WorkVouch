/**
 * Simulation Data Control Engine: creates fake employers and employees.
 * All fake data feeds into engines; no placeholder data.
 * Employers can create, adjust, save, duplicate, fork. Employees: individual or bulk 10–1000 with full distribution control.
 */

import type { Employer, Employee, Review } from "./domain";
import { createInitialSnapshot, applyDelta } from "./reducer";

export type ReviewSource = Review["source"];

export interface FakeEmployerParams {
  name: string;
  industry: string;
  threshold: number;
  decayRate: number;
  supervisorWeight: number;
  riskTolerance: number;
}

export interface FakeEmployeeParams {
  name: string;
  role: string;
  department: string;
  trustScoreMin: number;
  trustScoreMax: number;
  confidenceScoreMin: number;
  confidenceScoreMax: number;
  reviewCount: number;
  reviewSourceMix: Partial<Record<ReviewSource, number>>;
}

function deterministicId(seed: number): string {
  return `sim-${seed}-${Math.abs((seed * 9301 + 49297) % 233280)}`;
}

function pickSource(mix: Partial<Record<ReviewSource, number>>): ReviewSource {
  const keys: ReviewSource[] = ["peer", "supervisor", "manager", "synthetic", "self", "external"];
  const total = keys.reduce((s, k) => s + (mix[k] ?? 0), 0) || 1;
  let r = (Math.abs((Date.now() * 31 + 1) % 1000) / 1000) * total;
  for (const k of keys) {
    const w = mix[k] ?? 0;
    if (r <= w) return k;
    r -= w;
  }
  return "peer";
}

export function createFakeEmployer(params: FakeEmployerParams, idSeed: number): Employer {
  const id = deterministicId(idSeed);
  return {
    id,
    name: params.name,
    industry: params.industry,
    policy: {
      threshold: params.threshold,
      decayRate: params.decayRate,
      supervisorWeight: params.supervisorWeight,
      riskTolerance: params.riskTolerance,
    },
  };
}

export function createFakeEmployee(params: FakeEmployeeParams, idSeed: number): Employee {
  const id = deterministicId(idSeed);
  const initial = createInitialSnapshot(Date.now() - idSeed * 1000);
  const trustTarget =
    params.trustScoreMin + (Math.abs((idSeed * 17) % 1000) / 1000) * (params.trustScoreMax - params.trustScoreMin);
  const reviews: Review[] = [];
  const weightPerReview = params.reviewCount > 0 ? (trustTarget / 10) / params.reviewCount : 0;
  for (let i = 0; i < params.reviewCount; i++) {
    reviews.push({
      id: `${id}-r-${i}`,
      source: pickSource(params.reviewSourceMix),
      weight: Math.max(0.1, weightPerReview * (0.8 + (Math.abs((idSeed + i * 7) % 100) / 100) * 0.4)),
      timestamp: Date.now() - (params.reviewCount - i) * 86400000,
    });
  }
  const snapshot = applyDelta(initial, { addedReviews: reviews, timestamp: Date.now() });
  return {
    id,
    name: params.name,
    role: params.role,
    department: params.department,
    snapshot,
  };
}

export function bulkCreateFakeEmployees(
  params: Omit<FakeEmployeeParams, "name"> & { namePrefix: string },
  count: number
): Employee[] {
  const employees: Employee[] = [];
  for (let i = 0; i < Math.min(1000, Math.max(10, count)); i++) {
    employees.push(
      createFakeEmployee(
        {
          ...params,
          name: `${params.namePrefix} ${i + 1}`,
        },
        Date.now() + i
      )
    );
  }
  return employees;
}
