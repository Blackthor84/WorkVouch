# Sandbox Trust System Simulator

The sandbox is extended with a **full trust system simulator** for system intelligence and safety infrastructure. This is not feature experimentation; it is used to prevent future incidents, stress-test fraud systems, and support forensic analysis.

## Principles

- Sandbox mirrors production rules unless explicitly overridden.
- Sandbox actions never affect production data.
- Every sandbox action is auditable and replayable.
- Prefer correctness, explainability, and traceability over speed.

## Parts

### 1. Replay and time-travel

- **Snapshot** sandbox state at any moment (employees, employment records, peer reviews, intelligence outputs).
- **Replay sessions** are read-only: they do not mutate sandbox state. Events are ordered (employment claims, overlap verifications, reviews, trust score updates, penalties, admin actions, incidents).
- **UI:** Admin → Sandbox → Replays. Create snapshot, create replay session, view timeline with before/after trust scores and reasons.
- **Why:** Forensic analysis and policy simulation without changing live data.

### 2. Rule versioning and diff engine

- **Immutable rule versions** for trust-critical rule sets: trust score formula, overlap verification, review weighting, penalty thresholds, fraud detection thresholds.
- One **active** version per environment (sandbox can run multiple in parallel).
- **Diff:** Compare Version A vs Version B (config key-level). Impact summary and sample affected users can be extended later.
- **UI:** Admin → Sandbox → Rule Versions. List versions, create version, compare two versions.
- **Why:** Policy simulator and safe rollout of rule changes.

### 3. Synthetic population generator

- Generate **synthetic users and employers** in a sandbox session (capped: 1–5000 users, 1–500 employers).
- Synthetic entities are clearly labeled (e.g. [SYNTHETIC] User N). Data never leaves sandbox.
- **UI:** Admin → Sandbox → Population Generator. Select session, set user/employer counts, Generate and Simulate.
- **Why:** Stress-test trust and overlap at scale without real user data.

### 4. Red-team mode

- **Adversarial scenarios:** Sybil attack, collusion ring, fake overlap farm, review brigade, employer collusion.
- Runs generate **abuse_signals** (sandbox-only). Detection outcome and metrics (e.g. detection latency, abuse_signals_created) are stored.
- No external notifications or real emails.
- **UI:** Admin → Sandbox → Red-Team. Select session, run scenario, view detection outcomes.
- **Why:** Identify weak points and measure detection success before real abuse.

## Integration

- Replay and red-team actions can reference **rule versions** and **sandbox snapshots**.
- All simulator tables are sandbox-only (sandbox_snapshots, sandbox_replay_sessions, sandbox_replay_events, sandbox_rule_versions, sandbox_synthetic_populations, sandbox_redteam_runs).
- Admin audit and analytics integration: use existing admin_audit_logs and is_sandbox for any new admin actions.

## Safety and guardrails

- **SANDBOX ONLY** banners on all simulator pages.
- No external notifications; no real emails; no irreversible production actions.
- Superadmin required for destructive simulations (when implemented).
- Clear separation of prod vs sandbox data; RLS and service-role-only access on simulator tables.

## Schema

See migration `20250315000000_sandbox_trust_simulator.sql` for:

- sandbox_snapshots
- sandbox_replay_sessions
- sandbox_replay_events
- sandbox_rule_versions
- sandbox_synthetic_populations
- sandbox_redteam_runs
