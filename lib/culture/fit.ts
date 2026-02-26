export function cultureFitScore(input: {
  trust: number;
  confidence: number;
  reviews: number;
}): number {
  return Math.round(
    input.trust * 0.5 +
      input.confidence * 0.3 +
      Math.min(input.reviews * 5, 20)
  );
}
