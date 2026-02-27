/**
 * Phase 12: Break the Multiverse — reversible chaos.
 * Fork multiple universes, conflicting truths, reverse time, collapse, divergence + narrative.
 */

import type { Universe } from "./types";
import {
  createUniverse,
  forkUniverseAt,
  trustCollapse,
  fakeConsensusInjection,
  supervisorOverride,
  timeTravelTo,
} from "./engine";

export type BreakResult = {
  universes: Universe[];
  divergenceScore: number;
  narrative: string;
};

function auditId(): string {
  return `break-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

export function breakTheMultiverse(initialUniverse: Universe): BreakResult {
  const universes: Universe[] = [];
  const base = initialUniverse;
  const now = Date.now();

  // Fork A: inject strong positive
  const forkA = forkUniverseAt(base, base.timeline[base.timeline.length - 1]?.at ?? now);
  const uA = supervisorOverride(forkA, 3, auditId());
  universes.push(uA);

  // Fork B: inject conflicting negative (reverse feel via collapse then fake consensus)
  const forkB = forkUniverseAt(base, base.timeline[base.timeline.length - 1]?.at ?? now);
  const uB = trustCollapse(forkB, auditId());
  universes.push(uB);

  // Fork C: rewind time (use earlier timeline step)
  const forkC = forkUniverseAt(base, base.timeline[0]?.at ?? now);
  const step = Math.floor(forkC.timeline.length / 2);
  const uC = timeTravelTo(forkC, step);
  universes.push(uC);

  // Fork D: collapse into single outcome (one universe with forced state)
  const forkD = forkUniverseAt(base, base.timeline[base.timeline.length - 1]?.at ?? now);
  const uD = trustCollapse(forkD, auditId());
  universes.push(uD);

  const scores = universes.map((u) => u.trustState.trustScore);
  const min = Math.min(...scores);
  const max = Math.max(...scores);
  const divergenceScore = max - min;

  const narrative = [
    "Multiverse broken:",
    `${universes.length} universes forked.`,
    `Universe A: strong supervisor override (score ${uA.trustState.trustScore.toFixed(0)}).`,
    `Universe B: trust collapsed (score ${uB.trustState.trustScore.toFixed(0)}).`,
    `Universe C: time rewound to step ${step}.`,
    `Universe D: collapsed to zero.`,
    `Divergence score: ${divergenceScore.toFixed(1)}.`,
  ].join(" ");

  return { universes, divergenceScore, narrative };
}
