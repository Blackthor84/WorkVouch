import type { TrustScoreComponents } from "@/lib/trustScore";

export type TrustExplanationLine = {
  kind: "positive" | "negative" | "neutral";
  text: string;
};

export type TrustBadge = {
  id: string;
  label: string;
};

/** Build user-facing explanation from existing component signals (no new weights). */
export function buildTrustExplanation(
  score: number,
  components: TrustScoreComponents,
): TrustExplanationLine[] {
  const lines: TrustExplanationLine[] = [];

  if (components.verifiedEmployments > 0) {
    lines.push({
      kind: "positive",
      text: `${components.verifiedEmployments} verified employment record${components.verifiedEmployments === 1 ? "" : "s"}`,
    });
  } else {
    lines.push({
      kind: "neutral",
      text: "No verified employment yet — add and confirm jobs to strengthen your score",
    });
  }

  if (components.referenceCount > 0) {
    lines.push({
      kind: "positive",
      text: `${components.referenceCount} coworker verification${components.referenceCount === 1 ? "" : "s"}`,
    });
    if (components.averageReferenceRating > 0) {
      lines.push({
        kind: "positive",
        text: `Average reference rating ${components.averageReferenceRating.toFixed(1)}/5`,
      });
    }
  }

  if (components.totalVerifiedYears >= 1) {
    lines.push({
      kind: "positive",
      text: `${Math.round(components.totalVerifiedYears)}+ years of verified tenure`,
    });
  }

  if (components.uniqueEmployersWithReferences >= 2) {
    lines.push({
      kind: "positive",
      text: "References from multiple employers",
    });
  }

  if (components.fraudFlagsCount > 0) {
    lines.push({
      kind: "negative",
      text: `${components.fraudFlagsCount} open dispute or fraud flag${components.fraudFlagsCount === 1 ? "" : "s"}`,
    });
  } else if (score >= 60) {
    lines.push({
      kind: "positive",
      text: "No disputed employment on record",
    });
  }

  return lines;
}

export function buildTrustBadges(components: TrustScoreComponents): TrustBadge[] {
  const badges: TrustBadge[] = [];
  if (components.verifiedEmployments > 0) {
    badges.push({ id: "verified_employment", label: "Verified Employment" });
  }
  if (components.referenceCount >= 3) {
    badges.push({ id: "strong_verifications", label: "Strong Verifications" });
  } else if (components.referenceCount > 0) {
    badges.push({ id: "verified_professional", label: "Verified Professional" });
  }
  if (components.totalVerifiedYears >= 3) {
    badges.push({ id: "long_term", label: "Long-Term Employee" });
  }
  if (
    components.verifiedEmployments >= 1 &&
    components.referenceCount >= 1 &&
    components.fraudFlagsCount === 0
  ) {
    badges.push({ id: "complete_profile", label: "Complete Profile" });
  }
  return badges;
}
