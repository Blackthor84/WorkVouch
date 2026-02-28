# Employee Outcome Designer — Refactor Summary

The Trust Simulation Lab has been refactored into a **profile-centric Employee Outcome Designer**. All simulations operate on a derived, simulated profile; no real employee data is ever modified.

---

## Success criteria (all met)

| Criterion | Status |
|-----------|--------|
| Employers can design the employee they want to hire | ✅ Profile editor with all controls |
| Outcomes update instantly and clearly | ✅ Outcome panel sticky, live from `profileSnapshot` |
| No information is scattered | ✅ Single Designer section + optional Advanced tabs |
| Advanced power remains available but optional | ✅ Compare / Stress Test / ROI / Decision Trainer tabs |
| Product is intuitive without losing depth | ✅ Clear sections, SIMULATED labels, reversible reset |

---

## Part A — Core structure

- **Primary object:** `SimulatedEmployeeProfile` (see `lib/playground/simulatedProfile.ts`).
- **Derived snapshot:** `buildSnapshotFromProfile(profile)` runs trust, confidence, fragility, debt, compliance with industry threshold.
- **No real data modified:** `replaceHistory([profileSnapshot])` sets simulation history to the profile-derived snapshot when not in multiverse. All lab actions operate on this simulated state.

---

## Part B — Employee profile editor

**File:** `app/admin/playground/EmployeeProfileEditor.tsx`

Editable controls (all drive immediate re-run of engines via `profileSnapshot`):

- Industry (restricted to supported industries)
- Role / job type
- Years of experience
- Number of employers, average tenure, employment gaps
- Supervisor verifications (count + strength/weight)
- Peer reviews (count, sentiment, recency), coworker reviews
- Network strength
- Certifications / licenses (industry-aware; helper text notes thresholds vary by industry)

Reset to default is reversible and keeps current industry.

---

## Part C — Outcome panel

**File:** `app/admin/playground/OutcomePanel.tsx`

Single, always-visible panel (sticky right column) showing:

- Trust score, confidence score
- Compliance status (SAFE / AT RISK)
- Fragility (LOW / MEDIUM / HIGH)
- Trust debt
- Risk flags (None or list)
- Est. Exposure (optional, gated by ROI feature flag and material risk)

Panel updates live on every profile change. Labeled SIMULATED.

---

## Part D — Advanced tools

Preserved as **optional tabs** in the same section:

- **Compare:** Scenario A/B, load scenarios, MultiverseGraph or TrustChart.
- **Stress Test:** Universe selector, GodModeActions, ChaosPresets (feature-flagged).
- **ROI:** ROIPanel with snapshot, inputs, assumptions, comparison (feature-flagged).
- **Decision Trainer:** Force hire/reject (multiverse or god mode required).

All operate on the current simulated profile (`effectiveSnapshot` = multiverse ? sim.snapshot : profileSnapshot).

---

## Part E — Industry context

**File:** `lib/industries/index.ts`

All nine industries with thresholds and labels:

- retail, education, law_enforcement, security, warehouse_logistics, healthcare, hospitality, skilled_trades, construction

Industry selection drives `INDUSTRY_THRESHOLDS[industry]` in `buildSnapshotFromProfile` and in the Outcome Panel compliance check.

---

## Part F — Visibility & safety

- **Feature flags:** ROI, counterfactual, population sim, multiverse advanced, adversarial mode gated via `canAccessFeature(..., { role, isFounder })`. Only founder/superadmin can access unreleased features when flags are on.
- **SIMULATED:** Designer title badge, Outcome Panel badge, snapshot metadata `notes: "SIMULATED — Employee Outcome Designer"`.
- **Exports watermarked:** Scenario-only CSV uses `scenarioReportWithWatermark` (adds `[SIMULATION]` row). ROI exports use `roiSectionRows` with "This report is watermarked SIMULATION."
- **No public exposure:** Playground lives under `/playground` and `/admin/playground`; access controlled by app auth/layout.

---

## Modified and new files (paths)

| File | Role |
|------|------|
| `lib/playground/simulatedProfile.ts` | **New.** Profile type, defaults, profileToReviews, buildSnapshotFromProfile. |
| `lib/industries/index.ts` | **Existing.** Industries + thresholds (no change needed). |
| `lib/trust/applyDelta.ts` | **Existing.** Accepts `ctx` (e.g. thresholdOverride) for industry. |
| `lib/trust/useSimulation.ts` | **Modified.** Added `replaceHistory(snapshots, index)`. |
| `lib/exports/exportCSV.ts` | **Modified.** Added `scenarioReportWithWatermark`. |
| `lib/client/exportCSV.ts` | **Modified.** Re-export `scenarioReportWithWatermark`. |
| `app/admin/playground/EmployeeProfileEditor.tsx` | **New.** Full profile form. |
| `app/admin/playground/OutcomePanel.tsx` | **New.** Sticky outcome panel. |
| `app/admin/playground/PlaygroundClient.tsx` | **Modified.** Designer section, profile state, replaceHistory, advanced tabs, effectiveSnapshot, ROI/export watermark. |
| `app/playground/page.tsx` | **Existing.** Renders PlaygroundClient. |

Full contents of the smaller/new files are in the repo at the paths above. Key additions in `PlaygroundClient.tsx`:

- `simulatedProfile` state, `profileSnapshot = useMemo(buildSnapshotFromProfile(simulatedProfile))`, `useEffect` calling `replaceHistory([profileSnapshot])` when not multiverse.
- Designer section: header "Employee Outcome Designer (SIMULATED)", subtitle "Industry: … | Role: …", two-column grid with `EmployeeProfileEditor` (left) and `OutcomePanel` (right). `OutcomePanel` receives `financialExposure` only when `showROI && roiResult?.hasMaterialRisk`.
- Advanced section: tab state `advancedTab`, tabs Compare | Stress Test | ROI | Decision Trainer, each tab rendering the corresponding content; ROI and Stress/Decision Trainer gated by feature flags and role.
- `effectiveSnapshot = multiverseMode ? sim.snapshot : profileSnapshot` used for Command Center and ROI so advanced tools use the current simulated profile when not in multiverse.
