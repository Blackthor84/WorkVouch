# Trust Schema — Canonical Contract

**Purpose:** Single source of truth for trust, overlap, and verification tables. No trust signal without verification. No score change without audit.

---

## Core tables

### 1. trust_scores

One row per user. Score 0–100. Every change must be audited (audit_logs, intelligence_score_history, intelligence_history).

| Column (canonical) | Type | Required | Description |
|-------------------|-----|----------|-------------|
| user_id | UUID | yes | FK profiles(id). |
| score | NUMERIC | yes | 0–100. Clamped in app. |
| job_count | INTEGER | no | Denormalized for display. |
| reference_count | INTEGER | no | |
| average_rating | NUMERIC | no | |
| calculated_at | TIMESTAMPTZ | yes | |
| version | TEXT/UUID | no | Optimistic concurrency. |
| employment_verified_count | INTEGER | no | Verified employments. |
| average_reference_rating | NUMERIC | no | |
| fraud_flags_count | INTEGER | no | Penalty input. |
| last_updated | TIMESTAMPTZ | no | |

**Invariants:** Score has min/max bounds (0, 100). Score cannot change without reason, audit log, before/after state. Admin manual adjustments require justification.

---

### 2. employment_records

User employment. company_normalized used for overlap matching.

| Column (canonical) | Type | Required | Description |
|-------------------|-----|----------|-------------|
| id | UUID | yes | Primary key. |
| user_id | UUID | yes | FK profiles(id). |
| company_name | TEXT | yes | Display. |
| company_normalized | TEXT | yes | LOWER(TRIM(company_name)); overlap key. |
| job_title | TEXT | yes | |
| start_date | DATE | yes | |
| end_date | DATE | no | Null = current. |
| verification_status | enum | yes | pending, verified, etc. |
| source | TEXT | no | user, resume, admin. |

**Overlap:** Two users overlap only if same employer (company_normalized), overlapping date range, independent confirmation (match status).

---

### 3. employment_matches

Overlap between two users at same employer with overlapping dates. Collusion-resistant: no self-verify, no circular verify.

| Column (canonical) | Type | Required | Description |
|-------------------|-----|----------|-------------|
| id | UUID | yes | Primary key. |
| employment_record_id | UUID | yes | FK employment_records(id). Owner. |
| matched_user_id | UUID | yes | FK profiles(id). Other user. |
| overlap_start | DATE | yes | Overlap window start. |
| overlap_end | DATE | yes | overlap_end >= overlap_start. |
| match_status | enum | yes | pending, confirmed. Only confirmed allows references. |
| created_at | TIMESTAMPTZ | yes | |

**Rules:** User cannot verify themselves. Reciprocal verification disallowed. Verification weight may depend on verifier trust score. Minimum overlap (e.g. 30 days) required.

---

### 4. employment_references

Peer reference for confirmed employment match only.

| Column (canonical) | Type | Required | Description |
|-------------------|-----|----------|-------------|
| id | UUID | yes | Primary key. |
| employment_match_id | UUID | yes | FK employment_matches(id). Match must be confirmed. |
| reviewer_id | UUID | yes | Who left the review. |
| reviewed_user_id | UUID | yes | Who is reviewed. |
| rating | INTEGER | yes | 1–5. CHECK. |
| reliability_score | NUMERIC | no | |
| comment | TEXT | no | |
| created_at | TIMESTAMPTZ | yes | |
| flagged | BOOLEAN | yes | Default false. Fraud suspicion. |

**Constraints:** UNIQUE(employment_match_id, reviewer_id). CHECK reviewer_id != reviewed_user_id.

---

### 5. fraud_flags

Fraud indicators; reduce trust score. Severity 1–5.

| Column (canonical) | Type | Required | Description |
|-------------------|-----|----------|-------------|
| id | UUID | yes | Primary key. |
| user_id | UUID | yes | FK profiles(id). |
| reason | TEXT | yes | |
| severity | INTEGER | yes | 1–5. CHECK. |
| created_by | TEXT | yes | system or admin_id. |
| created_at | TIMESTAMPTZ | yes | |

---

## Overlap verification stages (logical)

1. Claimed overlap (unverified): record exists; no match or pending.
2. Pending verification: employment_matches row status pending.
3. Independently verified: match_status confirmed; references count toward trust.
4. Flagged: fraud/abuse path; freeze and audit.

Fraud signals: repeated overlaps same group, short fake windows, high density in small networks, employer mismatch. Response: freeze trust, admin review, log abuse, incident if systemic.

---

## Trust score formula (canonical)

Trust Score = Base + Verifications + Reviews − Penalties + Stability (see lib/core/intelligence v1).

- Base: neutral. Verifications: capped. Reviews: weighted by reviewer trust. Penalties: outweigh gains. Stability: time-based reward.
- All changes: reason, audit log, before/after. Admin changes require justification.
