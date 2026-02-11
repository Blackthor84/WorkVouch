# Fraud risk score (intelligence v1)

## Lightweight fraud penalty

- **FRAUD_CAP**: Maximum deduction from raw score = **15** (i.e. fraud penalty is capped at 15 points).
- **Formula**: `fraudPenalty = min(fraudScore * FP_SCALE, FP_CAP)` with `FP_SCALE = 10`, `FP_CAP = 15`.
- **Final score**: `FinalScore = clamp((RawScore - fraudPenalty) * rehireMultiplier, 0, 100)`.
  - Equivalently: `RawScore = tenure + reviewVolume + sentiment + rating - fraudPenalty`; then `FinalScore = clamp(RawScore * RM, 0, 100)`.

## Fraud score derivation

`fraudScore` (input to v1) is in `[0, 1]`. It is derived from:

- Duplicate review attempts (e.g. same match + reviewer)
- Dispute count / severity
- Failed overlap confirmations (e.g. anomaly checks)

Sources in code:

- `lib/core/intelligence/adapters/production.ts`: fraud flags count → `fraudScore = min(1, fraudFlagsCount / 5)`.
- `lib/network-density.ts`: fraud confidence from cluster detection.
- `lib/admin/runAnomalyChecks.ts`: rapid_velocity, overlap failures → fraud_signals.

## Optional fraud_weight

- `ProfileInput.fraudScore` is optional; undefined → 0 penalty.
- A future `fraud_weight` (default 1) could scale: `effectivePenalty = min(fraudScore * fraud_weight * 10, 15)`.
- Intelligence engine versioning is unchanged; v1 remains the canonical formula.
