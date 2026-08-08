import { calculateTrust } from "@/lib/trust/trustEngine";
import { TrustCard } from "@/components/trust/TrustCard";

export async function TrustScoreCard({ userId }: { userId: string }) {
  const trust = await calculateTrust(userId);
  const hasScore =
    trust.score > 0 ||
    trust.components.referenceCount > 0 ||
    trust.components.verifiedEmployments > 0;

  if (!hasScore) {
    return (
      <TrustCard
        score={0}
        explanation={[
          {
            kind: "neutral",
            text: "Add confirmed employment and references to build your score.",
          },
        ]}
      />
    );
  }

  return (
    <TrustCard
      score={trust.score}
      trajectoryLabel={trust.trajectoryLabel}
      explanation={trust.explanation}
      badges={trust.badges}
    />
  );
}
