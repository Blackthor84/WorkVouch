export type ScoreType =
  | "rehire"
  | "integrity"
  | "risk"
  | "compatibility";

export interface ScoreResult {
  score: number;
  breakdown: Record<string, number>;
}
