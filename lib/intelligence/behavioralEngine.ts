/**
 * Behavioral Intelligence Engine: extract signals from review text via OpenAI.
 * Production-only. No mock. Clamp 0–100, reject empty, fail safely.
 */

export const BEHAVIORAL_MODEL_VERSION = "behavioral_v1";

export interface BehavioralSignals {
  sentiment_score: number;
  pressure_score: number;
  structure_score: number;
  communication_score: number;
  leadership_score: number;
  reliability_score: number;
  initiative_score: number;
  conflict_indicator: number;
  tone_variance_score: number;
  anomaly_score: number;
  extraction_confidence: number;
  model_version: string;
}

const clamp = (n: number) => Math.max(0, Math.min(100, Math.round(Number(n))));

function safeNum(v: unknown): number {
  const n = Number(v);
  return Number.isFinite(n) ? clamp(n) : 50;
}

function parseSignals(raw: unknown): BehavioralSignals {
  const o = raw && typeof raw === "object" ? (raw as Record<string, unknown>) : {};
  return {
    sentiment_score: safeNum(o.sentiment_score),
    pressure_score: safeNum(o.pressure_score),
    structure_score: safeNum(o.structure_score),
    communication_score: safeNum(o.communication_score),
    leadership_score: safeNum(o.leadership_score),
    reliability_score: safeNum(o.reliability_score),
    initiative_score: safeNum(o.initiative_score),
    conflict_indicator: safeNum(o.conflict_indicator),
    tone_variance_score: safeNum(o.tone_variance_score),
    anomaly_score: safeNum(o.anomaly_score),
    extraction_confidence: safeNum(o.extraction_confidence),
    model_version: typeof o.model_version === "string" ? o.model_version : BEHAVIORAL_MODEL_VERSION,
  };
}

/**
 * Extract behavioral signals from review text using OpenAI. Structured JSON output.
 * Reject empty text. Clamp all scores 0–100. Fail safely (return null).
 */
export async function extractBehavioralSignals(
  reviewText: string
): Promise<BehavioralSignals | null> {
  const trimmed = typeof reviewText === "string" ? reviewText.trim() : "";
  if (trimmed.length === 0) return null;

  try {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      if (process.env.NODE_ENV === "development") {
        console.warn("[behavioralEngine] OPENAI_API_KEY not set");
      }
      return null;
    }

    const { default: OpenAI } = await import("openai");
    const openai = new OpenAI({ apiKey });

    const prompt = `Analyze this peer review comment and return a JSON object with exactly these numeric keys (0-100 scale): sentiment_score, pressure_score, structure_score, communication_score, leadership_score, reliability_score, initiative_score, conflict_indicator, tone_variance_score, anomaly_score, extraction_confidence. Use extraction_confidence to indicate how confident you are in the extraction (0-100). Lower conflict_indicator is better; higher reliability_score is better.

Review comment:
${trimmed.slice(0, 4000)}`;

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [{ role: "user", content: prompt }],
      response_format: { type: "json_object" },
    });

    const content = completion.choices?.[0]?.message?.content;
    if (!content) return null;

    const parsed = JSON.parse(content) as unknown;
    const signals = parseSignals(parsed);
    signals.model_version = BEHAVIORAL_MODEL_VERSION;
    return signals;
  } catch (e) {
    if (process.env.NODE_ENV === "development") {
      console.error("[behavioralEngine] extractBehavioralSignals error:", e);
    }
    return null;
  }
}
