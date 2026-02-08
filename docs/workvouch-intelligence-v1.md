# WorkVouch Intelligence Engine — v1.0

**Version:** v1  
**Owner:** WorkVouch Core  
**Status:** Canonical

---

## Objective

The WorkVouch Intelligence Engine generates a **dynamic, defensible employment confidence score** (0–100) based on:

- **Verified tenure** — length of confirmed employment
- **Peer review volume** — number of reviews from verified coworkers
- **Review sentiment** — AI-derived sentiment of review text
- **Rating distribution** — average peer rating (1–5)
- **Rehire eligibility** — whether employer would rehire
- **Cross-job consistency** — implied by tenure and volume across records

This document defines the **canonical scoring algorithm**. All production and sandbox scoring must reference this logic. **No alternative implementations are permitted.**

---

## Core Metrics

### 1. Tenure Strength (TS)

**Formula:**

```
TS = log(total_months + 1) * 10
```

**Cap:** 30 (i.e. `TS = min(log(total_months + 1) * 10, 30)`).

- **Why log:** Diminishing returns. A 12‑month tenure is a strong signal; 120 months should not dominate the score. Log compresses long tenures so tenure contributes meaningfully without overwhelming other signals.
- **Why cap:** Prevents a single factor from dominating. Cap at 30 ensures tenure cannot exceed 30 points of the raw score.
- **Why tenure cannot dominate:** The score must reflect review quality, sentiment, and rehire as well. Capping TS keeps the model balanced.

**Natural log (base e)** is used.

---

### 2. Review Volume Strength (RVS)

**Formula:**

```
RVS = min(review_count * 3, 25)
```

**Cap:** 25.

- **Diminishing influence:** Linear up to the cap; after ~8 reviews the contribution is fixed at 25. More reviews improve confidence but do not unboundedly inflate the score.
- **Anti-manipulation:** Prevents gaming by soliciting many low-quality reviews. Cap ensures volume alone cannot push the score into the highest band.

---

### 3. Sentiment Strength (SS)

**Sentiment** is normalized between **-1** (most negative) and **+1** (most positive).

**Formula:**

```
SS = sentiment_average * 20
```

**Range:** -20 to +20.

- **Negative sentiment decreases trust:** Negative reviews (SS &lt; 0) reduce the raw score; positive reviews (SS &gt; 0) increase it.
- **AI-derived only:** Sentiment must come from an AI/sentiment pipeline (e.g. behavioral engine, text analysis). Not from user-editable fields.
- **Cannot be user-edited:** The score uses system-computed sentiment only. Users cannot override sentiment for scoring.

---

### 4. Rating Strength (RS)

**Average rating** is on a 1–5 scale (peer ratings).

**Formula:**

```
RS = ((average_rating - 3) / 2) * 15
```

**Range:** -15 to +15.

- **Neutrality at 3.0:** When `average_rating = 3`, RS = 0. Ratings below 3 reduce the score; above 3 increase it.
- **Weighting logic:** The divisor 2 normalizes the 1–5 range to ±1; multiplying by 15 gives ±15 points. This keeps rating influence meaningful but bounded.

---

### 5. Rehire Multiplier (RM)

**Formula:**

```
RM = 1.1 if rehire_eligible else 0.9
```

- **Multiplier philosophy:** Rehire eligibility is a strong signal of employer satisfaction but should not replace peer evidence. Applying a multiplier (1.1 or 0.9) adjusts the final score without allowing rehire alone to determine the outcome. Positive rehire adds 10%; negative rehire subtracts 10% from the raw composite.

---

## Final Score Formula

**Raw score:**

```
RawScore = TS + RVS + SS + RS
```

**Final score:**

```
FinalScore = clamp(RawScore * RM, 0, 100)
```

**Clamp:** `clamp(x, 0, 100)` means: if `x < 0` then 0; if `x > 100` then 100; otherwise `x`. The result is rounded to the nearest integer before storage/display.

---

## Score Interpretation

| Band        | Range   | Interpretation |
|------------|---------|----------------|
| Weak       | 0–40    | Low confidence; limited tenure, volume, or negative signals. |
| Moderate   | 40–70   | Reasonable confidence; mixed or moderate signals. |
| Strong     | 70–85   | High confidence; solid tenure, volume, and positive signals. |
| Exceptional| 85–100  | Very high confidence; strong tenure, volume, sentiment, and rehire. |

---

## Fraud Resistance Rules

These are **system requirements**. Implementations must enforce them.

1. **Only coworkers with verified overlap may leave reviews.**  
   Reviews are permitted only when an employment overlap (same employer/company, overlapping dates) is verified or mutually confirmed.

2. **One review per coworker per employment overlap.**  
   Duplicate reviews (same reviewer, same reviewed, same overlap context) must be prevented.

3. **Sentiment must be AI-derived.**  
   Sentiment used in the score must come from system computation (e.g. behavioral engine, sentiment API), not from user input.

4. **Employment must be verified or mutually confirmed.**  
   Tenure and rehire inputs must come from employment records that are verified or confirmed (e.g. peer or employer confirmation).

5. **Duplicate review prevention required.**  
   The system must enforce at most one review per (reviewer, reviewed, overlap) before persisting.

**Score recalculation** must occur on:

- Review added  
- Review edited  
- Employment confirmed  
- Rehire status changed  

---

## Version

**Version:** v1  
**Owner:** WorkVouch Core  
**Status:** Canonical  

Do not alter formulas, weights, or caps without a new version and whitepaper update.
